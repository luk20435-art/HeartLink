"use client";

const SIZE = 168;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 3;

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function StatusDonut({
  segments,
  total,
  centerLabel,
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel: string;
}) {
  let offset = 0;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`สัดส่วนสถานะกลุ่มเสี่ยง รวม ${total} คน`}
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--color-bg)"
        strokeWidth={STROKE}
      />
      {total > 0 &&
        segments.map((seg) => {
          if (seg.value === 0) return null;
          const length = (seg.value / total) * CIRC;
          const dash = Math.max(length - GAP, 0);
          const circle = (
            <circle
              key={seg.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
          offset += length;
          return circle;
        })}
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontSize="26"
        fontWeight="800"
        fill="var(--color-text)"
      >
        {total}
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        fontSize="11"
        fill="var(--color-text-muted)"
      >
        {centerLabel}
      </text>
    </svg>
  );
}
