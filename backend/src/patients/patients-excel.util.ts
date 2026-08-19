import * as ExcelJS from 'exceljs';
import { Patient } from './patient.entity';
import { PatientStatus } from './patient-status.enum';
import { HealthRecord } from '../health-records/health-record.entity';

/** Short labels matching the client's report template (distinct from the app's own "เสี่ยง..." UI labels). */
const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
  very_high: 'สูงมาก',
};

const SELF_CARE_LABEL: Record<string, string> = {
  improved: 'ดีขึ้น',
  same: 'เหมือนเดิม',
  worse: 'แย่ลง',
};

/** Fixed per-deployment values — this instance serves one specific service unit. */
const PROVINCE = 'นครศรีธรรมราช';
const UNIT_CODE = '77712';
const UNIT_NAME = 'ศสม.รพ.ร่อนพิบูลย์';

type ExportPatient = Patient & { status: PatientStatus };

function toThaiDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function bp(r: HealthRecord | undefined): string {
  if (!r || r.systolicBp == null || r.diastolicBp == null) return '';
  return `${r.systolicBp}/${r.diastolicBp}`;
}

/**
 * 2Q depression screen interpretation, per the client's decision-tree spec:
 * neither question positive -> "ไม่มี" (normal); either or both positive -> "มีความเสี่ยง".
 */
function twoQResult(r: HealthRecord | undefined): string {
  if (!r || (r.q1Depressed == null && r.q2Anhedonia == null)) return '';
  return r.q1Depressed || r.q2Anhedonia ? 'มีความเสี่ยง' : 'ไม่มี';
}

/** "ลดลง N" / "เพิ่มขึ้น N" / "คงเดิม" — change in DTX/FPG from baseline (visit 1) to the final re-assessment (visit 4). */
function dtxDelta(baseline: HealthRecord | undefined, final: HealthRecord | undefined): string {
  if (!baseline || !final || baseline.dtxFpg == null || final.dtxFpg == null) return '';
  const delta = baseline.dtxFpg - final.dtxFpg;
  if (delta > 0) return `ลดลง ${delta}`;
  if (delta < 0) return `เพิ่มขึ้น ${Math.abs(delta)}`;
  return 'คงเดิม';
}

const FILL = {
  blue: 'FF4472C4',
  blueTint: 'FFDCE6F5',
  green: 'FF70AD47',
  greenTint: 'FFE2EFDA',
  orange: 'FFFFC000',
  orangeTint: 'FFFFF2CC',
  purple: 'FF8064A2',
  purpleSub: 'FFB2A2D7',
  purpleTint: 'FFEAE5F4',
  pink: 'FFC0507D',
  pinkTint: 'FFFCE4EC',
};

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFB7B7B7' } },
  left: { style: 'thin', color: { argb: 'FFB7B7B7' } },
  bottom: { style: 'thin', color: { argb: 'FFB7B7B7' } },
  right: { style: 'thin', color: { argb: 'FFB7B7B7' } },
};

export function buildPatientsWorkbook(
  patients: ExportPatient[],
  records: HealthRecord[],
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ข้อมูลกลุ่มเสี่ยง', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // 35 columns total; widths line up with the header groups below.
  sheet.columns = [
    { key: 'seq', width: 7 },
    { key: 'province', width: 14 },
    { key: 'unitCode', width: 14 },
    { key: 'unitName', width: 20 },
    { key: 'fullName', width: 22 },
    { key: 'nationalId', width: 16 },
    { key: 'age', width: 7 },
    { key: 'sex', width: 8 },
    { key: 'treatmentRight', width: 14 },

    { key: 's1_date', width: 13 },
    { key: 's1_dtx', width: 10 },
    { key: 's1_bp', width: 12 },
    { key: 's1_bmi', width: 9 },
    { key: 's1_waist', width: 11 },
    { key: 's1_cvdScore', width: 11 },
    { key: 's1_riskLevel', width: 14 },
    { key: 's1_2q', width: 14 },

    { key: 'svc_date', width: 13 },
    { key: 'svc_activity', width: 26 },

    { key: 'f1_date', width: 13 },
    { key: 'f1_bp', width: 12 },
    { key: 'f1_waist', width: 11 },
    { key: 'f1_behavior', width: 16 },

    { key: 'f2_date', width: 13 },
    { key: 'f2_bp', width: 12 },
    { key: 'f2_waist', width: 11 },
    { key: 'f2_behavior', width: 16 },

    { key: 's4_date', width: 13 },
    { key: 's4_dtx', width: 10 },
    { key: 's4_bp', width: 12 },
    { key: 's4_bmi', width: 9 },
    { key: 's4_waist', width: 11 },
    { key: 's4_cvdScore', width: 11 },
    { key: 's4_riskLevel', width: 14 },
    { key: 's4_dtxDelta', width: 16 },
  ] as ExcelJS.Column[];

  // ---- Row 1 & 2: colored group headers ----
  const groupHeader = (
    range: string,
    title: string,
    fillArgb: string,
    fontColor = 'FFFFFFFF',
  ) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.fill = solidFill(fillArgb);
    cell.font = { bold: true, color: { argb: fontColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  };

  groupHeader('A1:I2', 'ข้อมูลพื้นฐาน', FILL.blue);
  groupHeader('J1:Q2', 'ผลการคัดกรองสุขภาพ (ก่อนเข้าร่วมโครงการ)', FILL.green);
  groupHeader('R1:S2', 'การให้บริการปรับเปลี่ยนพฤติกรรมของกลุ่มเสี่ยง', FILL.orange, 'FF000000');
  groupHeader('T1:AA1', 'ติดตามเยี่ยมประเมินพฤติกรรมการปฏิบัติตัว', FILL.purple);
  groupHeader('T2:W2', 'ครั้งที่ 1', FILL.purpleSub, 'FF3B2E63');
  groupHeader('X2:AA2', 'ครั้งที่ 2', FILL.purpleSub, 'FF3B2E63');
  groupHeader('AB1:AI2', 'ติดตามเยี่ยมประเมินซ้ำภายหลังได้รับการปรับเปลี่ยนพฤติกรรมสุขภาพ', FILL.pink);

  // ---- Row 3: field-level headers ----
  const fieldHeaders: [string, string, string][] = [
    ['seq', 'ลำดับ', FILL.blueTint],
    ['province', 'ชื่อจังหวัด', FILL.blueTint],
    ['unitCode', 'รหัสหน่วยบริการ (กำหนดไว้แล้ว)', FILL.blueTint],
    ['unitName', 'ชื่อหน่วยบริการ (กำหนดไว้แล้ว)', FILL.blueTint],
    ['fullName', 'ชื่อ-สกุล', FILL.blueTint],
    ['nationalId', 'เลขบัตรประชาชน', FILL.blueTint],
    ['age', 'อายุ', FILL.blueTint],
    ['sex', 'เพศ', FILL.blueTint],
    ['treatmentRight', 'สิทธิการรักษา', FILL.blueTint],

    ['s1_date', 'วันที่ให้บริการ', FILL.greenTint],
    ['s1_dtx', 'DTX/FPG (mg/dL)', FILL.greenTint],
    ['s1_bp', 'ความดันโลหิต (HBP) (mmHg)', FILL.greenTint],
    ['s1_bmi', 'BMI (kg/m²)', FILL.greenTint],
    ['s1_waist', 'เส้นรอบเอว (ซม.)', FILL.greenTint],
    ['s1_cvdScore', 'คะแนน CVD Risk (คะแนน)', FILL.greenTint],
    ['s1_riskLevel', 'แปลผลระดับความเสี่ยง', FILL.greenTint],
    ['s1_2q', '2Q (แปลผล)', FILL.greenTint],

    ['svc_date', 'วันที่ให้บริการ', FILL.orangeTint],
    ['svc_activity', 'กิจกรรม หรือ ผลการติดกิจกรรม', FILL.orangeTint],

    ['f1_date', 'วันที่ให้บริการ', FILL.purpleTint],
    ['f1_bp', 'ความดันโลหิต (HBP) (mmHg)', FILL.purpleTint],
    ['f1_waist', 'เส้นรอบเอว (ซม.)', FILL.purpleTint],
    ['f1_behavior', 'พฤติกรรมการปรับเปลี่ยนตนเอง', FILL.purpleTint],

    ['f2_date', 'วันที่ให้บริการ', FILL.purpleTint],
    ['f2_bp', 'ความดันโลหิต (HBP) (mmHg)', FILL.purpleTint],
    ['f2_waist', 'เส้นรอบเอว (ซม.)', FILL.purpleTint],
    ['f2_behavior', 'พฤติกรรมการปรับเปลี่ยนตนเอง', FILL.purpleTint],

    ['s4_date', 'วันที่ให้บริการ', FILL.pinkTint],
    ['s4_dtx', 'DTX/FPG (mg/dL)', FILL.pinkTint],
    ['s4_bp', 'ความดันโลหิต (HBP) (mmHg)', FILL.pinkTint],
    ['s4_bmi', 'BMI (kg/m²)', FILL.pinkTint],
    ['s4_waist', 'เส้นรอบเอว (ซม.)', FILL.pinkTint],
    ['s4_cvdScore', 'คะแนนCVD Risk (คะแนน)', FILL.pinkTint],
    ['s4_riskLevel', 'แปลผลระดับความเสี่ยง', FILL.pinkTint],
    ['s4_dtxDelta', 'ผล DTX/FPG หลังปรับเปลี่ยนพฤติกรรม (mg/dL)', FILL.pinkTint],
  ];

  const headerRow = sheet.getRow(3);
  fieldHeaders.forEach(([key, label, tint], idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.fill = solidFill(tint);
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 42;
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 20;

  // apply border to the merged group-header cells too
  for (let col = 1; col <= 35; col += 1) {
    for (let row = 1; row <= 2; row += 1) {
      sheet.getRow(row).getCell(col).border = THIN_BORDER;
    }
  }

  // ---- Data rows ----
  const recordsByPatient = new Map<string, Map<number, HealthRecord>>();
  for (const r of records) {
    if (!recordsByPatient.has(r.patientId)) recordsByPatient.set(r.patientId, new Map());
    recordsByPatient.get(r.patientId)!.set(r.visitNumber, r);
  }

  let rowIndex = 4;
  let seq = 1;
  for (const p of patients) {
    const visits = recordsByPatient.get(p.id) ?? new Map<number, HealthRecord>();
    const v1 = visits.get(1);
    const v2 = visits.get(2);
    const v3 = visits.get(3);
    const v4 = visits.get(4);

    const row = sheet.getRow(rowIndex);
    row.values = {
      seq,
      province: PROVINCE,
      unitCode: UNIT_CODE,
      unitName: UNIT_NAME,
      fullName: p.fullName,
      nationalId: '',
      age: p.age,
      sex: p.sex === 'male' ? 'ชาย' : 'หญิง',
      treatmentRight: p.treatmentRight ?? '',

      s1_date: toThaiDate(v1?.visitDate),
      s1_dtx: v1?.dtxFpg ?? '',
      s1_bp: bp(v1),
      s1_bmi: v1?.bmi ?? '',
      s1_waist: v1?.waistCm ?? '',
      s1_cvdScore: v1?.cvdScore ?? '',
      s1_riskLevel: v1?.cvdRiskLevel ? RISK_LEVEL_LABEL[v1.cvdRiskLevel] : '',
      s1_2q: twoQResult(v1),

      svc_date: '',
      svc_activity: '',

      f1_date: toThaiDate(v2?.visitDate),
      f1_bp: bp(v2),
      f1_waist: v2?.waistCm ?? '',
      f1_behavior: v2?.selfCareBehavior ? SELF_CARE_LABEL[v2.selfCareBehavior] : '',

      f2_date: toThaiDate(v3?.visitDate),
      f2_bp: bp(v3),
      f2_waist: v3?.waistCm ?? '',
      f2_behavior: v3?.selfCareBehavior ? SELF_CARE_LABEL[v3.selfCareBehavior] : '',

      s4_date: toThaiDate(v4?.visitDate),
      s4_dtx: v4?.dtxFpg ?? '',
      s4_bp: bp(v4),
      s4_bmi: v4?.bmi ?? '',
      s4_waist: v4?.waistCm ?? '',
      s4_cvdScore: v4?.cvdScore ?? '',
      s4_riskLevel: v4?.cvdRiskLevel ? RISK_LEVEL_LABEL[v4.cvdRiskLevel] : '',
      s4_dtxDelta: dtxDelta(v1, v4),
    };
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    row.getCell('fullName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('unitName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('svc_activity').alignment = { vertical: 'middle', horizontal: 'left' };
    rowIndex += 1;
    seq += 1;
  }

  return workbook;
}
