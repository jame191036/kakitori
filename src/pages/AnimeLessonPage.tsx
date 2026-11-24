import { useParams } from 'react-router';
import { animePath } from '../app/paths';
import { ANIME_DECK } from '../data/anime';
import { getLesson } from '../data/line';
import { PhraseLesson } from '../features/phrase/PhraseLesson';
import NotFoundPage from './NotFoundPage';

/** บทเรียนการ์ตูน (หน้าบทใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseLesson) */
export default function AnimeLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(ANIME_DECK, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <PhraseLesson key={lesson.id} deck={ANIME_DECK} lesson={lesson} lineTone="anime" pathOf={animePath} />;
}
