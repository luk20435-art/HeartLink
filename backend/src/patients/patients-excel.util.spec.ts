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

  it('reports "ปกติ (<100 mg/dl)" when the final DTX/FPG is normal', () => {
    const patient = makePatient();
    const v4 = makeRecord({ visitNumber: 4, dtxCategory: 'normal' as any });
    const sheet = buildPatientsWorkbook([patient], [v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('ปกติ (<100 mg/dl)'); // s4_dtxDelta
  });

  it('reports "เสี่ยง (=100-125 mg/dl)" when the final DTX/FPG is at_risk', () => {
    const patient = makePatient();
    const v4 = makeRecord({ visitNumber: 4, dtxCategory: 'at_risk' as any });
    const sheet = buildPatientsWorkbook([patient], [v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('เสี่ยง (=100-125 mg/dl)');
  });

  it('reports "สงสัยป่วย (>=126 mg/dl)" when the final DTX/FPG is suspected', () => {
    const patient = makePatient();
    const v4 = makeRecord({ visitNumber: 4, dtxCategory: 'suspected' as any });
    const sheet = buildPatientsWorkbook([patient], [v4]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('สงสัยป่วย (>=126 mg/dl)');
  });

  it('leaves the result blank when visit 4 has no DTX/FPG category yet', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, dtxFpg: 100 });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(35).value).toBe('');
  });

  it('translates risk level to the client-template labels with percent ranges, not the app UI labels', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, cvdRiskLevel: 'high' as any });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(16).value).toBe('เสี่ยงสูง (>20%)'); // s1_riskLevel, not "เสี่ยงสูง"
  });

  it('collapses very_high into the same "เสี่ยงสูง (>20%)" bucket as high, since the template only has 3 tiers', () => {
    const patient = makePatient();
    const v1 = makeRecord({ visitNumber: 1, cvdRiskLevel: 'very_high' as any });
    const sheet = buildPatientsWorkbook([patient], [v1]).worksheets[0];
    expect(sheet.getRow(4).getCell(16).value).toBe('เสี่ยงสูง (>20%)');
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
