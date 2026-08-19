"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPatient, PatientSex } from "@/lib/patients-api";
import styles from "./page.module.css";

const TREATMENT_RIGHTS = ["บัตรทอง", "ประกันสังคม", "ข้าราชการ/รัฐวิสาหกิจ", "อื่นๆ"];

export default function NewPatientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<PatientSex>("male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [treatmentRight, setTreatmentRight] = useState(TREATMENT_RIGHTS[0]);
  const [smoker, setSmoker] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const patient = await createPatient({
        fullName: fullName.trim(),
        age: Number(age),
        sex,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        treatmentRight,
        smoker,
        heightCm: heightCm ? Number(heightCm) : undefined,
      });
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.desktopPanel}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>เพิ่มรายชื่อกลุ่มเสี่ยง</h1>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560, margin: "0 auto" }}
      >
        <div className="field">
          <label htmlFor="fullName">ชื่อ-นามสกุล</label>
          <input
            id="fullName"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="age">อายุ (ปี)</label>
            <input
              id="age"
              className="input"
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="sex">เพศ</label>
            <select
              id="sex"
              className="select"
              value={sex}
              onChange={(e) => setSex(e.target.value as PatientSex)}
            >
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="phone">เบอร์โทร</label>
            <input
              id="phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="heightCm">ส่วนสูง (ซม.)</label>
            <input
              id="heightCm"
              className="input"
              type="number"
              min={0}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">ที่อยู่</label>
          <textarea
            id="address"
            className="textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="treatmentRight">สิทธิการรักษา</label>
          <select
            id="treatmentRight"
            className="select"
            value={treatmentRight}
            onChange={(e) => setTreatmentRight(e.target.value)}
          >
            {TREATMENT_RIGHTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={smoker}
            onChange={(e) => setSmoker(e.target.checked)}
          />
          สูบบุหรี่
        </label>

        {error && <p className="errorText">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
