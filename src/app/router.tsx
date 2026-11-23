import { createBrowserRouter } from 'react-router';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import { AppLayout } from './AppLayout';
import { LegacyScriptRedirect } from './LegacyScriptRedirect';
import {
  AboutPage,
  ExamHubPage,
  ExamPage,
  GrammarLessonPage,
  GrammarLinePage,
  GrammarReviewPage,
  KanaHubPage,
  KanjiLessonPage,
  KanjiLinePage,
  KanjiReviewPage,
  N5HubPage,
  PracticeIndex,
  PracticePage,
  QuizPage,
  ReviewHubPage,
  ReviewPage,
  ScriptHomePage,
  StartPage,
  VocabLessonPage,
  VocabLinePage,
  VocabReviewPage,
  WorksheetPage,
} from './lazyPages';
import { RouteError } from './RouteError';
import { ScriptRoute } from './ScriptContext';

/**
 * เส้นทางของเว็บ (โครงเมนูแบบหน้าศูนย์รวมทีละชั้น — ดู app/paths.ts)
 * ทุกหน้าที่อยู่ใต้ /kana/:script ใช้ได้กับทุกชุดตัวอักษร
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'start', element: <StartPage /> },
          { path: 'review', element: <ReviewHubPage /> },
          { path: 'kana', element: <KanaHubPage /> },
          {
            path: 'kana/:script',
            element: <ScriptRoute />,
            children: [
              { index: true, element: <ScriptHomePage /> },
              { path: 'practice', element: <PracticeIndex /> },
              { path: 'practice/:charId', element: <PracticePage /> },
              { path: 'quiz', element: <QuizPage /> },
              { path: 'review', element: <ReviewPage /> },
              { path: 'worksheet', element: <WorksheetPage /> },
            ],
          },
          { path: 'n5', element: <N5HubPage /> },
          { path: 'n5/vocab', element: <VocabLinePage /> },
          { path: 'n5/vocab/review', element: <VocabReviewPage /> },
          { path: 'n5/vocab/:lessonId', element: <VocabLessonPage /> },
          { path: 'n5/kanji', element: <KanjiLinePage /> },
          { path: 'n5/kanji/review', element: <KanjiReviewPage /> },
          { path: 'n5/grammar', element: <GrammarLinePage /> },
          { path: 'n5/grammar/review', element: <GrammarReviewPage /> },
          { path: 'n5/grammar/:lessonId', element: <GrammarLessonPage /> },
          { path: 'n5/kanji/:lessonId', element: <KanjiLessonPage /> },
          { path: 'n5/exam', element: <ExamHubPage /> },
          { path: 'n5/exam/:setId', element: <ExamPage /> },
          { path: ':script/*', element: <LegacyScriptRedirect /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
