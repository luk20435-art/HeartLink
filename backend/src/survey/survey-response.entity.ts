import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // 20-item scored questionnaire (see README "แบบประเมินความพึงพอใจ") — 1-5 each,
  // grouped into 4 sections: q1-5 เนื้อหาและข้อมูล, q6-10 ประสิทธิภาพและการทำงาน,
  // q11-15 ความง่ายในการใช้งานและการออกแบบ, q16-20 ประโยชน์และความพึงพอใจโดยรวม.
  @Column({ type: 'int' })
  q1: number;

  @Column({ type: 'int' })
  q2: number;

  @Column({ type: 'int' })
  q3: number;

  @Column({ type: 'int' })
  q4: number;

  @Column({ type: 'int' })
  q5: number;

  @Column({ type: 'int' })
  q6: number;

  @Column({ type: 'int' })
  q7: number;

  @Column({ type: 'int' })
  q8: number;

  @Column({ type: 'int' })
  q9: number;

  @Column({ type: 'int' })
  q10: number;

  @Column({ type: 'int' })
  q11: number;

  @Column({ type: 'int' })
  q12: number;

  @Column({ type: 'int' })
  q13: number;

  @Column({ type: 'int' })
  q14: number;

  @Column({ type: 'int' })
  q15: number;

  @Column({ type: 'int' })
  q16: number;

  @Column({ type: 'int' })
  q17: number;

  @Column({ type: 'int' })
  q18: number;

  @Column({ type: 'int' })
  q19: number;

  @Column({ type: 'int' })
  q20: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
