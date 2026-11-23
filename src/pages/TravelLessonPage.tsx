import { useParams } from 'react-router';
import { travelPath } from '../app/paths';
import { getLesson } from '../data/line';
import { TRAVEL_DECK } from '../data/travel';
import { PhraseLesson } from '../features/phrase/PhraseLesson';
import NotFoundPage from './NotFoundPage';

/** บทเรียนท่องเที่ยว (หน้าบทใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseLesson) */
export default function TravelLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(TRAVEL_DECK, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <PhraseLesson key={lesson.id} deck={TRAVEL_DECK} lesson={lesson} lineTone="travel" pathOf={travelPath} />;
}
