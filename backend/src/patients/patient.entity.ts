import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PatientSex } from './patient-sex.enum';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  fullName: string;

  @Column()
  age: number;

  @Column({ type: 'varchar' })
  sex: PatientSex;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  treatmentRight: string | null;

  @Column({ default: false })
  smoker: boolean;

  @Column({ type: 'float', nullable: true })
  heightCm: number | null;

  @Column({ type: 'date' })
  joinDate: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column()
  volunteerId: string;

  @CreateDateColumn()
  createdAt: Date;
}
