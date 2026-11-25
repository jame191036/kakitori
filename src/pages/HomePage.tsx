import { ArrowRight, TrainFront } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { animePath, conjPath, dailyPath, grammarPath, kanjiPath, REVIEW_ROOT, travelPath, vocabPath } from '../app/paths';
import { SECTIONS } from '../app/sections';
import { LessonSign, StationSign, type LessonSignStop } from '../components/train/StationSign';
import { groupLabel, scriptList } from '../data/scripts';
import { streakInfo } from '../features/progress/activity';
import {
  buildPath,
  charState,
  nextStep,
  rowNeeds,
  stepHref,
  type NextStep,
  type PathStep,
} from '../features/progress/learningPath';
import type { ProgressData } from '../features/progress/progressLogic';
import { activityStore, progressStore } from '../features/progress/progressStore';
import { packStations } from '../features/progress/stations';
import { lessonCode, lessonWords, segmentOf, type LineDeck, type LineLesson } from '../data/line';
import { useLineDecks, type LineDecks } from '../data/lineDecks';
import { LINE_LESSON_COUNT } from '../data/lineMeta';
import { deckProgress, lastStudied, lessonStates, nextLesson, wordPassed } from '../features/line/lineLogic';
import { useSettings } from '../features/settings/settings';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone, type Tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './HomePage.module.css';

/**
 * หน้าแรก = ชานชาลา: ป้ายสถานีต่อไปของผู้เรียน (ขั้นถัดไปของเส้นทางเรียนต่อ) + ปุ่มไปต่อ
 * + ตั๋วสรุป (วันต่อเนื่อง · เป้าวันนี้ · ตราสถานี) + แผนที่สาย (หมวด) — หมวดที่ยังไม่เปิดเป็น 工事中
 */
export default function HomePage() {
  const progress = useStore(progressStore);
  const activity = useStore(activityStore);
  const { dailyGoal } = useSettings();
  const now = useNow();
  const path = useMemo(() => buildPath(scriptList), []);
  const step = nextStep(path, progress);
  const streak = streakInfo(activity, now, dailyGoal);

  // สถานีบนป้าย: ขั้นถัดไป · ถ้าผ่านครบแล้วใช้สถานีสุดท้ายของเส้นทาง (ปลายทาง)
  const lastPack = path[path.length - 1]!.pack;
  const stations = packStations(step?.pack ?? lastPack);
  const at = step ? stations.findIndex((st) => st.group.id === step.group.id) : stations.length - 1;
  const station = stations[at]!;
  const isStart = !!step && step.index === 1 && step.status.kind === 'write' && step.status.remaining === step.chars.length;

  // สาย N5: ข้อมูลทั้งชุดโหลดแยก (หน้าแรกจะได้เปิดเร็ว) — โหลดเฉพาะเมื่อต้องใช้:
  // เคยเรียนสายไหนแล้ว (นับตรา · หาบทถัดไป) หรือจบสายตัวอักษรแล้ว (ป้ายชี้สาย N5)
  const started = HERO_LINES.map((line) => {
    const p = progress.scripts[line.progressKey];
    return { line, last: lastStudied(p), started: !!p && Object.keys(p).length > 0 };
  });
  const decks = useLineDecks(!step || started.some((l) => l.started));
  const lines = started.map((l) => {
    const deck = decks?.[l.line.id];
    const p = deck ? deckProgress(deck, progress) : undefined;
    return {
      ...l,
      deck,
      /** บทถัดไป · null = จบสายแล้ว · undefined = ยังโหลดข้อมูลไม่เสร็จ */
      next: deck ? nextLesson(deck, p) : undefined,
      /** null = ยังโหลดข้อมูลไม่เสร็จ (ไม่เคยเรียนสายนี้ = 0 ได้เลย) */
      passed: deck ? lessonStates(deck, p).filter((s) => s === 'done').length : l.started ? null : 0,
    };
  });
  // บทที่ผ่านแล้ว / ทั้งหมด ของสายบทเรียนในหมวดนั้น (null = ยังโหลดข้อมูลไม่เสร็จ)
  const sectionLines = (section?: HeroLine['section']) => lines.filter((l) => !section || l.line.section === section);
  const passedIn = (section?: HeroLine['section']) => {
    const list = sectionLines(section);
    return list.some((l) => l.passed === null) ? null : list.reduce((n, l) => n + (l.passed ?? 0), 0);
  };
  const totalIn = (section?: HeroLine['section']) =>
    sectionLines(section).reduce((n, l) => n + LINE_LESSON_COUNT[l.line.progressKey], 0);
  const linesPassed = passedIn();
  // ตรา = สถานีที่ผ่านแล้วของทุกสาย (ตัวอักษร + คำศัพท์ + คันจิ + ไวยากรณ์ + ท่องเที่ยว)
  const stamps = linesPassed === null ? null : (step ? step.doneCount : path.length) + linesPassed;
  const allStations = path.length + totalIn();
  const remaining = Math.max(0, dailyGoal - streak.todayCount);

  // ป้ายชี้สายที่เรียนล่าสุด (ฝึก/ตอบครั้งล่าสุด) · สายที่จบแล้วไม่นับ · ยังไม่เคยเรียน = สายตัวอักษร
  // จบทุกสาย = ปลายทางสายตัวอักษร · ระหว่างโหลดข้อมูล ถือว่าสายที่เคยเรียนยังไม่จบ (รู้แน่เมื่อโหลดเสร็จ)
  const kanaLast = Math.max(0, ...scriptList.map((p) => lastStudied(progress.scripts[p.id])));
  const candidates = [
    ...(step ? [{ id: 'kana', last: kanaLast }] : []),
    ...lines.filter((l) => (l.deck ? l.next : l.started || !step)).map((l) => ({ id: l.line.id, last: l.last })),
  ];
  const heroId = candidates.reduce<(typeof candidates)[number] | undefined>(
    (best, c) => (!best || c.last > best.last ? c : best),
    undefined,
  )?.id;
  const hero = lines.find((l) => l.line.id === heroId);
  // ทางลัดไปสายบทเรียนอื่นที่เคยเรียนแล้วและยังไม่จบ
  const switches = lines
    .filter((l) => l.next && l.last > 0 && l.line.id !== heroId)
    .map((l) => ({ line: l.line, deck: l.deck!, lesson: l.next! }));

  return (
    <div className={cx('container', styles.page)}>
      {hero && !hero.deck ? (
        <HeroLoading />
      ) : hero?.deck && hero.next && decks ? (
        <LineHero
          line={hero.line}
          deck={hero.deck}
          decks={decks}
          lesson={hero.next}
          started={hero.last > 0}
          kanaStep={step}
          switches={switches}
          progress={progress}
        />
      ) : (
      <section className={styles.hero} aria-label="สถานีต่อไป">
        <div>
          <p className={styles.kicker}>
            {step ? (
              <>
                <span className="kana">{isStart ? '始発' : '次は'}</span> ·{' '}
                {isStart ? 'สถานีแรกของคุณ' : 'สถานีต่อไปของคุณ'}
              </>
            ) : (
              <>
                <span className="kana">終点</span> · ผ่านครบทุกสถานีแล้ว
              </>
            )}
          </p>
          <StationSign station={station} prev={stations[at - 1] ?? null} next={stations[at + 1] ?? null} />
        </div>

        <div className={styles.side}>
          <h1 className={styles.h1}>เรียนภาษาญี่ปุ่น เหมือนนั่งรถไฟไปทีละสถานี</h1>
          <p className={styles.lead}>
            แต่ละแถวตัวอักษรคือหนึ่งสถานี ฝึกเขียนให้ครบ ทำแบบทดสอบให้ผ่าน แล้วรับตราสถานีไปสะสม — ฟรี
            ไม่ต้องสมัครสมาชิก
          </p>
          {step ? <Platform step={step} progress={progress} /> : null}
          {step ? (
            <Link to={stepHref(step)} className={cx('btn btn-primary', styles.cta)}>
              {step.status.kind === 'write' ? (
                <>
                  ฝึกเขียน <span className="kana">{step.status.next.char}</span> ต่อ
                </>
              ) : (
                <>
                  ทดสอบแถว <span className="kana">{step.group.head}</span>
                </>
              )}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          ) : (
            <Link to={REVIEW_ROOT} className={cx('btn btn-primary', styles.cta)}>
              ไปหน้าทบทวน
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          )}
          <LineSwitches switches={switches} />
        </div>
      </section>
      )}

      <ul className={styles.tickets} aria-label="สรุปการเดินทาง">
        <li className={styles.ticket}>
          <span className={styles.ticketBig}>{streak.current} วัน</span>
          <span className={styles.ticketSmall}>เดินทางติดต่อกัน (ทำครบเป้า)</span>
        </li>
        <li className={styles.ticket}>
          <span className={styles.ticketBig}>
            {Math.min(streak.todayCount, dailyGoal)}/{dailyGoal}
          </span>
          <span className={styles.ticketSmall}>
            {streak.todayMet ? 'ถึงเป้าวันนี้แล้ว' : `ครั้งวันนี้ (อีก ${remaining} ครั้งครบเป้า)`}
          </span>
        </li>
        <li className={styles.ticket} aria-busy={stamps === null}>
          <span className={styles.ticketBig}>{stamps ?? '…'} ตรา</span>
          <span className={styles.ticketSmall}>
            ตราสถานีที่สะสมแล้ว (จาก {allStations})
          </span>
        </li>
      </ul>

      <h2 className={styles.sectionTitle}>
        <span className="kana">路線図</span> เลือกเส้นทาง
      </h2>
      <ul className={styles.lines}>
        {SECTIONS.map((sec) => {
          const body = (
            <>
              <span className={cx(styles.badge, sec.glyph !== 'N5' && 'kana')}>{sec.glyph}</span>
              <span className={styles.lineInfo}>
                <span className={styles.lineName}>{sec.name}</span>
                <span className={styles.lineDesc}>{sec.desc}</span>
              </span>
              <span className={styles.trackWrap}>
                {sec.id === 'kana' ? (
                  <KanaTrack path={path} reached={step ? step.index - 1 : path.length} />
                ) : sec.id === 'jlpt-n5' || sec.id === 'travel' || sec.id === 'daily' || sec.id === 'anime' ? (
                  <LessonTrack passed={passedIn(sec.id) ?? 0} total={totalIn(sec.id)} />
                ) : (
                  <>
                    <span className={styles.trackSoon} />
                    <span className={styles.koji}>
                      <span className="kana">工事中</span> กำลังสร้าง
                    </span>
                  </>
                )}
              </span>
            </>
          );
          return (
            <li key={sec.id} className="tone" style={tone(sec.tone)}>
              {sec.to ? (
                <Link to={sec.to} className={cx(styles.line, styles.lineLive)}>
                  {body}
                  <span className={styles.lineGo}>
                    ขึ้นรถ <ArrowRight size={16} strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              ) : (
                <div className={cx(styles.line, styles.lineSoon)} aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className={cx('small muted', styles.privacy)}>
        เว็บนี้ไม่มีระบบสมาชิกและไม่ส่งข้อมูลของคุณไปที่ไหน ความคืบหน้าถูกจำไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}

/** ชานชาลา: ตัวอักษรในแถวนี้ + บอกว่าต้องทำอะไรต่อ */
function Platform({ step, progress }: { step: NextStep; progress: ProgressData }) {
  const needs = rowNeeds(step.group.kind);
  const p = progress.scripts[step.pack.id];
  const { status } = step;
  const STATE_TITLE = {
    done: 'ผ่านแล้ว',
    written: 'เขียนแล้ว ยังไม่เคยตอบถูก',
    todo: needs.write ? 'ยังไม่ได้เขียน' : 'ยังไม่เคยตอบถูก',
  } as const;

  return (
    <div className={styles.platform}>
      <p className={styles.platformLabel}>
        ชานชาลา {step.pack.name} {groupLabel(step.group)}
      </p>
      <ol className={styles.chips} aria-label="สถานะตัวอักษรในแถวนี้">
        {step.chars.map((c) => {
          const state = charState(p?.[c.id], needs);
          return (
            <li key={c.id} className={styles[state]} title={STATE_TITLE[state]}>
              <span className="kana">{c.char}</span>
              <small>{c.romaji}</small>
            </li>
          );
        })}
      </ol>
      <p className={styles.todo}>
        {status.kind === 'write'
          ? needs.correct
            ? `ฝึกเขียนให้ครบทุกตัวในแถว (เหลือ ${status.remaining} ตัว) แล้วทำแบบทดสอบให้ผ่าน`
            : `ฝึกเขียนตัวเล็กให้ครบทุกตัว (เหลือ ${status.remaining} ตัว)`
          : needs.write
            ? `เขียนครบแล้ว! ทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`
            : `ตัวควบฝึกอ่านและฟัง: ทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`}
      </p>
    </div>
  );
}

/** สายบทเรียนที่ป้ายหน้าแรกชี้ได้ (นอกจากสายตัวอักษร) — ข้อมูลของสายอยู่ใน LineDecks (โหลดแยก) */
interface HeroLine {
  id: keyof LineDecks;
  progressKey: keyof typeof LINE_LESSON_COUNT;
  /** หมวดบนหน้าแรกที่สายนี้อยู่ (นับรางย่อของหมวด) */
  section: 'jlpt-n5' | 'travel' | 'daily' | 'anime';
  /** สีสายบนป้าย */
  tone: Tone;
  /** ชื่อสายภาษาญี่ปุ่นบนป้าย */
  lineJa: string;
  lineName: string;
  /** ชื่อสั้นในข้อความ "สถานีแรกของ…" */
  shortName: string;
  lessonHref: (lessonId: string) => string;
  /** ข้อความในชิปของแต่ละรายการในบท */
  chip: (decks: LineDecks, id: string) => { main: string; small: string };
  /** ชิปคำยาว (คำศัพท์) ใช้ตัวเล็กลง */
  wideChips: boolean;
  lead: string;
  todo: (left: number) => string;
}

// 単語線 = สายคำศัพท์ · 漢字線 = สายคันจิ · 文法線 = สายไวยากรณ์ · 活用線 = สายผันคำ
const HERO_LINES: readonly HeroLine[] = [
  {
    id: 'vocab',
    progressKey: 'vocab-n5',
    section: 'jlpt-n5',
    tone: 'n5',
    lineJa: '単語線',
    lineName: 'สายคำศัพท์ N5',
    shortName: 'สายคำศัพท์',
    lessonHref: vocabPath,
    chip: (decks, id) => {
      const w = decks.vocab.words[id]!;
      return { main: w.kana, small: w.thai };
    },
    wideChips: true,
    lead: 'แต่ละบทคำศัพท์คือหนึ่งสถานี เรียน ฝึก แล้วทดสอบให้ถูกครบทุกคำ แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `เรียนการ์ดคำ ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกคำ (เหลือ ${left} คำ)`,
  },
  {
    id: 'kanji',
    progressKey: 'kanji-n5',
    section: 'jlpt-n5',
    tone: 'n5',
    lineJa: '漢字線',
    lineName: 'สายคันจิ N5',
    shortName: 'สายคันจิ',
    lessonHref: kanjiPath,
    chip: (decks, id) => {
      const k = decks.kanji.words[id]!;
      return { main: k.char, small: k.thai.split(' / ')[0]! };
    },
    wideChips: false,
    lead: 'แต่ละบทคันจิคือหนึ่งสถานี ดูลำดับขีด ฝึกเขียน แล้วทดสอบความหมายและคำอ่าน แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `ดูลำดับขีด ฝึกเขียน แล้วทำแบบทดสอบให้ตอบถูกครบทุกตัว (เหลือ ${left} ตัว)`,
  },
  {
    id: 'grammar',
    progressKey: 'grammar-n5',
    section: 'jlpt-n5',
    tone: 'n5',
    lineJa: '文法線',
    lineName: 'สายไวยากรณ์ N5',
    shortName: 'สายไวยากรณ์',
    lessonHref: grammarPath,
    chip: (decks, id) => {
      const p = decks.grammar.words[id]!;
      return { main: p.pattern, small: p.title };
    },
    wideChips: true,
    lead: 'แต่ละบทไวยากรณ์คือหนึ่งสถานี อ่านคำอธิบายและประโยคตัวอย่าง ฝึก แล้วทดสอบให้ถูกครบทุกรูป แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `อ่านการ์ดไวยากรณ์ ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกรูป (เหลือ ${left} รูป)`,
  },
  {
    id: 'conj',
    progressKey: 'conj-n5',
    section: 'jlpt-n5',
    tone: 'n5',
    lineJa: '活用線',
    lineName: 'สายผันคำ N5',
    shortName: 'สายผันคำ',
    lessonHref: conjPath,
    chip: (decks, id) => {
      const r = decks.conj.words[id]!;
      return { main: r.pattern, small: r.title };
    },
    wideChips: true,
    lead: 'แต่ละบทผันคำคือหนึ่งสถานี อ่านกฎ ฝึกผันหลายๆ คำ แล้วทดสอบให้ถูกครบทุกกฎ แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `อ่านการ์ดกฎ ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกกฎ (เหลือ ${left} กฎ)`,
  },
  {
    // 旅行線 = สายท่องเที่ยว
    id: 'travel',
    progressKey: 'travel',
    section: 'travel',
    tone: 'travel',
    lineJa: '旅行線',
    lineName: 'สายท่องเที่ยว',
    shortName: 'สายท่องเที่ยว',
    lessonHref: travelPath,
    chip: (decks, id) => {
      const x = decks.travel.words[id]!;
      // ป้าย = ตัวหนังสือบนป้าย · วลี = คานะ
      return { main: x.kind === 'sign' ? x.written : x.kana, small: x.thai };
    },
    wideChips: true,
    lead: 'แต่ละบทวลีท่องเที่ยวคือหนึ่งสถานี ฟังวลี ฝึกพูดและฟังให้ออก แล้วทดสอบให้ถูกครบทุกวลี แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `ฟังการ์ดวลี ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกวลี (เหลือ ${left} วลี)`,
  },
  {
    // 日常線 = สายชีวิตประจำวัน
    id: 'daily',
    progressKey: 'daily',
    section: 'daily',
    tone: 'daily',
    lineJa: '日常線',
    lineName: 'สายชีวิตประจำวัน',
    shortName: 'สายชีวิตประจำวัน',
    lessonHref: dailyPath,
    chip: (decks, id) => {
      const x = decks.daily.words[id]!;
      return { main: x.kana, small: x.thai };
    },
    wideChips: true,
    lead: 'แต่ละบทคือหนึ่งสถานี ฟังวลีและบทสนทนาตัวอย่าง ฝึก แล้วทดสอบให้ถูกครบทุกวลี แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `อ่านการ์ดวลีและบทสนทนา ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกวลี (เหลือ ${left} วลี)`,
  },
  {
    // アニメ線 = สายการ์ตูน
    id: 'anime',
    progressKey: 'anime',
    section: 'anime',
    tone: 'anime',
    lineJa: 'アニメ線',
    lineName: 'สายการ์ตูน',
    shortName: 'สายการ์ตูน',
    lessonHref: animePath,
    chip: (decks, id) => {
      const x = decks.anime.words[id]!;
      return { main: x.kana, small: x.thai };
    },
    wideChips: true,
    lead: 'แต่ละบทคือหนึ่งสถานี ฟังวลีและฉากตัวอย่างแบบการ์ตูน ฝึก แล้วทดสอบให้ถูกครบทุกวลี แล้วรับตราสถานีไปสะสม — ฟรี ไม่ต้องสมัครสมาชิก',
    todo: (left) => `อ่านการ์ดวลีและฉากตัวอย่าง ฝึก แล้วทำแบบทดสอบให้ตอบถูกครบทุกวลี (เหลือ ${left} วลี)`,
  },
];

const lessonStop = (deck: LineDeck, lesson: LineLesson | undefined): LessonSignStop | null =>
  lesson ? { code: lessonCode(deck, lesson), name: lesson.name, title: lesson.title } : null;

interface LineSwitch {
  line: HeroLine;
  deck: LineDeck;
  lesson: LineLesson;
}

/** ทางลัดไปสายบทเรียนอื่นที่เรียนค้างไว้ (ใต้ปุ่มหลัก) */
function LineSwitches({ switches }: { switches: readonly LineSwitch[] }) {
  return switches.map(({ line, deck, lesson }) => (
    <Link key={line.id} to={line.lessonHref(lesson.id)} className={styles.switch}>
      หรือไปต่อ{line.lineName}: {lessonCode(deck, lesson)} {lesson.title} →
    </Link>
  ));
}

/** ระหว่างโหลดข้อมูลสาย N5 (ครั้งแรกที่เปิดเว็บ — ปกติแป๊บเดียว): กรอบป้ายเปล่า กันหน้ากระโดด */
function HeroLoading() {
  return (
    <section className={cx(styles.hero, styles.heroLoading)} aria-label="สถานีต่อไป" aria-busy="true">
      <div className={styles.signGhost} />
      <p className="muted">กำลังโหลดสถานีต่อไป…</p>
    </section>
  );
}

/** ป้ายสถานี + ชานชาลาเมื่อสายที่เรียนล่าสุดคือสายบทเรียน (คำศัพท์ / คันจิ / ไวยากรณ์ N5) */
function LineHero({
  line,
  deck,
  decks,
  lesson,
  started,
  kanaStep,
  switches,
  progress,
}: {
  line: HeroLine;
  deck: LineDeck;
  decks: LineDecks;
  lesson: LineLesson;
  started: boolean;
  kanaStep: NextStep | null;
  switches: readonly LineSwitch[];
  progress: ProgressData;
}) {
  const at = deck.lessons.indexOf(lesson);
  const p = deckProgress(deck, progress);
  const items = lessonWords(deck, lesson);
  const left = items.filter((w) => !wordPassed(w, p)).length;
  const segment = segmentOf(deck, lesson);
  const STATE_TITLE = { done: 'ตอบถูกแล้ว', written: 'ฝึกแล้ว ยังไม่ผ่านแบบทดสอบ', todo: 'ยังไม่ได้ฝึก' } as const;

  return (
    <section className={styles.hero} aria-label="สถานีต่อไป">
      <div>
        <p className={styles.kicker}>
          {started ? (
            <>
              <span className="kana">次は</span> · สถานีต่อไปของคุณ
            </>
          ) : (
            <>
              <span className="kana">始発</span> · สถานีแรกของ{line.shortName}
            </>
          )}
        </p>
        <LessonSign
          lesson={lessonStop(deck, lesson)!}
          prev={lessonStop(deck, deck.lessons[at - 1])}
          next={lessonStop(deck, deck.lessons[at + 1])}
          lineTone={line.tone}
          lineJa={line.lineJa}
          lineName={line.lineName}
        />
      </div>

      <div className={styles.side}>
        <h1 className={styles.h1}>เรียนภาษาญี่ปุ่น เหมือนนั่งรถไฟไปทีละสถานี</h1>
        <p className={styles.lead}>{line.lead}</p>
        <div className={styles.platform}>
          <p className={styles.platformLabel}>
            ชานชาลา {line.lineName}
            {segment ? ` · ${segment.title}` : ''}
          </p>
          <ol className={cx(styles.chips, line.wideChips && styles.wordChips)} aria-label="สถานะในบทนี้">
            {items.map((w) => {
              const stat = p?.[w.id];
              const state = wordPassed(w, p) ? 'done' : (stat?.practiced ?? 0) > 0 ? 'written' : 'todo';
              const chip = line.chip(decks, w.id);
              return (
                <li key={w.id} className={styles[state]} title={STATE_TITLE[state]}>
                  <span className="kana" lang="ja">
                    {chip.main}
                  </span>
                  <small>{chip.small}</small>
                </li>
              );
            })}
          </ol>
          <p className={styles.todo}>{line.todo(left)}</p>
        </div>
        <Link to={line.lessonHref(lesson.id)} className={cx('btn btn-primary', styles.cta)}>
          เรียนบท {lesson.title}
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </Link>
        {kanaStep && (
          <Link to={stepHref(kanaStep)} className={styles.switch}>
            หรือไปต่อสายตัวอักษร: {kanaStep.pack.name} {groupLabel(kanaStep.group)} →
          </Link>
        )}
        <LineSwitches switches={switches} />
      </div>
    </section>
  );
}

/** รางย่อของสายที่นับเป็นบท (คำศัพท์ N5): ต้นสาย → ปลายทาง */
function LessonTrack({ passed, total }: { passed: number; total: number }) {
  const pct = (passed / total) * 100;
  return (
    <span className={styles.track} aria-label={`ผ่านแล้ว ${passed} จาก ${total} บท`} role="img">
      <span className={styles.trackFill} style={{ width: `${pct}%` }} />
      <span className={styles.stop} style={{ left: '0%' }}>
        <span className={cx(styles.stopDot, styles.stopOn)} />
        <span className={styles.stopLabel}>บทที่ 1</span>
      </span>
      <span className={styles.stop} style={{ left: '100%' }}>
        <span className={cx(styles.stopDot, passed >= total && styles.stopOn)} />
        <span className={styles.stopLabel}>บทที่ {total}</span>
      </span>
      <span className={styles.trainMarker} style={{ left: `${pct}%` }}>
        <TrainFront size={14} strokeWidth={2.2} aria-hidden />
      </span>
    </span>
  );
}

/** รางย่อของสายตัวอักษร: 4 ช่วง (ฮิรางานะ ร.1 → คาตาคานะ ร.1 → ฮิรางานะ ร.2 → คาตาคานะ ร.2) */
function KanaTrack({ path, reached }: { path: readonly PathStep[]; reached: number }) {
  const total = path.length;
  const stops = path
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => i === 0 || path[i - 1]!.pack.id !== s.pack.id || path[i - 1]!.level !== s.level)
    .map(({ s, i }) => ({ label: `${s.pack.name} ร.${s.level}`, at: (i / total) * 100, on: reached >= i }));
  const pct = (reached / total) * 100;

  return (
    <span className={styles.track} aria-label={`ผ่านแล้ว ${reached} จาก ${total} สถานี`} role="img">
      <span className={styles.trackFill} style={{ width: `${pct}%` }} />
      {stops.map((st) => (
        <span key={st.label} className={styles.stop} style={{ left: `${st.at}%` }}>
          <span className={cx(styles.stopDot, st.on && styles.stopOn)} />
          <span className={styles.stopLabel}>{st.label}</span>
        </span>
      ))}
      <span className={styles.stop} style={{ left: '100%' }}>
        <span className={cx(styles.stopDot, reached >= total && styles.stopOn)} />
        <span className={styles.stopLabel}>ปลายทาง</span>
      </span>
      <span className={styles.trainMarker} style={{ left: `${pct}%` }}>
        <TrainFront size={14} strokeWidth={2.2} aria-hidden />
      </span>
    </span>
  );
}
