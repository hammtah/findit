import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ReportType {
  LOST = 'lost',
  FOUND = 'found',
}

export enum ReportCategorie {
  CLES = 'cles',
  ELECTRONIQUE = 'electronique',
  VETEMENTS = 'vetements',
  PAPIERS = 'papiers',
  ANIMAUX = 'animaux',
  SAC = 'sac',
  BIJOUX = 'bijoux',
  AUTRE = 'autre',
}

export enum ReportStatut {
  EN_ATTENTE = 'en_attente',
  RESOLU = 'resolu',
  RENDU = 'rendu',
}

@Entity('reports')
@Index(['type', 'statut', 'is_visible'])
@Index(['user_id'])
@Index(['categorie'])
@Index(['created_at'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'varchar', length: 80 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ReportCategorie, nullable: true })
  categorie: ReportCategorie | null;

  @Column({ type: 'date' })
  date_evenement: string;

  @Column({ type: 'time', nullable: true })
  heure_evenement: string | null;

  @Column({ type: 'varchar' })
  adresse: string;

  // Colonne PostGIS — gérée via raw queries pour insert/select
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: object | null;

  @Column({ type: 'text', array: true, default: '{}' })
  photos: string[];

  @Column({
    type: 'enum',
    enum: ReportStatut,
    default: ReportStatut.EN_ATTENTE,
  })
  statut: ReportStatut;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @Column({ type: 'boolean', default: false })
  moderation_pending: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
