import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthRecord } from './health-record.entity';
import { PatientsService } from '../patients/patients.service';
import { User } from '../users/user.entity';
import { SaveHealthRecordDto } from './dto/save-health-record.dto';
import { classifyDtx, computeCvdRisk } from './cvd-risk.util';

@Injectable()
export class HealthRecordsService {
  constructor(
    @InjectRepository(HealthRecord)
    private readonly repo: Repository<HealthRecord>,
    private readonly patientsService: PatientsService,
  ) {}

  async findAllForPatient(patientId: string, user: User) {
    await this.patientsService.getEntity(patientId, user);
    return this.repo.find({ where: { patientId }, order: { visitNumber: 'ASC' } });
  }

  async save(patientId: string, visitNumber: number, dto: SaveHealthRecordDto, user: User) {
    if (visitNumber < 1 || visitNumber > 4) {
      throw new BadRequestException('visitNumber must be between 1 and 4');
    }
    const patient = await this.patientsService.getEntity(patientId, user);

    let record = await this.repo.findOneBy({ patientId, visitNumber });
    if (!record) {
      record = this.repo.create({ patientId, visitNumber });
    }

    record.visitDate = dto.visitDate;
    record.weightKg = dto.weightKg ?? null;
    record.systolicBp = dto.systolicBp ?? null;
    record.diastolicBp = dto.diastolicBp ?? null;
    record.heartRate = dto.heartRate ?? null;
    record.waistCm = dto.waistCm ?? null;
    record.dtxFpg = dto.dtxFpg ?? null;
    record.notes = dto.notes ?? null;
    record.dtxCategory = null;
    record.cvdScore = null;
    record.cvdRiskPercent = null;
    record.cvdRiskLevel = null;
    record.selfCareBehavior = null;
    record.q1Depressed = null;
    record.q2Anhedonia = null;

    const bmi =
      patient.heightCm && dto.weightKg
        ? Number((dto.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1))
        : null;
    record.bmi = bmi;

    if (visitNumber === 1) {
      record.q1Depressed = dto.q1Depressed ?? null;
      record.q2Anhedonia = dto.q2Anhedonia ?? null;
    }
    if (visitNumber >= 2) {
      record.selfCareBehavior = dto.selfCareBehavior ?? null;
    }

    // CVD risk is recomputed at every visit so the patient/อสม. can see the
    // trend move as behavior improves (matches client mockup: score shown
    // decreasing at each follow-up, not just baseline/final).
    if (dto.dtxFpg != null && dto.waistCm != null && dto.systolicBp != null) {
      const { score, riskPercent, level } = computeCvdRisk({
        age: patient.age,
        sex: patient.sex,
        smoker: patient.smoker,
        diabetic: dto.dtxFpg >= 126,
        systolicBp: dto.systolicBp,
        waistCm: dto.waistCm,
      });
      record.cvdScore = score;
      record.cvdRiskPercent = riskPercent;
      record.cvdRiskLevel = level;
    }
    // Post-behavior-change DTX classification is specific to the final visit.
    if (visitNumber === 4 && dto.dtxFpg != null) {
      record.dtxCategory = classifyDtx(dto.dtxFpg);
    }

    return this.repo.save(record);
  }
}
