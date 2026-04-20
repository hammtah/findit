import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  Report,
  ReportCategorie,
  ReportStatut,
  ReportType,
} from './report.entity';
import { User } from '../users/user.entity';
import { Match } from '../matching/match.entity';
import {
  Conversation,
  ConversationStatut,
} from '../conversations/conversation.entity';
import { Review } from '../reviews/review.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateReportDto) {
    const photos = dto.photos ?? [];
    this.logger.log(
      `Create start userId=${userId} type=${dto.type} photos=${photos.length} lat=${dto.latitude} lng=${dto.longitude}`,
    );

    this.ensureDateNotFuture(dto.date_evenement);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.is_active) {
      this.logger.warn(`Create blocked userId=${userId} reason=INACTIVE_ACCOUNT`);
      throw new ForbiddenException('Inactive account');
    }

    user.reports_count += 1;
    // const moderationThreshold =
    //   this.configService.get<number>('app.moderationNewUserReports') ?? 3;
    // const moderationPending = user.reports_count <= moderationThreshold;

    const reportToCreate = this.reportsRepository.create();
    reportToCreate.user_id = userId;
    reportToCreate.type = dto.type;
    reportToCreate.titre = dto.titre.trim();
    reportToCreate.description = dto.description.trim();
    reportToCreate.categorie = dto.categorie;
    reportToCreate.date_evenement = dto.date_evenement;
    reportToCreate.heure_evenement = dto.heure_evenement ?? null;
    reportToCreate.adresse = dto.adresse;
    reportToCreate.photos = photos;
    // reportToCreate.moderation_pending = moderationPending;
    // reportToCreate.is_visible = !moderationPending;
    reportToCreate.moderation_pending = false;
    reportToCreate.is_visible = true;

    const report = await this.reportsRepository.save(reportToCreate);
    this.logger.log(`Create persisted reportId=${report.id} userId=${userId}`);

    await Promise.all([
      this.usersRepository.save(user),
      this.reportsRepository.query(
        `UPDATE reports
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
         WHERE id = $3`,
        [dto.longitude, dto.latitude, report.id],
      ),
    ]);

    const created = await this.reportsRepository.findOneOrFail({
      where: { id: report.id },
      relations: ['user'],
    });

    if (created.is_visible) {
      this.eventEmitter.emit('report.created', created);
    }

    this.logger.log(`Create success reportId=${created.id} userId=${userId} type=${created.type}`);

    return this.serializeReportDetail(created, null, [], null);
  }

  async list(currentUserId: string, query: ListReportsQueryDto) {
    await this.ensureUserExists(currentUserId);

    const { lat, lng } = await this.resolveCoordinates(
      query.lat,
      query.lng,
      query.manual_address,
    );

    const radius = Math.min(query.radius ?? 10000, 50000);
    const type = query.type ?? 'lost';
    const statut = query.statut ?? 'en_attente';
    const dateRange = query.date_range ?? 'all';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const offset = (page - 1) * limit;

    const qb = this.reportsRepository
      .createQueryBuilder('r')
      .innerJoin(User, 'u', 'u.id = r.user_id')
      .select('r.id', 'id')
      .addSelect('r.type', 'type')
      .addSelect('r.titre', 'titre')
      .addSelect('r.categorie', 'categorie')
      .addSelect('r.statut', 'statut')
      .addSelect('r.adresse', 'adresse')
      .addSelect('r.photos', 'photos')
      .addSelect('r.date_evenement', 'date_evenement')
      .addSelect('r.created_at', 'created_at')
      .addSelect('ST_Y(r.location::geometry)', 'latitude')
      .addSelect('ST_X(r.location::geometry)', 'longitude')
      .addSelect('u.nom', 'user_nom')
      .addSelect('u.photo_url', 'user_photo')
      .addSelect(
        `ST_Distance(r.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
        'distance_meters',
      )
      .where('r.is_visible = true')
      .andWhere('r.moderation_pending = false')
      .andWhere(
        `ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
      )
      .setParameters({ lng, lat, radius });

    if (type !== 'all') {
      qb.andWhere('r.type = :type', { type });
    }
    if (query.categorie) {
      qb.andWhere('r.categorie = :categorie', { categorie: query.categorie });
    }
    if (statut !== 'all') {
      qb.andWhere('r.statut = :statut', { statut });
    }
    if (dateRange === 'today') {
      qb.andWhere('r.date_evenement >= CURRENT_DATE');
    } else if (dateRange === '7days') {
      qb.andWhere(`r.date_evenement >= CURRENT_DATE - INTERVAL '7 days'`);
    } else if (dateRange === '30days') {
      qb.andWhere(`r.date_evenement >= CURRENT_DATE - INTERVAL '30 days'`);
    }

    const countQb = qb.clone();
    const total = await countQb.getCount();

    const rows = await qb
      .orderBy('distance_meters', 'ASC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{
        id: string;
        type: ReportType;
        titre: string;
        categorie: ReportCategorie;
        statut: ReportStatut;
        adresse: string;
        photos: string[];
        date_evenement: string;
        created_at: Date;
        distance_meters: string;
        latitude: string | null;
        longitude: string | null;
        user_nom: string;
        user_photo: string | null;
      }>();

    return {
      data: rows.map((row) => ({
        id: row.id,
        type: row.type,
        titre: row.titre,
        categorie: row.categorie,
        statut: row.statut,
        adresse: row.adresse,
        distance_meters: Math.round(Number.parseFloat(row.distance_meters)),
        first_photo_url: row.photos?.[0] ?? null,
        date_evenement: row.date_evenement,
        created_at: row.created_at,
        latitude: row.latitude !== null ? Number.parseFloat(row.latitude) : undefined,
        longitude: row.longitude !== null ? Number.parseFloat(row.longitude) : undefined,
        user: {
          nom: row.user_nom,
          photo_url: row.user_photo,
        },
      })),
      meta: {
        total,
        page,
        last_page: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async detail(currentUserId: string, reportId: string) {
    await this.ensureUserExists(currentUserId);

    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['user'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const canSee = report.is_visible || report.user_id === currentUserId;
    if (!canSee) {
      throw new NotFoundException('Report not found');
    }

    const [userNoteFiabilite, matches, conversation] = await Promise.all([
      this.computeReliability(report.user_id),
      report.type === ReportType.LOST
        ? this.getTopMatchesForLost(report.id)
        : [],
      this.findConversationForUserAndReport(currentUserId, report.id),
    ]);

    return this.serializeReportDetail(
      report,
      userNoteFiabilite,
      matches,
      conversation?.id ?? null,
    );
  }

  async update(currentUserId: string, reportId: string, dto: UpdateReportDto) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.user_id !== currentUserId) {
      throw new ForbiddenException();
    }

    if (dto.date_evenement) {
      this.ensureDateNotFuture(dto.date_evenement);
    }

    if (typeof dto.titre === 'string') {
      report.titre = dto.titre.trim();
    }
    if (typeof dto.description === 'string') {
      report.description = dto.description.trim();
    }
    if (dto.categorie) {
      report.categorie = dto.categorie;
    }
    if (dto.date_evenement) {
      report.date_evenement = dto.date_evenement;
    }
    if (dto.heure_evenement !== undefined) {
      report.heure_evenement = dto.heure_evenement ?? null;
    }
    if (typeof dto.adresse === 'string') {
      report.adresse = dto.adresse;
    }
    if (dto.photos) {
      report.photos = dto.photos;
    }

    await this.reportsRepository.save(report);

    if (typeof dto.latitude === 'number' && typeof dto.longitude === 'number') {
      await this.reportsRepository.query(
        `UPDATE reports
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
         WHERE id = $3`,
        [dto.longitude, dto.latitude, report.id],
      );
    }

    return this.detail(currentUserId, report.id);
  }

  async updateStatus(
    currentUserId: string,
    reportId: string,
    dto: UpdateReportStatusDto,
  ) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.user_id !== currentUserId) {
      throw new ForbiddenException();
    }

    if (report.type === ReportType.LOST && dto.statut !== ReportStatut.RESOLU) {
      throw new BadRequestException('Lost report can only be marked as resolu');
    }
    if (report.type === ReportType.FOUND && dto.statut !== ReportStatut.RENDU) {
      throw new BadRequestException('Found report can only be marked as rendu');
    }

    report.statut = dto.statut;
    await this.reportsRepository.save(report);

    const linkedConversations = await this.conversationsRepository.find({
      where: [{ report_lost_id: report.id }, { report_found_id: report.id }],
    });

    if (linkedConversations.length > 0) {
      const ids = linkedConversations.map((conversation) => conversation.id);

      await this.conversationsRepository
        .createQueryBuilder()
        .update(Conversation)
        .set({ statut: ConversationStatut.LECTURE_SEULE })
        .where('id IN (:...ids)', { ids })
        .execute();

      const rows = await this.conversationsRepository
        .createQueryBuilder('c')
        .innerJoin(Report, 'lost', 'lost.id = c.report_lost_id')
        .innerJoin(Report, 'found', 'found.id = c.report_found_id')
        .select('c.id', 'id')
        .addSelect('lost.statut', 'lost_statut')
        .addSelect('found.statut', 'found_statut')
        .where('c.id IN (:...ids)', { ids })
        .getRawMany<{
          id: string;
          lost_statut: ReportStatut;
          found_statut: ReportStatut;
        }>();

      for (const row of rows) {
        const bothResolved =
          [ReportStatut.RESOLU, ReportStatut.RENDU].includes(row.lost_statut) &&
          [ReportStatut.RESOLU, ReportStatut.RENDU].includes(row.found_statut);

        if (bothResolved) {
          this.eventEmitter.emit('conversation.resolved', {
            conversationId: row.id,
          });
        }
      }
    }

    return { message: 'Status updated' };
  }

  async remove(currentUserId: string, reportId: string) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.user_id !== currentUserId) {
      throw new ForbiddenException();
    }

    report.is_visible = false;
    await this.reportsRepository.save(report);

    return { message: 'Report deleted' };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.is_active) {
      throw new ForbiddenException('Inactive account');
    }
  }

  private ensureDateNotFuture(dateEvenement: string): void {
    const today = new Date().toISOString().slice(0, 10);
    if (dateEvenement > today) {
      throw new BadRequestException({ code: 'DATE_IN_FUTURE' });
    }
  }

  private async resolveCoordinates(
    lat?: number,
    lng?: number,
    manualAddress?: string,
  ): Promise<{ lat: number; lng: number }> {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }

    if (!manualAddress) {
      throw new BadRequestException('lat/lng or manual_address is required');
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(manualAddress)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'findit-api/1.0' },
    });

    if (!response.ok) {
      throw new BadRequestException('Unable to geocode address');
    }

    const payloadRaw: unknown = await response.json();
    if (!Array.isArray(payloadRaw)) {
      throw new BadRequestException('Unable to geocode address');
    }

    const payload = payloadRaw as Array<{ lat?: string; lon?: string }>;
    const first = payload[0];
    if (!first) {
      throw new BadRequestException('Unable to geocode address');
    }

    if (typeof first.lat !== 'string' || typeof first.lon !== 'string') {
      throw new BadRequestException('Unable to geocode address');
    }

    return {
      lat: Number.parseFloat(first.lat),
      lng: Number.parseFloat(first.lon),
    };
  }

  private async computeReliability(userId: string): Promise<number | null> {
    const stats = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'count')
      .addSelect('AVG(review.note)', 'avg')
      .where('review.reviewed_id = :userId', { userId })
      .getRawOne<{ count: string; avg: string | null }>();

    const count = Number.parseInt(stats?.count ?? '0', 10);
    if (count < 3) {
      return null;
    }

    const avg = Number.parseFloat(stats?.avg ?? '0');
    return Number.isFinite(avg) ? Number(avg.toFixed(2)) : null;
  }

  private async getTopMatchesForLost(reportLostId: string) {
    const matches = await this.matchesRepository.find({
      where: { report_lost_id: reportLostId },
      relations: ['reportFound'],
      order: { score: 'DESC' },
      take: 5,
    });

    if (matches.length === 0) {
      return [];
    }

    const distancesRaw: unknown = await this.reportsRepository.query(
      `SELECT m.id AS match_id,
              ST_Distance(rf.location, rl.location) AS distance_meters
       FROM matches m
       JOIN reports rf ON rf.id = m.report_found_id
       JOIN reports rl ON rl.id = m.report_lost_id
       WHERE m.id = ANY($1::uuid[])`,
      [matches.map((match) => match.id)],
    );

    const distances = Array.isArray(distancesRaw)
      ? (distancesRaw as Array<{ match_id: string; distance_meters: string }>)
      : [];

    const distanceMap = new Map<string, number>(
      distances.map((row: { match_id: string; distance_meters: string }) => [
        row.match_id,
        Math.round(Number.parseFloat(row.distance_meters)),
      ]),
    );

    return matches.map((match) => ({
      id: match.id,
      report_found: {
        id: match.reportFound.id,
        titre: match.reportFound.titre,
        adresse: match.reportFound.adresse,
        first_photo_url: match.reportFound.photos?.[0] ?? null,
      },
      score: Number(match.score),
      distance_meters: distanceMap.get(match.id) ?? null,
    }));
  }

  private findConversationForUserAndReport(userId: string, reportId: string) {
    return this.conversationsRepository
      .createQueryBuilder('c')
      .where(
        '(c.report_lost_id = :reportId OR c.report_found_id = :reportId)',
        {
          reportId,
        },
      )
      .andWhere('(c.initiator_id = :userId OR c.receiver_id = :userId)', {
        userId,
      })
      .getOne();
  }

  private async serializeReportDetail(
    report: Report,
    userNoteFiabilite: number | null,
    matches: Array<{
      id: string;
      report_found: {
        id: string;
        titre: string;
        adresse: string;
        first_photo_url: string | null;
      };
      score: number;
      distance_meters: number | null;
    }>,
    myConversationId: string | null,
  ) {
    const user =
      report.user ??
      (await this.usersRepository.findOne({ where: { id: report.user_id } }));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const noteFiabilite =
      userNoteFiabilite === null
        ? await this.computeReliability(user.id)
        : userNoteFiabilite;

    const coordinates = await this.getReportCoordinates(report.id);

    return {
      id: report.id,
      type: report.type,
      titre: report.titre,
      description: report.description,
      categorie: report.categorie,
      statut: report.statut,
      adresse: report.adresse,
      photos: report.photos,
      date_evenement: report.date_evenement,
      heure_evenement: report.heure_evenement,
      created_at: report.created_at,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      user: {
        id: user.id,
        nom: user.nom,
        photo_url: user.photo_url,
        note_fiabilite: noteFiabilite,
      },
      matches: report.type === ReportType.LOST ? matches : [],
      my_conversation_id: myConversationId,
    };
  }

  private async getReportCoordinates(reportId: string): Promise<{
    latitude: number | null;
    longitude: number | null;
  }> {
    const rows = await this.reportsRepository.query(
      `SELECT ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude
       FROM reports
       WHERE id = $1`,
      [reportId],
    );

    const row = rows[0] as { latitude: string | null; longitude: string | null } | undefined;
    if (!row || row.latitude === null || row.longitude === null) {
      return { latitude: null, longitude: null };
    }

    return {
      latitude: Number.parseFloat(row.latitude),
      longitude: Number.parseFloat(row.longitude),
    };
  }
}
