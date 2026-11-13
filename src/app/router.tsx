import { createBrowserRouter } from 'react-router';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import { AppLayout } from './AppLayout';
import {
  AboutPage,
  PracticeIndex,
  PracticePage,
  QuizPage,
  ReviewPage,
  ScriptHomePage,
  WorksheetPage,
} from './lazyPages';
import { RouteError } from './RouteError';
import { ScriptRoute } from './ScriptContext';

/**
 * เส้นทางของเว็บ — ทุกหน้าที่อยู่ใต้ /:script ใช้ได้กับทุกชุดตัวอักษร
 * (เช่น /hiragana/quiz และในอนาคต /katakana/quiz)
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
          {
            path: ':script',
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
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
