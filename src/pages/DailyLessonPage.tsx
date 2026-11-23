import { useParams } from 'react-router';
import { dailyPath } from '../app/paths';
import { DAILY_DECK } from '../data/daily';
import { getLesson } from '../data/line';
import { PhraseLesson } from '../features/phrase/PhraseLesson';
import NotFoundPage from './NotFoundPage';

/** บทเรียนชีวิตประจำวัน (หน้าบทใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseLesson) */
export default function DailyLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(DAILY_DECK, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <PhraseLesson key={lesson.id} deck={DAILY_DECK} lesson={lesson} lineTone="daily" pathOf={dailyPath} />;
}
