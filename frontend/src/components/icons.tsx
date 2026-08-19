type IconProps = { className?: string };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 14.2c2.4.4 4.5 2.6 4.5 5.8" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
      <path d="M9 12h6M9 16h6M9 12v0" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5V5.5Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </svg>
  );
}

export function HeartPulseMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.1-9.6-8.3C.6 9.9 1.6 6.2 4.8 5c2.3-.9 4.6.1 5.9 2 .1.1.2.3.3.4.1-.1.2-.3.3-.4 1.3-1.9 3.6-2.9 5.9-2 3.2 1.2 4.2 4.9 2.4 7.7C18.7 16.9 12 21 12 21Z" />
    </svg>
  );
}

/** Large heart-with-ECG-pulse logo mark used on auth screens. */
export function HeartPulseLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M12 21s-6.7-4.1-9.6-8.3C.6 9.9 1.6 6.2 4.8 5c2.3-.9 4.6.1 5.9 2 .1.1.2.3.3.4.1-.1.2-.3.3-.4 1.3-1.9 3.6-2.9 5.9-2 3.2 1.2 4.2 4.9 2.4 7.7C18.7 16.9 12 21 12 21Z"
        fill="#e11d48"
      />
      <path
        d="M2.2 12.4h3l1.6-3.2 2.3 6.2 1.9-8 1.7 5h2.1l1.5-3h3.8"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2 4.5 1.5V18a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2Z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.5 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.6-.7" />
      <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function PlayCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M10 8.3v7.4l6.3-3.7-6.3-3.7Z" fill="#fff" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4.5h4.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ClipboardCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
      <path d="m9 13.5 2 2 4-4.5" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 5 3 3" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19.5h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5.3l3.5 2" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" />
    </svg>
  );
}

export function SmokeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M3 15h11v4H3z" />
      <path d="M17 15h4v4h-4z" strokeDasharray="2.5 2.5" />
      <path d="M6 11c1.5-1.5 1.5-3 0-4.5M9.5 11c1.5-2 1.5-4-.5-6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function HeartPulseOutlineIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.3 4.6 5.5 3.5c2.2-.8 4.4.1 5.7 1.9.3.4.5.8.8 1.3.3-.5.5-.9.8-1.3 1.3-1.8 3.5-2.7 5.7-1.9 3.2 1.1 4.3 4.5 2.8 7.7C19 15.6 12 20 12 20Z" />
      <path d="M3.5 12h3l1.5-3 2 5 1.5-6.5 1.5 4.5h2l1.5-2h3.5" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.3 2.7 2.7L16.5 9" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common} fill="currentColor" stroke="none">
      <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z" />
    </svg>
  );
}

/** Subtle decorative ECG-line divider used at the bottom of auth screens. */
export function HeartbeatDivider({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 400 40" preserveAspectRatio="none" fill="none">
      <path
        d="M0 20 H40 L50 8 L60 32 L70 20 H140 L150 8 L160 32 L170 20 H240 L250 8 L260 32 L270 20 H400"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
