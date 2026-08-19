import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { KnowledgeItem } from '../knowledge/knowledge-item.entity';
import { KnowledgeType } from '../knowledge/knowledge-type.enum';

export type KnowledgeSessionResult = 'given' | 'other';

@Entity()
export class KnowledgeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User | null;

  @Column({ type: 'uuid', nullable: true })
  volunteerId: string | null;

  @Column({ type: 'date' })
  givenDate: string;

  @Column({ type: 'varchar' })
  mediaType: KnowledgeType;

  @ManyToOne(() => KnowledgeItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'knowledgeItemId' })
  knowledgeItem: KnowledgeItem | null;

  @Column({ type: 'uuid', nullable: true })
  knowledgeItemId: string | null;

  /** Snapshot of the item's title at the time it was given, so history stays readable even if the item is later deleted. */
  @Column({ type: 'varchar' })
  itemTitleSnapshot: string;

  @Column({ type: 'varchar' })
  result: KnowledgeSessionResult;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
