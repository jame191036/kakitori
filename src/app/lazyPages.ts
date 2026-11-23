import { lazy } from 'react';

// แยกโหลดทีละหน้า (code splitting) ให้หน้าแรกเปิดเร็ว
export const ScriptHomePage = lazy(() => import('../pages/ScriptHomePage'));
export const PracticePage = lazy(() => import('../pages/PracticePage'));
export const PracticeIndex = lazy(() =>
  import('../pages/PracticePage').then((m) => ({ default: m.PracticeIndex })),
);
export const QuizPage = lazy(() => import('../pages/QuizPage'));
export const ReviewPage = lazy(() => import('../pages/ReviewPage'));
export const WorksheetPage = lazy(() => import('../pages/WorksheetPage'));
export const AboutPage = lazy(() => import('../pages/AboutPage'));
export const StartPage = lazy(() => import('../pages/StartPage'));
export const KanaHubPage = lazy(() => import('../pages/KanaHubPage'));
export const ReviewHubPage = lazy(() => import('../pages/ReviewHubPage'));
export const N5HubPage = lazy(() => import('../pages/N5HubPage'));
export const VocabLinePage = lazy(() => import('../pages/VocabLinePage'));
export const VocabLessonPage = lazy(() => import('../pages/VocabLessonPage'));
export const VocabReviewPage = lazy(() => import('../pages/VocabReviewPage'));
export const KanjiLinePage = lazy(() => import('../pages/KanjiLinePage'));
export const KanjiLessonPage = lazy(() => import('../pages/KanjiLessonPage'));
export const KanjiReviewPage = lazy(() => import('../pages/KanjiReviewPage'));
export const GrammarLinePage = lazy(() => import('../pages/GrammarLinePage'));
export const GrammarLessonPage = lazy(() => import('../pages/GrammarLessonPage'));
export const GrammarReviewPage = lazy(() => import('../pages/GrammarReviewPage'));
export const ExamHubPage = lazy(() => import('../pages/ExamHubPage'));
export const ExamPage = lazy(() => import('../pages/ExamPage'));
