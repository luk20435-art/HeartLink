import { apiGet, apiPost } from "./api-client";

export interface SurveyQuestion {
  key: string;
  no: number;
  text: string;
}

export interface SurveySection {
  title: string;
  questions: SurveyQuestion[];
}

/** ตรงตามแบบประเมิน 20 ข้อ 4 ด้าน ที่ลูกค้าส่งมา (ส่วนที่ 6) — ห้ามเปลี่ยนลำดับ/ข้อความโดยไม่เทียบกับต้นฉบับอีกครั้ง */
export const SURVEY_SECTIONS: SurveySection[] = [
  {
    title: "ด้านเนื้อหาและข้อมูล",
    questions: [
      { key: "q1", no: 1, text: "เนื้อหาภายในแอปพลิเคชันมีความเข้าใจง่าย" },
      { key: "q2", no: 2, text: "เนื้อหามีความถูกต้องและเหมาะสมกับการใช้งาน" },
      {
        key: "q3",
        no: 3,
        text: "เนื้อหามีความทันสมัยและสอดคล้องกับการคัดกรองและติดตามความเสี่ยงโรคหัวใจและหลอดเลือด",
      },
      { key: "q4", no: 4, text: "ข้อมูลที่แอปพลิเคชันแสดงมีความถูกต้องและชัดเจน" },
      {
        key: "q5",
        no: 5,
        text: "แอปพลิเคชันช่วยเพิ่มความรู้และความเข้าใจเกี่ยวกับโรคหัวใจและหลอดเลือด",
      },
    ],
  },
  {
    title: "ด้านประสิทธิภาพและการทำงานของแอปพลิเคชัน",
    questions: [
      { key: "q6", no: 6, text: "แอปพลิเคชันสามารถแสดงข้อมูลได้อย่างรวดเร็ว" },
      { key: "q7", no: 7, text: "แอปพลิเคชันสามารถตอบสนองต่อความต้องการของผู้ใช้งานได้" },
      {
        key: "q8",
        no: 8,
        text: "การแสดงผลข้อมูลการประเมินหรือการแปลผลของแอปพลิเคชันมีความถูกต้อง",
      },
      { key: "q9", no: 9, text: "แอปพลิเคชันสามารถค้นหาและเข้าถึงข้อมูลที่ต้องการได้สะดวก" },
      { key: "q10", no: 10, text: "แอปพลิเคชันมีความเสถียรและสามารถใช้งานได้อย่างต่อเนื่อง" },
    ],
  },
  {
    title: "ด้านความง่ายในการใช้งานและการออกแบบ",
    questions: [
      { key: "q11", no: 11, text: "แอปพลิเคชันใช้งานง่ายและไม่ซับซ้อน" },
      {
        key: "q12",
        no: 12,
        text: "การออกแบบหน้าจอช่วยให้ผู้ใช้งานสามารถเรียนรู้และใช้งานแอปพลิเคชันได้ง่าย",
      },
      { key: "q13", no: 13, text: "การจัดหมวดหมู่ข้อมูลภายในแอปพลิเคชันมีความชัดเจน" },
      { key: "q14", no: 14, text: "ขนาด รูปแบบ และสีของตัวอักษรมีความเหมาะสมและอ่านง่าย" },
      {
        key: "q15",
        no: 15,
        text: "ภาพประกอบและองค์ประกอบต่างๆ มีความเหมาะสมและสอดคล้องกับเนื้อหา",
      },
    ],
  },
  {
    title: "ด้านประโยชน์และความพึงพอใจโดยรวม",
    questions: [
      { key: "q16", no: 16, text: "แอปพลิเคชันมีประโยชน์ต่อการปฏิบัติงานของผู้ใช้งาน" },
      {
        key: "q17",
        no: 17,
        text: "แอปพลิเคชันช่วยอำนวยความสะดวกในการคัดกรองและติดตามความเสี่ยงโรคหัวใจและหลอดเลือด",
      },
      { key: "q18", no: 18, text: "แอปพลิเคชันช่วยลดความยุ่งยากและระยะเวลาในการปฏิบัติงาน" },
      {
        key: "q19",
        no: 19,
        text: "โดยภาพรวม ท่านมีความพึงพอใจต่อการใช้งานแอปพลิเคชัน HeartLink : Smart Volunteer Platform",
      },
      {
        key: "q20",
        no: 20,
        text: "ท่านมีความต้องการที่จะใช้งานแอปพลิเคชัน HeartLink : Smart Volunteer Platform ต่อไปในการปฏิบัติงาน",
      },
    ],
  },
];

export const SURVEY_QUESTION_KEYS: string[] = SURVEY_SECTIONS.flatMap((s) =>
  s.questions.map((q) => q.key),
);

export interface SurveyScores {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  q17: number;
  q18: number;
  q19: number;
  q20: number;
}

export interface SurveyResponse extends SurveyScores {
  id: string;
  comment: string | null;
  createdAt: string;
}

export type SubmitSurveyInput = SurveyScores & { comment?: string };

export function submitSurvey(input: SubmitSurveyInput) {
  return apiPost<SurveyResponse>("/survey", input);
}

export function listMySurveys() {
  return apiGet<SurveyResponse[]>("/survey/mine");
}

export interface SurveyResponseWithRespondent extends SurveyResponse {
  respondent: {
    fullName: string;
    role: "volunteer" | "staff";
  };
}

export function listAllSurveys() {
  return apiGet<SurveyResponseWithRespondent[]>("/survey");
}

function scoreAt(r: SurveyScores, key: string): number {
  return (r as unknown as Record<string, number>)[key];
}

/** Grand mean across every answered question in a set of responses (1-5 scale). */
export function overallAverage(responses: SurveyScores[]): number {
  const values = responses.flatMap((r) => SURVEY_QUESTION_KEYS.map((k) => scoreAt(r, k)));
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Average of one section's questions across a set of responses. */
export function sectionAverage(section: SurveySection, responses: SurveyScores[]): number {
  const values = responses.flatMap((r) => section.questions.map((q) => scoreAt(r, q.key)));
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Average of a single question across a set of responses. */
export function questionAverage(key: string, responses: SurveyScores[]): number {
  const values = responses.map((r) => scoreAt(r, key));
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
