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
