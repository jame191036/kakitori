import {
  ClipboardCheck,
  Grid3x3,
  Monitor,
  Moon,
  PenLine,
  Printer,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useMatch } from 'react-router';
import { getScript, scriptList } from '../data/scripts';
import { updateSettings, type ThemePref } from '../features/settings/settings';
import { SITE_NAME } from './config';
import { UpdatePrompt } from './UpdatePrompt';
import { useApplyTheme } from './useTheme';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  end?: boolean;
}

function navItems(scriptId: string): NavItem[] {
  return [
    { to: `/${scriptId}`, label: 'ตารางตัวอักษร', short: 'ตาราง', icon: Grid3x3, end: true },
    { to: `/${scriptId}/practice`, label: 'คัดตัวอักษร', short: 'คัด', icon: PenLine },
    { to: `/${scriptId}/quiz`, label: 'แบบทดสอบ', short: 'ทดสอบ', icon: ClipboardCheck },
    { to: `/${scriptId}/review`, label: 'ทบทวน', short: 'ทบทวน', icon: Target },
    { to: `/${scriptId}/worksheet`, label: 'พิมพ์แบบฝึก', short: 'พิมพ์', icon: Printer },
  ];
}

const THEME_NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_INFO: Record<ThemePref, { icon: LucideIcon; label: string }> = {
  system: { icon: Monitor, label: 'ธีมตามเครื่อง' },
  light: { icon: Sun, label: 'ธีมสว่าง' },
  dark: { icon: Moon, label: 'ธีมมืด' },
};

function ThemeToggle() {
  const theme = useApplyTheme();
  const { icon: Icon, label } = THEME_INFO[theme];
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      onClick={() => updateSettings({ theme: THEME_NEXT[theme] })}
      aria-label={`${label} (กดเพื่อเปลี่ยน)`}
      title={label}
    >
      <Icon size={20} aria-hidden />
    </button>
  );
}

function PageLoading() {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.spinner} aria-hidden />
      กำลังโหลด…
    </div>
  );
}

export function AppLayout() {
  // layout อยู่ชั้นนอกสุด จึงอ่าน :script จาก URL เอง (ถ้าไม่ใช่หน้าของชุดใด ใช้ชุดแรก)
  const match = useMatch('/:script/*');
  const pack = getScript(match?.params.script) ?? scriptList[0]!;
  const items = navItems(pack.id);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        ข้ามไปเนื้อหา
      </a>
      <header className={`${styles.header} no-print`}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.brand}>
            <img src="/logo.svg" alt="" width={32} height={32} />
            <span>{SITE_NAME}</span>
          </Link>
          <nav className={styles.topNav} aria-label={`เมนู${pack.name}`}>
            <span className={styles.scriptBadge}>
              <span className="kana">{pack.nameJa}</span>
            </span>
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={styles.topLink}>
                <Icon size={17} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className={`${styles.footer} no-print`}>
        <div className="container">
          <p className="small muted">
            {SITE_NAME} · ไม่ต้องสมัครสมาชิก ไม่เก็บข้อมูลส่วนตัว ·{' '}
            <Link to="/about">เกี่ยวกับ &amp; เครดิต</Link>
          </p>
        </div>
      </footer>

      <nav className={`${styles.bottomNav} no-print`} aria-label="เมนูหลัก">
        {items.map(({ to, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={styles.bottomLink}>
            <Icon size={22} aria-hidden />
            <span>{short}</span>
          </NavLink>
        ))}
      </nav>

      <UpdatePrompt />
      <ScrollRestoration />
    </div>
  );
}
