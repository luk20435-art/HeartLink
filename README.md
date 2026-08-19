# HeartLink: Smart Volunteer Platform

ระบบคัดกรองและติดตามกลุ่มเสี่ยงโรคหัวใจและหลอดเลือด (CVD) สำหรับ อสม. พัทลุง — ชื่อแอปและหน้าตา UI (โดยเฉพาะหน้า login/register) อ้างอิงตาม spec/mockup "HeartLink: Smart Volunteer Platform" ที่ลูกค้าส่งมาโดยตรง แบ่งพัฒนาเป็นเฟส (ดูหมายเหตุท้ายไฟล์)

โฟลเดอร์โปรเจกต์ยังใช้ชื่อเดิม `HealthCheck อสม-พัทลุง-69` (ไม่กระทบการใช้งาน)

โปรเจกต์แยกเป็น 2 โฟลเดอร์:

- [`backend/`](backend) — NestJS + TypeORM + PostgreSQL (REST API)
- [`frontend/`](frontend) — Next.js (React) + TypeScript

## Requirements

- Node.js 18+
- PostgreSQL (รันอยู่ในเครื่อง, ใช้ฐานข้อมูลชื่อ `healthcheck`)

## Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

รันที่ `http://localhost:3001` ตั้งค่าการเชื่อมต่อฐานข้อมูลใน `backend/.env` (คัดลอกจาก `.env.example`):

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=...
DB_DATABASE=healthcheck
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

### Tests

```bash
cd backend
npm test          # unit tests (Jest, *.spec.ts อยู่ข้างไฟล์ source)
npm run test:cov  # พร้อม coverage report
```

Unit tests ครอบคลุม business logic หลักๆ ที่เสี่ยงพังเงียบๆ ตอนแก้โค้ดในอนาคต:
- `health-records/cvd-risk.util.spec.ts` — สูตร Thai CV Risk Score (Rama-EGAT) ฉบับทางการ เทียบ output กับค่าที่คำนวณอิสระนอกโค้ดนี้ (ไม่ได้ copy จาก implementation เอง) ยืนยันว่า port มาถูกต้อง + ทิศทางความเสี่ยงเพิ่ม/ลดตามแต่ละปัจจัย + DTX/FPG category
- `patients/patients.service.spec.ts` — สิทธิ์เข้าถึงผู้ป่วย (อสม. เห็นเฉพาะของตัวเอง, staff เห็นทุกคน), การคำนวณสถานะ (`not_screened`/`screened`/`tracking`/`completed`) จากจำนวน visit, การแนบ `riskLevel` ล่าสุด
- `health-records/health-records.service.spec.ts` — การคำนวณ BMI, เงื่อนไขที่ CVD risk จะถูกคำนวณ (ต้องมีครบ DTX/BMI/BP), field ที่เก็บเฉพาะ visit 1 (2Q) vs visit 2+ (self-care) vs visit 4 (DTX category)
- `knowledge-sessions/knowledge-sessions.service.spec.ts` — การตรวจสิทธิ์ผู้ป่วยก่อนบันทึก/อ่านประวัติ, การ snapshot ชื่อเนื้อหา ณ ตอนบันทึก
- `patients/patients-excel.util.spec.ts` — โครงสร้างหัวตาราง 3 แถวของไฟล์ Excel, การแปลงวันที่เป็น พ.ศ., การแปลผล 2Q (ไม่มี/มีความเสี่ยง) และผลต่าง DTX/FPG
- `users/users.service.spec.ts` — `toPublicUser()` ต้อง strip `passwordHash`/`resetPasswordTokenHash`/`resetPasswordExpiresAt` เสมอ (กัน regression ของบั๊กที่เคยพบว่าฟิลด์พวกนี้หลุดออกไปใน `GET /users`), ตรรกะ reset-password token (หมดอายุ/ไม่ตรง/ใช้ได้)
- `auth/auth.service.spec.ts` — เบอร์โทร/อีเมลซ้ำต้องถูกปฏิเสธ, จำกัดจำนวนบัญชี staff ตาม `MAX_STAFF_ACCOUNTS` (ยอมรับใต้ cap, ปฏิเสธเมื่อถึง cap), และยืนยันว่า role volunteer ไม่ถูกเช็ค cap เลย

### Auth (module `auth` / `users`)

สมัครสมาชิก 2 บทบาท: **อสม.** (`volunteer`) และ **เจ้าหน้าที่หน่วยงาน** (`staff`) ด้วยชื่อ-นามสกุล + เบอร์โทร + อีเมล + รหัสผ่าน, login ด้วยอีเมลหรือเบอร์โทรก็ได้

- `POST /auth/register` `{ fullName, phone, email, password, role }` → `{ accessToken, user }`
  - สมัคร role `staff` (เจ้าหน้าที่หน่วยงาน) จำกัดจำนวนบัญชีทั้งหมดไว้ที่ `MAX_STAFF_ACCOUNTS = 3` ใน `auth.service.ts` (นับจากบัญชี staff จริงในระบบทุกครั้งที่สมัคร ไม่ใช่ตัวนับแยก) — เกินแล้วจะได้ 403 พร้อมข้อความแจ้งให้ติดต่อผู้ดูแลระบบ; role `volunteer` (อสม.) ไม่มีการจำกัดจำนวน
- `POST /auth/login` `{ identifier, password }` → `{ accessToken, user }` (`identifier` = อีเมลหรือเบอร์โทร)
- `POST /auth/forgot-password` `{ identifier }` → `{ message, devResetUrl? }`
- `POST /auth/reset-password` `{ identifier, token, newPassword }` → `{ message }`

ส่ง `Authorization: Bearer <accessToken>` เพื่อเรียก endpoint ที่ป้องกันด้วย `JwtAuthGuard`

**⚠️ ลืมรหัสผ่าน = dev-friendly fallback**: ยังไม่ได้ต่อ SMTP/บริการส่งอีเมลจริง `forgot-password` จึงคืนลิงก์รีเซ็ต (`devResetUrl`) ตรงๆ ใน response แทนการส่งอีเมล (message หลักยังเป็นข้อความกลางๆ ที่ไม่ยืนยัน/ปฏิเสธว่ามีบัญชีนี้อยู่ ป้องกัน user enumeration) — token เป็น random 32-byte เก็บแบบ hash ในตาราง user, หมดอายุใน 1 ชั่วโมง, ใช้ได้ครั้งเดียว (เคลียร์หลัง reset สำเร็จ) ก่อนขึ้น production ต้องเพิ่มการส่งอีเมลจริงใน `AuthService.forgotPassword()` (`backend/src/auth/auth.service.ts`) แล้วเอา `devResetUrl` ออกจาก response

### กลุ่มเสี่ยง (module `patients`)

- `POST /patients` — เพิ่มผู้รับบริการ (ได้ `code` แบบ `CVD001`, `CVD002`... อัตโนมัติ, ผู้สร้างเป็นเจ้าของ/ผู้ดูแล)
- `GET /patients?search=&status=` — รายชื่อ: **อสม. เห็นเฉพาะที่ตัวเองดูแล, staff เห็นทั้งหมด**; `status` คำนวณจากจำนวนครั้งที่บันทึกข้อมูลสุขภาพ (`not_screened`/`screened`/`tracking`/`completed`)
- `GET /patients/:id`

### บันทึกข้อมูลสุขภาพ 4 ครั้ง (module `health-records`)

- `GET /patients/:patientId/health-records`
- `PUT /patients/:patientId/health-records/:visitNumber` (1–4) — upsert ต่อครั้ง, คำนวณ BMI จากส่วนสูง(ผู้ป่วย)+น้ำหนัก, เก็บน้ำตาล DTX/FPG และคำนวณ CVD score/risk ใหม่ **ทุกครั้ง** (baseline ถึง final) ให้เห็นแนวโน้มความเสี่ยงที่เปลี่ยนไปแต่ละครั้ง ตาม mockup ของลูกค้า — ผล DTX/FPG หลังปรับพฤติกรรม (`dtxCategory`) ยังคงคำนวณเฉพาะครั้งที่ 4 (final) เท่านั้น เพิ่มฟิลด์ `heartRate` (อัตราเต้นหัวใจ) บันทึกไว้เฉยๆ ไม่ได้ใช้ในสูตรคำนวณ (สูตรมาตรฐานไม่ใช้ค่านี้)
  - CVD ถูกคำนวณเมื่อมีครบ 3 ค่า: `dtxFpg`, `waistCm` (เส้นรอบเอว), `systolicBp` — **ไม่ใช้ BMI ในสูตรนี้แล้ว** (BMI ยังคำนวณ/แสดงแยกต่างหากเป็นข้อมูลอิสระ แต่ตัวสูตร CVD official ใช้เส้นรอบเอวแทน)

**✅ คะแนน CVD Risk (`backend/src/health-records/cvd-risk.util.ts`)** — ใช้สูตร **Thai CV Risk Score (Rama-EGAT) ฉบับทางการ** (non-lab, waist-circumference variant) แล้ว ไม่ใช่สูตรประมาณการที่สร้างเองอีกต่อไป — coefficients คัดลอกตรงจาก source code ของเครื่องคำนวณจริงที่ https://www.rama.mahidol.ac.th/cardio_vascular_risk/thai_cv_risk_score/scripts/formular.js (ฟังก์ชัน `TASCVDformular`, branch ที่ใช้ waist circumference เพราะแอปนี้ไม่มีเก็บผลเลือด/คอเลสเตอรอล และตรงกับข้อมูลที่เก็บอยู่แล้วพอดี: อายุ/เพศ/สูบบุหรี่/เบาหวาน/ความดัน/เส้นรอบเอว)
  - สูตร: `full_score = 0.08372×age + 0.05988×sex(1=ชาย) + 0.02034×sbp + 0.59953×dm + 0.01283×waistCm(ซม.) + 0.459×smoke`, `risk = 1 - 0.964588^exp(full_score - 7.31047)`
  - ระดับความเสี่ยง (ตรงตามเกณฑ์ทางการ): **<10% ต่ำ, 10–20% ปานกลาง, 20–30% สูง, >30% สูงมาก** — เพิ่ม tier "สูงมาก" (`very_high`) ใหม่ทั้งระบบ (type, label, badge, Excel export) จากเดิมมีแค่ 3 tier
  - เทียบ output กับค่าที่คำนวณอิสระจากสูตรต้นฉบับ (ไม่ใช่ derive จาก code ตัวเอง) ใน `cvd-risk.util.spec.ts` แล้ว — ตรงกันทุกเคส รวมถึงยืนยันกับ live server อีกครั้งก่อนส่งมอบ
  - ⚠️ ข้อจำกัดตามคำเตือนของเครื่องมือต้นฉบับเอง: ออกแบบมาสำหรับคนไทยอายุ 35-70 ปี ที่ยังไม่มีโรคหัวใจ/หลอดเลือด และ "ไม่สามารถใช้แทนการตัดสินใจของแพทย์ได้" — ควรมีข้อความเตือนแบบเดียวกันแสดงในหน้าแอปที่ อสม./เจ้าหน้าที่เห็นจริง ไม่ใช่แค่ README (ยังไม่ได้ทำ — เป็นงานถัดไปที่แนะนำ)
  - การระบุ "เป็นเบาหวาน (dm)" ยังคงใช้ proxy เดิมจาก DTX/FPG ของ visit นั้น ≥126 (ไม่ใช่ประวัติเบาหวานที่วินิจฉัยแล้ว) — เป็น design decision จากเฟสก่อนหน้า ไม่ได้เปลี่ยนในรอบนี้

### สรุปภาพรวม (patients stats)

- `GET /patients/stats` → `{ total, byStatus: { not_screened, screened, tracking, completed }, dueToday }` (scope ตาม role เหมือน `GET /patients`)
- `dueToday` = จำนวนคนที่คัดกรองแล้วแต่ยังไม่ครบ 4 ครั้ง และวันที่บันทึกครั้งล่าสุดผ่านมา ≥30 วัน (ค่าคงที่ `FOLLOWUP_INTERVAL_DAYS` ใน `patients.service.ts`) — ไม่มีการเก็บ "วันครบกำหนดถัดไป" แยกในฐานข้อมูล คำนวณสดจากวันที่ visit ล่าสุดทุกครั้งที่เรียก

### โปรไฟล์ผู้ใช้งาน (module `users`)

- `PATCH /users/me` `{ fullName?, phone?, email?, organization?, position? }` — แก้ไขข้อมูลส่วนตัว (เช็ค email/phone ซ้ำกับคนอื่น)
- `POST /users/me/password` `{ currentPassword, newPassword }` — เปลี่ยนรหัสผ่าน (เช็ค currentPassword ก่อน)
- `POST /users/me/avatar` — อัปโหลดรูปโปรไฟล์ (`multipart/form-data`, field name `avatar`, รับเฉพาะ jpg/png/webp ≤3MB) เก็บไฟล์ไว้ที่ `backend/uploads/avatars/` เสิร์ฟผ่าน `/uploads/avatars/<file>`
- `GET /users` — **staff เท่านั้น** รายชื่อผู้ใช้งานทั้งหมด + `patientCount` (จำนวนผู้ป่วยที่ดูแล, เฉพาะ role อสม. — เป็น `null` สำหรับ staff) ใช้แสดงหน้า "จัดการผู้ใช้งาน" (`frontend` route `/users`) สำหรับดูจำนวน อสม./เจ้าหน้าที่รวม และภาระงานแต่ละคน

ทุก endpoint ข้างบนคืนค่า user แบบไม่มี `passwordHash`, `resetPasswordTokenHash`, `resetPasswordExpiresAt` ติดมาด้วย

### ชุดความรู้ (module `knowledge`)

- `GET /knowledge` — รายการทั้งหมด (ทุก role ดูได้)
- `POST /knowledge` — staff เท่านั้น (`RolesGuard` + `@Roles(UserRole.STAFF)`), `multipart/form-data`: `title`, `type` (`video`/`poster`), `description?`, และ `videoUrl` (ถ้า type=video) หรือไฟล์ `poster` (ถ้า type=poster, jpg/png/webp ≤5MB) เก็บที่ `backend/uploads/posters/`
- `DELETE /knowledge/:id` — staff เท่านั้น

**Flow ฝั่ง frontend (ตาม mockup "ชุดความรู้ 4 Intervention")** — ปรับจากเดิมที่เข้าดูเนื้อหาตรงๆ เป็นเลือกผู้รับบริการก่อน:
- `/knowledge` — ค้นหา/รายชื่อกลุ่มเสี่ยง (ค้นหาได้ทั้งชื่อและรหัส, ดู `riskLevel` ต่อคนจาก `attachStatuses()` ใน `patients.service.ts`) + ปุ่ม "จัดการเนื้อหา" แยกไปหน้า `/knowledge/manage` — **ปุ่มนี้ staff เท่านั้นที่เห็น** (`user.role === "staff"`, อสม. ไม่เห็นปุ่มเลย)
- `/knowledge/manage` — **staff เท่านั้น** (redirect กลับ `/knowledge` ถ้าไม่ใช่ ทั้งจากปุ่มและจากการพิมพ์ URL ตรงๆ) การ์ด 2 หมวด (สื่อความรู้/วิดีโอ) ลิงก์ไป `/knowledge/media`, `/knowledge/videos` (staff เพิ่ม/ลบเนื้อหาได้ตามเดิม, ไม่ต้องเลือกผู้ป่วยก่อน) — ฝั่ง backend `POST/DELETE /knowledge` เป็น staff เท่านั้นอยู่แล้ว, การกันหน้านี้เป็น UI guard เพิ่มเติมให้สอดคล้องกัน
- `/knowledge/patients/[patientId]` — เมนู "ชุดความรู้ 4 Intervention" ต่อผู้ป่วย 1 คน: วิดีโอให้ความรู้ / โปสเตอร์ให้ความรู้ / บันทึกการให้ความรู้ / ประวัติการให้ความรู้
  - `/knowledge/patients/[patientId]/videos`, `/posters` — ใช้ `KnowledgeItemsView` เดิม (component เดียวกับ `/knowledge/media`, `/knowledge/videos`) แต่ผ่าน prop `allowManage={false}` ซ่อนปุ่มเพิ่ม/ลบเนื้อหา (ดูเนื้อหาอย่างเดียวในบริบทผู้ป่วย)
  - `/knowledge/patients/[patientId]/record` — ฟอร์มบันทึกการให้ความรู้ (วันที่, สื่อที่ใช้, โครงการ/หัวข้อ, ผลการให้ความรู้)
  - `/knowledge/patients/[patientId]/history` — ประวัติการให้ความรู้ย้อนหลังของผู้ป่วยคนนั้น

### บันทึกการให้ความรู้ (module `knowledge-sessions`)

- `POST /patients/:patientId/knowledge-sessions` `{ givenDate, mediaType: 'video'|'poster', knowledgeItemId, result: 'given'|'other', note? }` — บันทึก 1 ครั้งที่ อสม./staff ให้ความรู้ผู้ป่วยคนนั้น (สิทธิ์เข้าถึงเหมือน `GET /patients/:id` — อสม. บันทึกได้เฉพาะผู้ป่วยของตัวเอง)
- `GET /patients/:patientId/knowledge-sessions` — ประวัติย้อนหลังทั้งหมดของผู้ป่วยคนนั้น (ใหม่สุดก่อน)
- entity `KnowledgeSession` เก็บ `itemTitleSnapshot` (ชื่อเนื้อหา ณ ตอนบันทึก) แยกจาก `knowledgeItemId` (FK, `onDelete: SET NULL`) เพื่อให้ประวัติยังอ่านชื่อได้แม้เนื้อหานั้นถูกลบไปภายหลัง
- ⚠️ field "ผลการให้ความรู้" ในหน้าฟอร์มตีความจาก mockup เป็น 2 ตัวเลือก: "ให้ความรู้แล้ว" กับ "อื่นๆ" (เลือกแล้วมีกล่องข้อความเพิ่มเติมแบบไม่บังคับ) — wording ในภาพต้นฉบับไม่ชัดเจน 100% ควรทวนกับลูกค้าอีกครั้งถ้าความหมายที่ตั้งใจไว้ต่างจากนี้

### Export Excel

- `GET /patients/export/excel?from=YYYY-MM-DD&to=YYYY-MM-DD` — **staff เท่านั้น** (`RolesGuard` + `@Roles(UserRole.STAFF)`, อสม. ยิง API ตรงจะได้ 403) ดาวน์โหลดไฟล์ `.xlsx` — สร้างด้วย `exceljs` ใน `backend/src/patients/patients-excel.util.ts` จัดรูปแบบตาม template ที่ลูกค้าส่งมา: **1 ชีท, 1 แถวต่อผู้รับบริการ 1 คน**, หัวตาราง 3 แถว (กลุ่มหลักสีพื้น + กลุ่มย่อย + ชื่อคอลัมน์ 35 คอลัมน์ — คอลัมน์แรกสุดคือ "ลำดับ" ตามด้วยข้อมูลพื้นฐาน) ครอบคลุม ข้อมูลพื้นฐาน → ผลคัดกรองก่อนเข้าร่วมโครงการ (visit 1) → บริการปรับเปลี่ยนพฤติกรรม → ติดตามครั้งที่ 1-2 (visit 2-3) → ประเมินซ้ำหลังปรับเปลี่ยนพฤติกรรม (visit 4, รวมค่าผลต่าง DTX/FPG จาก baseline เช่น "ลดลง 15")
  - `ชื่อจังหวัด`/`รหัสหน่วยบริการ`/`ชื่อหน่วยบริการ` เป็นค่าคงที่ (constants `PROVINCE`/`UNIT_CODE`/`UNIT_NAME` ใน `patients-excel.util.ts`) ตามที่ลูกค้ายืนยัน: นครศรีธรรมราช / 77712 / ศสม.รพ.ร่อนพิบูลย์ — ไม่ได้ดึงจากฟิลด์ "หน่วยงาน" ของ อสม. อีกต่อไป (เอา field lookup เดิมออกแล้วเพราะไม่จำเป็น deployment นี้มีหน่วยบริการเดียว)
  - `from`/`to` กรอง **ผู้ป่วย** ที่มีการให้บริการ (visit ใดก็ได้ในทั้ง 4 ครั้ง) อยู่ในช่วงวันที่นั้น — ไม่ใช่กรองทีละคอลัมน์ ดังนั้นแถวของผู้ป่วยที่ถูกรวมจะยังแสดงประวัติครบทุก visit เหมือนเดิม (ตามที่ยืนยันกับลูกค้าแล้ว)
  - `GET /patients/export/preview?from=&to=` — **staff เท่านั้น** เช่นกัน — คืน `{ count, patients: [{id, code, fullName, status}] }` สำหรับพรีวิวก่อนดาวน์โหลด (ใช้ query เดียวกับ export ผ่าน `loadPatientsAndRecordsForExport()` ที่แชร์ร่วมกันใน `patients.service.ts`)
  - ปุ่ม Export Excel ที่เมนูในหน้า `/profile` แสดงเฉพาะ `user.role === "staff"` (อสม. ไม่เห็นปุ่มนี้เลย) ลิงก์ไปหน้า `/profile/export` ซึ่งมี guard ซ้ำอีกชั้น (redirect กลับ `/` ถ้าไม่ใช่ staff) — เลือกช่วงวันที่ (optional, เว้นว่างได้เพื่อส่งออกทั้งหมด) แล้วเห็นพรีวิวจำนวน + รายชื่อคนที่จะถูกรวมแบบ live (debounce 300ms) ก่อนกดดาวน์โหลดจริง ปุ่มดาวน์โหลดจะ disabled ถ้าพรีวิวว่างเปล่า
  - ช่องที่ระบบยังไม่มีข้อมูลเก็บไว้ จะปล่อยว่าง: **เลขบัตรประชาชน** และคอลัมน์ในกลุ่ม **"การให้บริการปรับเปลี่ยนพฤติกรรม"** (วันที่ + กิจกรรม) — ยังไม่มีจุดเก็บข้อมูลนี้ในระบบ
  - คอลัมน์ **"2Q (แปลผล)"** แสดงผลตีความจาก `q1Depressed`/`q2Anhedonia` ตาม decision-tree ของลูกค้า: ไม่มีทั้ง 2 ข้อ → "ไม่มี" (ปกติ), มีข้อใดข้อหนึ่งหรือทั้ง 2 ข้อ → "มีความเสี่ยง" (ฟังก์ชัน `twoQResult()` ใน `patients-excel.util.ts`)
  - หมายเหตุ: คอลัมน์ "พฤติกรรมการปรับเปลี่ยนตนเอง" ใช้ label ของระบบเอง (ดีขึ้น/เหมือนเดิม/แย่ลง) ซึ่งต่างจาก wording ในตัวอย่างของลูกค้า ("ปฏิบัติสม่ำเสมอ" ฯลฯ) เพราะเป็นคนละ scale กับที่ระบบเก็บจริง — ควรทวนกับลูกค้าอีกครั้งถ้าต้องการให้ตรงคำเป๊ะๆ

### แบบประเมินความพึงพอใจ (module `survey`)

แบบประเมิน 20 ข้อ 4 ด้าน ตามแบบฟอร์มที่ลูกค้าส่งมา (ส่วนที่ 6) — รายการคำถามฉบับเต็มอยู่ที่ `frontend/src/lib/survey-api.ts` (`SURVEY_SECTIONS`, ห้ามแก้ข้อความ/ลำดับโดยไม่เทียบต้นฉบับ):
1. **ด้านเนื้อหาและข้อมูล** (ข้อ 1-5)
2. **ด้านประสิทธิภาพและการทำงานของแอปพลิเคชัน** (ข้อ 6-10)
3. **ด้านความง่ายในการใช้งานและการออกแบบ** (ข้อ 11-15)
4. **ด้านประโยชน์และความพึงพอใจโดยรวม** (ข้อ 16-20)

แต่ละข้อให้คะแนน 1-5 (1=ควรปรับปรุง ... 5=ดีที่สุด) เก็บเป็นคอลัมน์ `q1`-`q20` ใน `SurveyResponse` entity (ก่อนหน้านี้เป็นแบบสั้น 2 คำถาม `overallSatisfaction`/`easeOfUse` — เปลี่ยนแล้ว)

- `POST /survey` `{ q1..q20: 1-5 (ครบทุกข้อ), comment? }`
- `GET /survey/mine` — ดูคำตอบของตัวเองย้อนหลัง (คืนคะแนนดิบทั้ง 20 ข้อ)

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

รันที่ `http://localhost:3000` ตั้งค่า URL ของ backend ใน `frontend/.env.local` (คัดลอกจาก `.env.local.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

โครงสร้างหน้า:

- `/login`, `/register`, `/forgot-password`, `/reset-password` — ไม่ต้อง login, มี role picker (อสม./เจ้าหน้าที่หน่วยงาน) ตอนสมัคร
- `/`, `/patients`, `/patients/new`, `/patients/[id]`, `/profile`, `/profile/info`, `/profile/edit`, `/profile/password`, `/profile/export`, `/knowledge`, `/knowledge/manage`, `/knowledge/media`, `/knowledge/videos`, `/knowledge/patients/[patientId]`, `/knowledge/patients/[patientId]/videos`, `/posters`, `/record`, `/history`, `/survey`, `/users`, `/survey-results` — อยู่ใน route group `(app)`, บังคับ login (เด้งไป `/login` อัตโนมัติถ้ายังไม่ได้เข้าสู่ระบบ), มี bottom nav บนมือถือ/แท็บเล็ต และ sidebar บนจอกว้าง (≥1024px)
- `/users` — **staff เท่านั้น** (redirect กลับ `/` ถ้าไม่ใช่) หน้าจัดการผู้ใช้งาน: สรุปจำนวนผู้ใช้ทั้งหมด/อสม./เจ้าหน้าที่ + ตารายชื่อพร้อมจำนวนผู้ป่วยที่แต่ละ อสม. ดูแล เข้าถึงจากการ์ดใน Dashboard (`GET /users`)
- `/survey-results` — **staff เท่านั้น** (redirect กลับ `/` ถ้าไม่ใช่) สรุปผลแบบประเมินความพึงพอใจ 20 ข้อ: จำนวนผู้ตอบ + **คะแนนรวมเฉลี่ย** (grand mean ทั้ง 20 ข้อ ทุกคำตอบ, ไฮไลต์เด่นบนสุด), คะแนนเฉลี่ยแยกราย 4 ด้าน, ตารางคะแนนเฉลี่ยรายข้อทั้ง 20 ข้อ (จัดกลุ่มตามด้าน), ตารายชื่อผู้ตอบพร้อมคะแนนเฉลี่ยรายคน, และรายการความคิดเห็นเพิ่มเติมทั้งหมด — คำนวณด้วย `overallAverage()`/`sectionAverage()`/`questionAverage()` ใน `lib/survey-api.ts` เข้าถึงจากการ์ดใน Dashboard (`GET /survey`, ป้องกันด้วย `RolesGuard` ที่ฝั่ง backend เช่นเดียวกับ `/users`)
- `/` (Dashboard) — stat tile 5 ช่อง (รวม + 4 สถานะ) และ donut chart สัดส่วนสถานะ (`components/StatusDonut.tsx`, สี ordinal ramp ที่ validate ด้วย dataviz skill แล้วใน `globals.css` ตัวแปร `--status-*`) — label สถานะ 4 แบบ (`STATUS_LABEL` ใน `lib/patients-api.ts`): ยังไม่ได้คัดกรอง / คัดกรองแล้ว / ให้ความรู้แล้ว (เดิม "ติดตามอยู่") / ติดตามครบ 3 ครั้ง (เดิม "ครบการติดตาม") — ค่า enum ภายใน (`tracking`/`completed`) ไม่เปลี่ยน เปลี่ยนแค่ข้อความที่แสดง
- `/login` — checkbox "จำรหัสผ่าน": ติ๊ก = เก็บ session ใน `localStorage` (อยู่ข้ามการปิดเบราว์เซอร์, ค่าเริ่มต้น), ไม่ติ๊ก = เก็บใน `sessionStorage` (หายเมื่อปิดแท็บ/เบราว์เซอร์) — ดูการเลือก storage ที่ `activeStorageRef` ใน `lib/auth.tsx`; ทุก API client อ่าน token จาก `getToken()` ใน `lib/api-client.ts` ซึ่งเช็คทั้งสอง storage
- `/forgot-password` → `/reset-password?identifier=&token=` — ฟอร์มขอ/ตั้งรหัสผ่านใหม่ (ดูคำเตือน dev-friendly fallback ด้านบน)
- `/profile` — หน้าเมนูโปรไฟล์ (ตาม mockup): avatar (แตะเพื่ออัปโหลดรูปใหม่ อัปเดต localStorage ทันทีผ่าน `updateUser()` ใน `lib/auth.tsx`) + ชื่อ/บทบาท/เบอร์โทร, การ์ดเมนู 4 อัน (ข้อมูลผู้ใช้งาน/แก้ไขข้อมูล/เปลี่ยนรหัสผ่าน/ออกจากระบบ), การ์ดลิงก์ไปแบบประเมินความพึงพอใจ, เลขเวอร์ชันท้ายหน้า
  - `/profile/info` — แสดงข้อมูลผู้ใช้แบบอ่านอย่างเดียว (ชื่อ/บทบาท/เบอร์โทร/อีเมล/หน่วยงาน/ตำแหน่ง)
  - `/profile/edit` — ฟอร์มแก้ไขข้อมูลผู้ใช้ (ย้ายมาจาก `/profile` เดิม)
  - `/profile/password` — ฟอร์มเปลี่ยนรหัสผ่าน (ย้ายมาจาก `/profile` เดิม)
  - ทั้งสามหน้าย่อยใช้ style ร่วมกันจาก `app/(app)/profile/detail.module.css` และมีปุ่มย้อนกลับไป `/profile`
- `/knowledge` — หน้ารวม 2 หมวด "สื่อความรู้" (โปสเตอร์) และ "วิดีโอ" แต่ละการ์ดโชว์จำนวนรายการสด (ไม่จำกัดจำนวน) คลิกเข้าไปที่ `/knowledge/media` หรือ `/knowledge/videos` (ใช้ component เดียวกัน `components/KnowledgeItemsView.tsx` กรองตาม `type`) — การ์ดวิดีโอคลิกเพื่อฝัง YouTube iframe (thumbnail จาก `img.youtube.com`) staff เท่านั้นที่เห็นปุ่มเพิ่ม/ลบเนื้อหาในแต่ละหมวด (ซ่อนด้วย `user.role === "staff"` ฝั่ง frontend, backend บังคับด้วย `RolesGuard` อีกชั้น) — การ์ดโปสเตอร์แสดง thumbnail ครอป 16:9 พร้อมป้าย "ดูรูปเต็ม" คลิกเพื่อเปิด modal แสดงรูปเต็ม (`object-fit: contain`, ปิดด้วยปุ่ม X/คลิก backdrop/กด Esc)
- ปุ่ม "Export Excel" อยู่ที่เมนูในหน้า `/profile` (ดาวน์โหลดไฟล์ผ่าน blob + `<a download>`, `downloadPatientsExcel()` ใน `lib/patients-api.ts`)
- `/survey` — แบบประเมิน 20 ข้อ 4 ด้าน (ให้คะแนน 1-5 ทุกข้อ, มีเกณฑ์การให้คะแนนเป็น legend ด้านบน) + ความคิดเห็นเพิ่มเติม (ไม่บังคับ) ต้องตอบครบทุกข้อก่อนส่งได้ แสดงหน้าขอบคุณหลังส่งสำเร็จ
- ฝั่ง frontend เก็บ JWT ไว้ใน `localStorage`

Design system อยู่ใน `frontend/src/app/globals.css` (สี/spacing/shadow เป็น CSS variables, ปุ่ม/input/badge เป็น utility class ใช้ร่วมกันทุกหน้า) — breakpoint หลัก: มือถือ (<640px), แท็บเล็ต/iPad portrait (≥640px), iPad landscape/จอกว้าง (≥1024px)

## เฟสการพัฒนา

- **เฟส 1 ✅**: auth 2 บทบาท, จัดการกลุ่มเสี่ยง, ฟอร์มบันทึกข้อมูลสุขภาพ 4 ครั้งพร้อมคำนวณ CVD risk อัตโนมัติ, responsive design ทั้งระบบ
- **เฟส 2 ✅**: หน้า Dashboard สรุปภาพรวม (stat tiles + donut chart), โปรไฟล์ผู้ใช้งาน (แก้ไขข้อมูล/เปลี่ยนรหัสผ่าน/รูปโปรไฟล์)
- **เฟส 3 ✅**: ชุดความรู้ (วิดีโอ/โปสเตอร์, staff จัดการเนื้อหา), Export Excel, แบบประเมินความพึงพอใจ

ครบทั้ง 3 เฟสตามสเปกที่ลูกค้าส่งมา (mind map + mockup อ้างอิง)

**เพิ่มเติมหลังจบเฟส 3** (ของที่เคยข้ามไว้ตอนแรก แต่เพิ่มกลับมาก่อน deploy): ลืมรหัสผ่าน (dev-friendly, ดูคำเตือนด้านบน), จำรหัสผ่านตอน login, ตัวนับ "ครบกำหนดติดตามวันนี้" บน dashboard — ยังไม่ทำ: Google login (ต้องขอ OAuth credentials จากลูกค้าก่อน)

## หมายเหตุ

- ต้องรัน backend และ frontend พร้อมกันคนละ terminal (คนละพอร์ต 3001 / 3000)
- `JWT_SECRET` ต้องเปลี่ยนเป็นค่าของตัวเองก่อนขึ้น production และห้าม commit ไฟล์ `.env` เข้า git
- ดูคำเตือนเรื่องสูตร CVD Risk ด้านบน — ต้องตรวจสอบก่อนใช้งานจริง

## Database migrations

เปลี่ยนจาก `synchronize: true` (auto-sync schema จาก entity ตอน dev) มาเป็น TypeORM migration files แล้ว (`synchronize: false`, `migrationsRun: true` ใน `app.module.ts`) — ปลอดภัยสำหรับ production เพราะ schema เปลี่ยนแปลงผ่าน migration file ที่ตรวจสอบได้ ไม่ใช่ diff อัตโนมัติที่อาจลบคอลัมน์โดยไม่ตั้งใจ

- `backend/src/data-source.ts` — DataSource สำหรับ CLI (ใช้ env vars เดียวกับแอป ผ่าน `dotenv/config`)
- `backend/src/migrations/` — ไฟล์ migration (มี `InitSchema` ตัวแรกที่ generate จากฐานข้อมูลเปล่า ตรวจสอบแล้วว่า schema ตรงกับที่ `synchronize: true` เคยสร้างไว้ทุกคอลัมน์)
- แอปรัน migration ที่ค้างอยู่ให้อัตโนมัติทุกครั้งที่ backend สตาร์ท (`migrationsRun: true`) — deploy ครั้งแรกบนฐานข้อมูลเปล่าจะสร้าง schema ให้เองไม่ต้องรันคำสั่งเพิ่ม
- คำสั่งสำหรับตอนแก้ entity ในอนาคต (รันจาก `backend/`):
  - `npm run migration:generate -- src/migrations/<ชื่อ>` — generate migration ใหม่จาก diff ระหว่าง entity กับฐานข้อมูลที่ต่ออยู่ (ควร generate กับฐานข้อมูลเปล่า/staging ไม่ใช่ dev db ที่มีข้อมูลจริงอยู่ เพื่อไม่ให้ diff เพี้ยน)
  - `npm run migration:run` — รัน migration ที่ค้างอยู่ด้วยมือ (เผื่อกรณีไม่อยากพึ่ง `migrationsRun: true`)
  - `npm run migration:revert` — ย้อน migration ล่าสุด

## ไฟล์อัปโหลด (avatar/poster)

`backend/uploads/avatars/` และ `backend/uploads/posters/` เก็บบน disk ของ backend เอง (ไม่ใช้ object storage ภายนอก) — ใช้ได้จริงถ้า host บนแพลตฟอร์มที่มี **persistent volume** (เช่น Railway Volume mount เข้ากับ service นี้ที่ path `backend/uploads` หรือจะ mount ที่ root แล้วตั้ง `UPLOADS_DIR` ก็ได้ในอนาคตถ้าต้องการ) เพราะ volume ของ Railway เริ่มต้นว่างเปล่าทุกครั้งที่สร้างใหม่ โค้ดใน `main.ts` จึงสร้างโฟลเดอร์ `avatars`/`posters` อัตโนมัติตอนบูตแอป (`ensureUploadDirs()`) ไม่ต้องพึ่งไฟล์ `.gitkeep` ที่ commit ไว้

ข้อจำกัดที่ควรรู้: ไฟล์ผูกกับ **instance เดียว** ของ backend (ไม่ใช่ shared storage) — ถ้าในอนาคตต้อง scale backend เป็นหลาย instance พร้อมกัน (ไม่ใช่กรณีนี้) ต้องย้ายไป object storage (S3-compatible) แทน

## Deploy

**Frontend → Vercel**
- Import repo, root directory ชี้ที่ `frontend/`
- ตั้ง env var `NEXT_PUBLIC_API_URL` ชี้ไป URL ของ backend บน Railway

**Backend + Postgres → Railway**
- สร้าง Postgres service (Railway มี managed Postgres ในตัว) แล้วต่อ backend service เข้ากับมันผ่าน env vars ที่ Railway generate ให้ (หรือ map เข้ากับ `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE` ตามที่ `app.module.ts` อ่าน)
- สร้าง **Volume** แล้ว mount เข้ากับ backend service ที่ path `/app/uploads` (หรือ path ที่ตรงกับ `process.cwd()/uploads` ตอน runtime) เพื่อให้ไฟล์อัปโหลดไม่หายตอน deploy ใหม่
- ตั้ง env vars: `JWT_SECRET` (ค่าใหม่ ไม่ใช่ค่าที่อยู่ใน `.env` dev), `JWT_EXPIRES_IN`, `FRONTEND_URL` (URL ของ Vercel), `PORT` (Railway set ให้อัตโนมัติผ่าน `PORT` env — โค้ดอ่านจาก `process.env.PORT` อยู่แล้ว)
- Build command: `npm run build` / Start command: `npm run start:prod` — migration รันอัตโนมัติตอนสตาร์ทแอป (ดูหัวข้อ Database migrations)
