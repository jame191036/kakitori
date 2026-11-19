import { createBrowserRouter } from 'react-router';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import { AppLayout } from './AppLayout';
import { LegacyScriptRedirect } from './LegacyScriptRedirect';
import {
  AboutPage,
  KanaHubPage,
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
          { path: 'n5/vocab/:lessonId', element: <VocabLessonPage /> },
          { path: ':script/*', element: <LegacyScriptRedirect /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
