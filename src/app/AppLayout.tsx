import {
  ClipboardCheck,
  Grid3x3,
  Monitor,
  Moon,
  PenLine,
  Printer,
  Sparkles,
  Sun,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatch } from 'react-router';
import { getScript, scriptList } from '../data/scripts';
import { updateSettings, useSettings, type ThemePref } from '../features/settings/settings';
import { SITE_NAME } from './config';
import { GoalToast } from './GoalToast';
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

/**
 * สลับชุดตัวอักษร โดยคงหน้าเดิมไว้ เช่น /hiragana/practice/ka?mode=trace → /katakana/practice/ka?mode=trace
 * (ฮิรางานะและคาตาคานะใช้ id ตัวอักษรเดียวกัน)
 */
function ScriptSwitcher({ current }: { current?: string }) {
  const { pathname, search } = useLocation();
  const target = (id: string) => {
    if (!current) return `/${id}`;
    const params = new URLSearchParams(search);
    params.delete('chars'); // รายการทบทวนเป็นของชุดเดิม
    const query = params.toString();
    return `/${id}${pathname.slice(current.length + 1)}${query ? `?${query}` : ''}`;
  };
  return (
    <nav className={`segmented ${styles.switcher}`} aria-label="เลือกชุดตัวอักษร">
      {scriptList.map((p) => (
        <Link
          key={p.id}
          to={target(p.id)}
          aria-current={p.id === current ? 'page' : undefined}
          title={p.name}
          lang="ja"
          className="kana"
        >
          {p.nameJa}
        </Link>
      ))}
    </nav>
  );
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
  const current = getScript(match?.params.script);
  const { introSeen } = useSettings();
  const onStartPage = useMatch('/start') !== null;
  const showIntro = !introSeen && !onStartPage;
  const pack = current ?? scriptList[0]!;
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
            <span className={styles.brandText}>{SITE_NAME}</span>
          </Link>
          <ScriptSwitcher current={current?.id} />
          <nav className={styles.topNav} aria-label={`เมนู${pack.name}`}>
            {items.map(({ to, label, short, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={styles.topLink}>
                <Icon size={17} aria-hidden />
                <span className={styles.long}>{label}</span>
                <span className={styles.short}>{short}</span>
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {showIntro && (
        <div className={`${styles.intro} no-print`} role="note">
          <div className={`container ${styles.introInner}`}>
            <span>
              <Sparkles size={16} aria-hidden /> เพิ่งเริ่มเรียนภาษาญี่ปุ่น? อ่านพื้นฐาน 5 นาทีก่อนเริ่มเขียน
            </span>
            <span className="row">
              <Link to="/start" className="btn btn-primary btn-sm">
                เริ่มต้นที่นี่
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => updateSettings({ introSeen: true })}
                aria-label="ปิดแถบแนะนำ"
              >
                <X size={18} aria-hidden />
              </button>
            </span>
          </div>
        </div>
      )}

      <main id="main" className={styles.main}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className={`${styles.footer} no-print`}>
        <div className="container">
          <p className="small muted">
            {SITE_NAME} · ไม่ต้องสมัครสมาชิก ไม่เก็บข้อมูลส่วนตัว · <Link to="/start">เริ่มต้นที่นี่</Link>{' '}
            · <Link to="/about">เกี่ยวกับ &amp; เครดิต</Link>
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
      <GoalToast />
      <ScrollRestoration />
    </div>
  );
}
