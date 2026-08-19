import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { HealthRecord } from '../health-records/health-record.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientStatus } from './patient-status.enum';
import { buildPatientsWorkbook } from './patients-excel.util';

/** Days after the last recorded visit before the next follow-up is considered due. */
const FOLLOWUP_INTERVAL_DAYS = 30;

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
    @InjectRepository(HealthRecord)
    private readonly recordRepo: Repository<HealthRecord>,
  ) {}

  async create(dto: CreatePatientDto, user: User) {
    const count = await this.repo.count();
    const code = `CVD${String(count + 1).padStart(3, '0')}`;
    const patient = this.repo.create({
      ...dto,
      code,
      volunteerId: user.id,
      joinDate: new Date().toISOString().slice(0, 10),
    });
    return this.repo.save(patient);
  }

  private statusFromMaxVisit(maxVisit?: number): PatientStatus {
    if (!maxVisit) return PatientStatus.NOT_SCREENED;
    if (maxVisit === 1) return PatientStatus.SCREENED;
    if (maxVisit >= 2 && maxVisit <= 3) return PatientStatus.TRACKING;
    return PatientStatus.COMPLETED;
  }

  private async attachStatuses(patients: Patient[]) {
    if (patients.length === 0) return [];
    const ids = patients.map((p) => p.id);
    const rows = await this.recordRepo
      .createQueryBuilder('r')
      .select('r.patientId', 'patientId')
      .addSelect('MAX(r.visitNumber)', 'maxVisit')
      .where('r.patientId IN (:...ids)', { ids })
      .groupBy('r.patientId')
      .getRawMany<{ patientId: string; maxVisit: string }>();

    const maxVisitByPatient = new Map(rows.map((r) => [r.patientId, Number(r.maxVisit)]));

    // Most recent CVD risk level per patient (visits are recomputed every time,
    // so "latest" is whichever visit with a non-null level has the highest
    // visitNumber) — used by the knowledge-education flow's risk badges.
    const riskRows = await this.recordRepo.find({
      where: { patientId: In(ids) },
      order: { visitNumber: 'ASC' },
      select: { patientId: true, visitNumber: true, cvdRiskLevel: true },
    });
    const riskLevelByPatient = new Map<string, string>();
    for (const r of riskRows) {
      if (r.cvdRiskLevel) riskLevelByPatient.set(r.patientId, r.cvdRiskLevel);
    }

    return patients.map((patient) => ({
      ...patient,
      status: this.statusFromMaxVisit(maxVisitByPatient.get(patient.id)),
      riskLevel: riskLevelByPatient.get(patient.id) ?? null,
    }));
  }

  /** Raw entity (with heightCm/age/sex/smoker) for internal use, e.g. by HealthRecordsService. */
  async getEntity(id: string, user: User): Promise<Patient> {
    const patient = await this.repo.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException('ไม่พบข้อมูลผู้รับบริการ');
    }
    if (user.role === UserRole.VOLUNTEER && patient.volunteerId !== user.id) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
    }
    return patient;
  }

  async findAllForUser(user: User, search?: string, status?: PatientStatus) {
    const qb = this.repo.createQueryBuilder('patient').orderBy('patient.createdAt', 'DESC');
    if (user.role === UserRole.VOLUNTEER) {
      qb.andWhere('patient.volunteerId = :userId', { userId: user.id });
    }
    if (search) {
      qb.andWhere('(patient.fullName ILIKE :search OR patient.code ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    const patients = await qb.getMany();
    const withStatus = await this.attachStatuses(patients);
    return status ? withStatus.filter((p) => p.status === status) : withStatus;
  }

  async findOne(id: string, user: User) {
    const patient = await this.getEntity(id, user);
    const [withStatus] = await this.attachStatuses([patient]);
    return withStatus;
  }

  async getStats(user: User) {
    const patients = await this.findAllForUser(user);
    const counts: Record<PatientStatus, number> = {
      [PatientStatus.NOT_SCREENED]: 0,
      [PatientStatus.SCREENED]: 0,
      [PatientStatus.TRACKING]: 0,
      [PatientStatus.COMPLETED]: 0,
    };
    for (const p of patients) {
      counts[p.status] += 1;
    }
    const dueToday = await this.countDueToday(patients);
    return { total: patients.length, byStatus: counts, dueToday };
  }

  /**
   * Counts patients who have had at least one visit but not all four, and whose
   * last recorded visit was FOLLOWUP_INTERVAL_DAYS or more days ago (i.e. their
   * next follow-up is due). No explicit "next due date" is stored anywhere else
   * in the schema — this derives it from the last visit date on the fly.
   */
  private async countDueToday(patients: (Patient & { status: PatientStatus })[]): Promise<number> {
    const trackableIds = patients
      .filter((p) => p.status === PatientStatus.SCREENED || p.status === PatientStatus.TRACKING)
      .map((p) => p.id);
    if (trackableIds.length === 0) return 0;

    const rows = await this.recordRepo
      .createQueryBuilder('r')
      .select('r.patientId', 'patientId')
      .addSelect('MAX(r.visitDate)', 'lastVisitDate')
      .where('r.patientId IN (:...ids)', { ids: trackableIds })
      .groupBy('r.patientId')
      .getRawMany<{ patientId: string; lastVisitDate: string }>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueToday = 0;
    for (const row of rows) {
      const dueDate = new Date(row.lastVisitDate);
      dueDate.setDate(dueDate.getDate() + FOLLOWUP_INTERVAL_DAYS);
      if (dueDate <= today) dueToday += 1;
    }
    return dueToday;
  }

  /** Number of patients each volunteer (อสม.) currently manages — used for admin workload view. */
  async countByVolunteer(): Promise<Map<string, number>> {
    const rows = await this.repo
      .createQueryBuilder('patient')
      .select('patient.volunteerId', 'volunteerId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('patient.volunteerId')
      .getRawMany<{ volunteerId: string; count: string }>();
    return new Map(rows.map((r) => [r.volunteerId, Number(r.count)]));
  }

  /**
   * Patients + their full visit history, scoped to `user` and optionally narrowed
   * to only those with at least one visit in [from, to] — the same "who was served
   * in this period" rule shared by the export preview and the export file itself.
   */
  private async loadPatientsAndRecordsForExport(user: User, from?: string, to?: string) {
    const allPatients = await this.findAllForUser(user);
    const allIds = allPatients.map((p) => p.id);
    const allRecords = allIds.length
      ? await this.recordRepo.find({
          where: { patientId: In(allIds) },
          order: { visitNumber: 'ASC' },
        })
      : [];

    let patients = allPatients;
    if (from || to) {
      const patientIdsInRange = new Set(
        allRecords
          .filter((r) => (!from || r.visitDate >= from) && (!to || r.visitDate <= to))
          .map((r) => r.patientId),
      );
      patients = allPatients.filter((p) => patientIdsInRange.has(p.id));
    }

    const ids = patients.map((p) => p.id);
    const records = allRecords.filter((r) => ids.includes(r.patientId));
    return { patients, records };
  }

  /** Lightweight preview of what an export for this date range would include — shown before downloading. */
  async previewExport(user: User, from?: string, to?: string) {
    const { patients } = await this.loadPatientsAndRecordsForExport(user, from, to);
    return {
      count: patients.length,
      patients: patients.map((p) => ({
        id: p.id,
        code: p.code,
        fullName: p.fullName,
        status: p.status,
      })),
    };
  }

  async exportExcel(user: User, from?: string, to?: string): Promise<Buffer> {
    const { patients, records } = await this.loadPatientsAndRecordsForExport(user, from, to);
    const workbook = buildPatientsWorkbook(patients, records);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
