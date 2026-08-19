import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { CvdRiskLevel, DtxCategory } from './cvd-risk.util';

export type SelfCareBehavior = 'improved' | 'same' | 'worse';

@Entity()
@Unique(['patientId', 'visitNumber'])
export class HealthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: string;

  @Column({ type: 'int' })
  visitNumber: number;

  @Column({ type: 'date' })
  visitDate: string;

  @Column({ type: 'float', nullable: true })
  weightKg: number | null;

  @Column({ type: 'float', nullable: true })
  bmi: number | null;

  @Column({ type: 'int', nullable: true })
  systolicBp: number | null;

  @Column({ type: 'int', nullable: true })
  diastolicBp: number | null;

  @Column({ type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'float', nullable: true })
  waistCm: number | null;

  @Column({ type: 'int', nullable: true })
  dtxFpg: number | null;

  @Column({ type: 'varchar', nullable: true })
  dtxCategory: DtxCategory | null;

  @Column({ type: 'float', nullable: true })
  cvdScore: number | null;

  @Column({ type: 'float', nullable: true })
  cvdRiskPercent: number | null;

  @Column({ type: 'varchar', nullable: true })
  cvdRiskLevel: CvdRiskLevel | null;

  @Column({ type: 'varchar', nullable: true })
  selfCareBehavior: SelfCareBehavior | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', nullable: true })
  q1Depressed: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  q2Anhedonia: boolean | null;

  @CreateDateColumn()
  createdAt: Date;
}
