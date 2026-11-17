import { Navigate, useLocation, useParams } from 'react-router';
import { getScript } from '../data/scripts';
import NotFoundPage from '../pages/NotFoundPage';
import { scriptPath } from './paths';

/**
 * ลิงก์เดิมก่อนจัดหมวด (/hiragana/quiz ฯลฯ) → /kana/hiragana/quiz
 * ลิงก์ที่ผู้ใช้บันทึกไว้หรือแชร์ไปแล้วจึงยังใช้ได้ (คง ?query และ #hash ไว้)
 */
export function LegacyScriptRedirect() {
  const { script, '*': rest = '' } = useParams();
  const { search, hash } = useLocation();
  if (!getScript(script)) return <NotFoundPage />;
  return <Navigate to={`${scriptPath(script!, rest)}${search}${hash}`} replace />;
}
