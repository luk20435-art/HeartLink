import { classifyDtx, computeCvdRisk } from './cvd-risk.util';

/**
 * Expected values below were computed independently in plain Node from the official
 * calculator's own published formula (waist-circumference branch of `TASCVDformular`,
 * https://www.rama.mahidol.ac.th/cardio_vascular_risk/thai_cv_risk_score/scripts/formular.js),
 * NOT by running this file's implementation — so a passing test here means our TS port
 * actually reproduces the official tool's math, not just its own past output.
 */
describe('computeCvdRisk (official Thai CV Risk Score, waist-circumference variant)', () => {
  it('matches the official formula for a low-risk young woman', () => {
    const result = computeCvdRisk({
      age: 30,
      sex: 'female',
      smoker: false,
      diabetic: false,
      systolicBp: 110,
      waistCm: 70,
    });
    expect(result.score).toBeCloseTo(5.647, 3);
    expect(result.riskPercent).toBeCloseTo(0.7, 1);
    expect(result.level).toBe('low');
  });

  it('matches the official formula for a medium-risk case', () => {
    const result = computeCvdRisk({
      age: 55,
      sex: 'male',
      smoker: false,
      diabetic: false,
      systolicBp: 140,
      waistCm: 90,
    });
    expect(result.score).toBeCloseTo(8.667, 3);
    expect(result.riskPercent).toBeCloseTo(13.1, 1);
    expect(result.level).toBe('medium');
  });

  it('matches the official formula for a high-risk case', () => {
    const result = computeCvdRisk({
      age: 62,
      sex: 'male',
      smoker: false,
      diabetic: false,
      systolicBp: 150,
      waistCm: 95,
    });
    expect(result.score).toBeCloseTo(9.52, 3);
    expect(result.riskPercent).toBeCloseTo(28.0, 1);
    expect(result.level).toBe('high');
  });

  it('matches the official formula for a very-high-risk case (smoker + diabetic + elevated BP/waist)', () => {
    const result = computeCvdRisk({
      age: 60,
      sex: 'male',
      smoker: true,
      diabetic: true,
      systolicBp: 150,
      waistCm: 95,
    });
    expect(result.score).toBeCloseTo(10.411, 3);
    expect(result.riskPercent).toBeCloseTo(55.1, 1);
    expect(result.level).toBe('very_high');
  });

  it('classifies risk level from the predicted risk fraction, not from the raw score', () => {
    // two different input combos landing in the same "low" bucket should both say low
    const a = computeCvdRisk({
      age: 30,
      sex: 'female',
      smoker: false,
      diabetic: false,
      systolicBp: 110,
      waistCm: 70,
    });
    const b = computeCvdRisk({
      age: 45,
      sex: 'female',
      smoker: false,
      diabetic: false,
      systolicBp: 120,
      waistCm: 75,
    });
    expect(a.level).toBe('low');
    expect(b.level).toBe('low');
    expect(a.score).not.toBeCloseTo(b.score, 1);
  });

  it('increases risk for a male vs an otherwise identical female', () => {
    const base = { age: 50, smoker: false, diabetic: false, systolicBp: 130, waistCm: 85 };
    const female = computeCvdRisk({ ...base, sex: 'female' });
    const male = computeCvdRisk({ ...base, sex: 'male' });
    expect(male.riskPercent).toBeGreaterThan(female.riskPercent);
  });

  it('increases risk for a smoker vs an otherwise identical non-smoker', () => {
    const base = { age: 50, sex: 'male' as const, diabetic: false, systolicBp: 130, waistCm: 85 };
    const nonSmoker = computeCvdRisk({ ...base, smoker: false });
    const smoker = computeCvdRisk({ ...base, smoker: true });
    expect(smoker.riskPercent).toBeGreaterThan(nonSmoker.riskPercent);
  });

  it('increases risk for a diabetic vs an otherwise identical non-diabetic', () => {
    const base = { age: 50, sex: 'male' as const, smoker: false, systolicBp: 130, waistCm: 85 };
    const nonDiabetic = computeCvdRisk({ ...base, diabetic: false });
    const diabetic = computeCvdRisk({ ...base, diabetic: true });
    expect(diabetic.riskPercent).toBeGreaterThan(nonDiabetic.riskPercent);
  });

  it('increases risk with higher systolic BP, holding everything else constant', () => {
    const base = { age: 50, sex: 'male' as const, smoker: false, diabetic: false, waistCm: 85 };
    const lowerBp = computeCvdRisk({ ...base, systolicBp: 110 });
    const higherBp = computeCvdRisk({ ...base, systolicBp: 160 });
    expect(higherBp.riskPercent).toBeGreaterThan(lowerBp.riskPercent);
  });

  it('increases risk with larger waist circumference, holding everything else constant', () => {
    const base = { age: 50, sex: 'male' as const, smoker: false, diabetic: false, systolicBp: 130 };
    const smallerWaist = computeCvdRisk({ ...base, waistCm: 75 });
    const largerWaist = computeCvdRisk({ ...base, waistCm: 105 });
    expect(largerWaist.riskPercent).toBeGreaterThan(smallerWaist.riskPercent);
  });

  it('increases risk with age, holding everything else constant', () => {
    const base = { sex: 'male' as const, smoker: false, diabetic: false, systolicBp: 130, waistCm: 85 };
    const younger = computeCvdRisk({ ...base, age: 35 });
    const older = computeCvdRisk({ ...base, age: 65 });
    expect(older.riskPercent).toBeGreaterThan(younger.riskPercent);
  });
});

describe('classifyDtx', () => {
  it.each([
    [70, 'normal'],
    [99, 'normal'],
    [100, 'at_risk'],
    [125, 'at_risk'],
    [126, 'suspected'],
    [200, 'suspected'],
  ])('classifies DTX/FPG %i as %s', (dtx, expected) => {
    expect(classifyDtx(dtx)).toBe(expected);
  });
});
