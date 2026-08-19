"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";
import { BookIcon, ClipboardIcon, HomeIcon, UserIcon, UsersIcon } from "./icons";

const items = [
  { href: "/", label: "หน้าหลัก", Icon: HomeIcon },
  { href: "/patients", label: "กลุ่มเสี่ยง", Icon: UsersIcon },
  { href: "/patients/new", label: "บันทึกข้อมูล", Icon: ClipboardIcon },
  { href: "/knowledge", label: "ชุดความรู้", Icon: BookIcon },
  { href: "/profile", label: "โปรไฟล์", Icon: UserIcon },
];

function matches(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  // Only the most specific matching href is active — otherwise "/patients"
  // and "/patients/new" would both light up on the /patients/new page, since
  // the latter is a path prefix of nothing but shares a prefix with the former.
  const activeHref = items
    .map((i) => i.href)
    .filter((href) => matches(href, pathname))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className={styles.nav}>
      {items.map(({ href, label, Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
