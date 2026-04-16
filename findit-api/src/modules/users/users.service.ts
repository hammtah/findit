import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { Review } from '../reviews/review.entity';
import { Report, ReportStatut, ReportType } from '../reports/report.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { MyHistoryQueryDto } from './dto/my-history-query.dto';

export interface HistorySummary {
  id: string;
  type: ReportType;
  titre: string;
  categorie: string | null;
  statut: ReportStatut;
  adresse: string;
  first_photo_url: string | null;
  date_evenement: string;
  created_at: Date;
}

export interface PagedHistoryResponse {
  data: HistorySummary[];
  meta: {
    total: number;
    page: number;
    last_page: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async getMe(userId: string) {
    const user = await this.findActiveUser(userId);
    const [noteFiabilite, nbObjetsResolus] = await Promise.all([
      this.computeReliability(user.id),
      this.computeResolvedReportsCount(user.id),
    ]);

    return {
      id: user.id,
      nom: user.nom,
      email: user.email,
      photo_url: user.photo_url,
      note_fiabilite: noteFiabilite,
      date_inscription: user.date_inscription,
      nb_objets_resolus: nbObjetsResolus,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.findActiveUser(userId);

    if (typeof dto.nom === 'string') {
      user.nom = dto.nom.trim();
    }
    if (typeof dto.photo_url === 'string') {
      user.photo_url = dto.photo_url;
    }

    await this.usersRepository.save(user);
    return this.getMe(userId);
  }

  async updatePushToken(userId: string, dto: UpdatePushTokenDto) {
    const user = await this.findActiveUser(userId);

    if (dto.push_token === null) {
      user.push_token = null;
    } else if (typeof dto.push_token === 'string') {
      user.push_token = dto.push_token;
    } else {
      user.push_token = null;
    }

    await this.usersRepository.save(user);
    return { message: 'Push token updated' };
  }

  async deleteMe(userId: string) {
    const user = await this.findActiveUser(userId);

    user.is_active = false;
    user.email = `deleted_${user.id}@deleted.com`;
    user.nom = 'Utilisateur supprimé';
    user.photo_url = null;
    user.push_token = null;

    await Promise.all([
      this.usersRepository.save(user),
      this.refreshTokensRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revoked: true })
        .where('user_id = :userId', { userId })
        .andWhere('revoked = false')
        .execute(),
    ]);

    return { message: 'Account deleted' };
  }

  async getMyHistory(
    userId: string,
    query: MyHistoryQueryDto,
  ): Promise<PagedHistoryResponse> {
    await this.findActiveUser(userId);

    const type = query.type ?? 'all';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: {
      user_id: string;
      type?: ReportType;
    } = { user_id: userId };

    if (type !== 'all') {
      where.type = type as ReportType;
    }

    const [reports, total] = await this.reportsRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    const data: HistorySummary[] = reports.map((report) => ({
      id: report.id,
      type: report.type,
      titre: report.titre,
      categorie: report.categorie ?? null,
      statut: report.statut,
      adresse: report.adresse,
      first_photo_url: report.photos?.[0] ?? null,
      date_evenement: report.date_evenement,
      created_at: report.created_at,
    }));

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getPublicProfile(requestingUserId: string, targetUserId: string) {
    await this.findActiveUser(requestingUserId);

    const user = await this.usersRepository.findOne({
      where: { id: targetUserId, is_active: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [noteFiabilite, nbObjetsResolus] = await Promise.all([
      this.computeReliability(user.id),
      this.computeResolvedReportsCount(user.id),
    ]);

    return {
      id: user.id,
      nom: user.nom,
      photo_url: user.photo_url,
      note_fiabilite: noteFiabilite,
      nb_objets_resolus: nbObjetsResolus,
      date_inscription: user.date_inscription,
    };
  }

  private async findActiveUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Inactive account');
    }

    return user;
  }

  private async computeResolvedReportsCount(userId: string): Promise<number> {
    return this.reportsRepository.count({
      where: {
        user_id: userId,
        statut: In([ReportStatut.RESOLU, ReportStatut.RENDU]),
      },
    });
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
}
