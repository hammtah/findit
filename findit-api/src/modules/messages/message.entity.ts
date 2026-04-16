import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from '../conversations/conversation.entity';
import { User } from '../users/user.entity';

@Entity('messages')
@Index(['conversation_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'conversation_id' })
  conversation_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id' })
  sender_id: string;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url: string | null;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
