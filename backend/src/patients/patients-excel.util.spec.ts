import { buildPatientsWorkbook } from './patients-excel.util';
import { PatientStatus } from './patient-status.enum';
import { PatientSex } from './patient-sex.enum';
import { HealthRecord } from '../health-records/health-record.entity';
import { Patient } from './patient.entity';

type ExportPatient = Patient & { status: PatientStatus };

function makePatient(overrides: Partial<ExportPatient> = {}): ExportPatient {
  return {
    id: 'p1',
    code: 'CVD001',
    fullName: 'ผู้ป่วยทดสอบ',
    age: 58,
    sex: PatientSex.MALE,
    phone: null,
    address: null,
    treatmentRight: 'บัตรทอง',
    smoker: false,
    heightCm: 170,
    joinDate: '2024-01-01',
    volunteerId: 'vol-1',
    createdAt: new Date(),
    status: PatientStatus.COMPLETED,
    ...overrides,
  } as ExportPatient;
}

function makeRecord(overrides: Partial<HealthRecord>): HealthRecord {
  return {
    id: 'r',
    patientId: 'p1',
    visitNumber: 1,
    visitDate: '2024-01-15',
    weightKg: null,
    bmi: null,
    systolicBp: null,
    diastolicBp: null,
    heartRate: null,
    waistCm: null,
    dtxFpg: null,
    dtxCategory: null,
    cvdScore: null,
    cvdRiskPercent: null,
    cvdRiskLevel: null,
    selfCareBehavior: null,
    notes: null,
    q1Depressed: null,
    q2Anhedonia: null,
    createdAt: new Date(),
    ...overrides,
  } as HealthRecord;
}

describe('buildPatientsWorkbook', () => {
  it('lays out the 3-row colored header structure exactly matching the client template', () => {
    const sheet = buildPatientsWorkbook([], []).worksheets[0];

    expect(sheet.getCell('A1').value).toBe('ข้อมูลพื้นฐาน');
    expect(sheet.getCell('J1').value).toBe('ผลการคัดกรองสุขภาพ (ก่อนเข้าร่วมโครงการ)');
    expect(sheet.getCell('R1').value).toBe('การให้บริการปรับเปลี่ยนพฤติกรรมของกลุ่มเสี่ยง');
    expect(sheet.getCell('T1').value).toBe('ติดตามเยี่ยมประเมินพฤติกรรมการปฏิบัติตัว');
    expect(sheet.getCell('T2').value).toBe('ครั้งที่ 1');
    expect(sheet.getCell('X2').value).toBe('ครั้งที่ 2');
    expect(sheet.getCell('AB1').value).toBe(
      'ติดตามเยี่ยมประเมินซ้ำภายหลังได้รับการปรับเปลี่ยนพฤติกรรมสุขภาพ',
    );

    expect(sheet.getCell('A3').value).toBe('ลำดับ');
    expect(sheet.getCell('E3').value).toBe('ชื่อ-สกุล');
    expect(sheet.getCell('Q3').value).toBe('2Q (แปลผล)');
    expect(sheet.getCell('AI3').value).toBe('ผล DTX/FPG หลังปรับเปลี่ยนพฤติกรรม (mg/dL)');
  });

  it('produces zero data rows for an empty patient list without throwing', () => {
    const sheet = buildPatientsWorkbook([], []).worksheets[0];
    expect(sheet.getRow(4).getCell(5).value).toBeNull();
  });

  it('maps basic patient fields, the fixed unit info, a row sequence number, and converts visit dates to the Thai Buddhist calendar', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, visitDate: '2024-01-15', systolicBp: 138, diastolicBp: 88 });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    const row = sheet.getRow(4);

    expect(row.getCell(1).value).toBe(1); // seq
    expect(row.getCell(2).value).toBe('นครศรีธรรมราช'); // province
    expect(row.getCell(3).value).toBe('77712'); // unitCode
    expect(row.getCell(4).value).toBe('ศสม.รพ.ร่อนพิบูลย์'); // unitName
    expect(row.getCell(5).value).toBe('ผู้ป่วยทดสอบ'); // fullName
    expect(row.getCell(7).value).toBe(58); // age
    expect(row.getCell(8).value).toBe('ชาย'); // sex
    expect(row.getCell(10).value).toBe('15/01/2567'); // s1_date, Buddhist year = CE + 543
    expect(row.getCell(12).value).toBe('138/88'); // s1_bp
  });

  it('renders sex as หญิง for female patients', () => {
    const sheet = buildPatientsWorkbook([makePatient({ sex: PatientSex.FEMALE })], []).worksheets[0];
    expect(sheet.getRow(4).getCell(8).value).toBe('หญิง');
  });

  it('interprets the 2Q screen as "ไม่มี" when neither question is positive', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, q1Depressed: false, q2Anhedonia: false });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(17).value).toBe('ไม่มี'); // s1_2q
  });

  it('interprets the 2Q screen as "มีความเสี่ยง" when only one question is positive', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, q1Depressed: true, q2Anhedonia: false });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(17).value).toBe('มีความเสี่ยง');
  });

  it('interprets the 2Q screen as "มีความเสี่ยง" when both questions are positive', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, q1Depressed: true, q2Anhedonia: true });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(17).value).toBe('มีความเสี่ยง');
  });

  it('leaves the 2Q cell blank when no 2Q answers were recorded', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1 });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(17).value).toBe('');
  });

  it('reports a DTX/FPG decrease from baseline to the final visit as "ลดลง N"', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, dtxFpg: 125 });
    const v4 = makeRecord({ visitNumber: 4, dtxFpg: 110 });
    const sheet = buildPatientsWorkbook([patient], [v1, v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('ลดลง 15'); // s4_dtxDelta
  });

  it('reports a DTX/FPG increase as "เพิ่มขึ้น N"', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, dtxFpg: 100 });
    const v4 = makeRecord({ visitNumber: 4, dtxFpg: 120 });
    const sheet = buildPatientsWorkbook([patient], [v1, v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('เพิ่มขึ้น 20');
  });

  it('reports no change as "คงเดิม"', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, dtxFpg: 100 });
    const v4 = makeRecord({ visitNumber: 4, dtxFpg: 100 });
    const sheet = buildPatientsWorkbook([patient], [v1, v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('คงเดิม');
  });

  it('leaves the delta blank when either baseline or final DTX/FPG is missing', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, dtxFpg: 100 });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('');
  });

  it('translates risk level to the short client-template labels, not the app UI labels', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, cvdRiskLevel: 'high' as any });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(16).value).toBe('สูง'); // s1_riskLevel, not "เสี่ยงสูง"
  });

  it('places each patient in a separate row with a sequential row number, one row per patient regardless of visit count', () => {
    const p1 = makePatient({ id: 'p1', fullName: 'คนที่หนึ่ง' });
    const p2 = makePatient({ id: 'p2', fullName: 'คนที่สอง' });
    const records = [
      makeRecord({ patientId: 'p1', visitNumber: 1 }),
      makeRecord({ patientId: 'p1', visitNumber: 2 }),
      makeRecord({ patientId: 'p2', visitNumber: 1 }),
    ];
    const sheet = buildPatientsWorkbook([p1, p2], records).worksheets[0];
    expect(sheet.getRow(4).getCell(1).value).toBe(1); // seq
    expect(sheet.getRow(4).getCell(5).value).toBe('คนที่หนึ่ง');
    expect(sheet.getRow(5).getCell(1).value).toBe(2); // seq
    expect(sheet.getRow(5).getCell(5).value).toBe('คนที่สอง');
    expect(sheet.getRow(6).getCell(5).value).toBeNull();
  });

  it('leaves the national ID column blank (not yet collected in this system)', () => {
    const sheet = buildPatientsWorkbook([makePatient()], []).worksheets[0];
    expect(sheet.getRow(4).getCell(6).value).toBe(''); // nationalId
  });
});
