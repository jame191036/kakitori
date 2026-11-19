import {
  ArrowLeft,
  ChevronLeft,
  GraduationCap,
  House,
  Languages,
  Monitor,
  Moon,
  Sun,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, matchPath, Outlet, ScrollRestoration, useLocation, useMatch } from 'react-router';
import { getScript } from '../data/scripts';
import { updateSettings, useSettings, type ThemePref } from '../features/settings/settings';
import { SITE_NAME } from './config';
import { GoalToast } from './GoalToast';
import { getLesson } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { KANA_ROOT, N5_ROOT, REVIEW_ROOT, scriptPath, vocabPath } from './paths';
import { UpdatePrompt } from './UpdatePrompt';
import { useApplyTheme } from './useTheme';
import styles from './AppLayout.module.css';

/** ชื่อเมนูย่อยในชุดตัวอักษร (ใช้ในเส้นทางบนหัวเว็บ) */
const TOOL_LABEL: Record<string, string> = {
  practice: 'คัดตัวอักษร',
  quiz: 'แบบทดสอบ',
  review: 'ทบทวน',
  worksheet: 'พิมพ์แบบฝึก',
};

interface Crumb {
  label: string;
  /** ไม่มี = หน้าปัจจุบัน */
  to?: string;
}

/** เส้นทางของหน้านี้ เช่น หน้าแรก › ตัวอักษร › ฮิรางานะ › คัดตัวอักษร (หน้าแรกเองไม่มี) */
function crumbsFor(pathname: string): Crumb[] {
  const home: Crumb = { label: 'หน้าแรก', to: '/' };
  const kana: Crumb = { label: 'ตัวอักษร', to: KANA_ROOT };
  const notFound: Crumb = { label: 'ไม่พบหน้านี้' };
  if (pathname === '/') return [];
  if (pathname === KANA_ROOT) return [home, { label: kana.label }];
  const m = matchPath(`${KANA_ROOT}/:script/*`, pathname);
  if (m) {
    const pack = getScript(m.params.script);
    if (!pack) return [home, kana, notFound];
    const tool = TOOL_LABEL[(m.params['*'] ?? '').split('/')[0] ?? ''];
    return tool
      ? [home, kana, { label: pack.name, to: scriptPath(pack.id) }, { label: tool }]
      : [home, kana, { label: pack.name }];
  }
  if (pathname === N5_ROOT) return [home, { label: 'JLPT N5' }];
  const v = matchPath(`${N5_ROOT}/vocab/*`, pathname);
  if (v) {
    const n5: Crumb = { label: 'JLPT N5', to: N5_ROOT };
    const lesson = getLesson(N5_DECK, v.params['*']);
    if (!v.params['*']) return [home, n5, { label: 'คำศัพท์' }];
    return lesson
      ? [home, n5, { label: 'คำศัพท์', to: vocabPath() }, { label: lesson.title }]
      : [home, n5, { label: 'คำศัพท์', to: vocabPath() }, notFound];
  }
  if (pathname === '/start') return [home, kana, { label: 'เริ่มต้นที่นี่' }];
  if (pathname === REVIEW_ROOT) return [home, { label: 'ทบทวน' }];
  if (pathname === '/about') return [home, { label: 'เกี่ยวกับ' }];
  // ลิงก์แบบเก่า (/hiragana/...) กำลังถูกพาไป /kana/... — ใช้เส้นทางของหน้าใหม่เลย ไม่ให้ "ไม่พบหน้านี้" แวบขึ้นมา
  const legacy = matchPath('/:script/*', pathname);
  if (legacy && getScript(legacy.params.script)) return crumbsFor(`${KANA_ROOT}${pathname}`);
  return [home, notFound];
}

/** จอกว้าง: ปุ่มลูกศรกลับ (ขึ้นไปชั้นบน 1 ชั้น) + เส้นทางเต็ม เป็นบรรทัดเล็กเหนือชื่อหน้า (ใต้หัวเว็บ) */
function CrumbTrail({ crumbs }: { crumbs: Crumb[] }) {
  const parent = crumbs[crumbs.length - 2];
  return (
    <nav className={`container ${styles.crumbBar} no-print`} aria-label="เส้นทาง">
      {parent?.to && (
        <Link to={parent.to} className={styles.backBtn} aria-label={`กลับไป${parent.label}`} title={`กลับไป${parent.label}`}>
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden />
        </Link>
      )}
      <ol className={styles.trail}>
        {crumbs.map((c, i) => (
          <li key={i}>
            {c.to ? (
              <Link to={c.to}>{c.label}</Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** จอแคบ: บนหัวเว็บ — ย้อนกลับชั้นบน + ชื่อหน้านี้ */
function CrumbBack({ crumbs }: { crumbs: Crumb[] }) {
  const current = crumbs[crumbs.length - 1];
  const parent = crumbs[crumbs.length - 2];
  return (
    <div className={styles.headerMid}>
      {current && (
        <nav className={styles.trailShort} aria-label="ย้อนกลับ">
          {parent?.to && (
            <Link to={parent.to} className={styles.back} aria-label={`กลับไป${parent.label}`}>
              <ChevronLeft size={18} strokeWidth={1.8} aria-hidden />
              <span>{parent.label}</span>
            </Link>
          )}
          <span className={styles.here} aria-current="page">
            {current.label}
          </span>
        </nav>
      )}
    </div>
  );
}

interface MainNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** หน้านี้อยู่ในเมนูนี้หรือไม่ */
  active: (pathname: string) => boolean;
}

/** เมนูหลัก (หมวด) — หมวดใหม่ (ท่องเที่ยว ฯลฯ) เพิ่มที่นี่เมื่อทำเสร็จ */
const MAIN_NAV: MainNavItem[] = [
  { to: '/', label: 'หน้าแรก', icon: House, active: (p) => p === '/' },
  {
    to: KANA_ROOT,
    label: 'ตัวอักษร',
    icon: Languages,
    active: (p) => p === KANA_ROOT || p.startsWith(`${KANA_ROOT}/`) || p === '/start',
  },
  {
    to: N5_ROOT,
    label: 'JLPT N5',
    icon: GraduationCap,
    active: (p) => p === N5_ROOT || p.startsWith(`${N5_ROOT}/`),
  },
  { to: REVIEW_ROOT, label: 'ทบทวน', icon: Target, active: (p) => p === REVIEW_ROOT },
];

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
      <Icon size={20} strokeWidth={1.6} aria-hidden />
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
  const { pathname } = useLocation();
  const crumbs = crumbsFor(pathname);
  const { introSeen } = useSettings();
  const onStartPage = useMatch('/start') !== null;
  const showIntro = !introSeen && !onStartPage;

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        ข้ามไปเนื้อหา
      </a>
      <header className={`${styles.header} no-print`}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.brand} aria-label={`${SITE_NAME} — หน้าแรก`}>
            {/* โลโก้ = ป้ายเลขสถานีวงกลมขอบสีแดงชาด มี か (kakitori) */}
            <span className={`kana ${styles.logo}`} aria-hidden>
              か
            </span>
            <span className={styles.brandText}>{SITE_NAME}</span>
          </Link>
          {/* จอกว้าง: เมนูหลักต่อจากโลโก้ (มือถืออยู่แถบล่าง) — หน้าแรกกดได้จากโลโก้ */}
          <nav className={styles.topNav} aria-label="เมนูหลัก">
            {MAIN_NAV.slice(1).map(({ to, label, active }) => (
              <Link
                key={to}
                to={to}
                className={styles.topLink}
                aria-current={active(pathname) ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <CrumbBack crumbs={crumbs} />
          <ThemeToggle />
        </div>
      </header>

      {showIntro && (
        <div className={`${styles.intro} no-print`} role="note">
          <div className={`container ${styles.introInner}`}>
            <span>เพิ่งเริ่มเรียนภาษาญี่ปุ่น? อ่านพื้นฐาน 5 นาทีก่อนเริ่มเขียน</span>
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
        {crumbs.length > 0 && <CrumbTrail crumbs={crumbs} />}
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
        {MAIN_NAV.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={styles.bottomLink}
            aria-current={active(pathname) ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={1.6} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <UpdatePrompt />
      <GoalToast />
      <ScrollRestoration />
    </div>
  );
}
