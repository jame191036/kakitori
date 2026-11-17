import { createContext, use } from 'react';
import { Outlet, useParams } from 'react-router';
import { getScript } from '../data/scripts';
import type { ScriptPack } from '../data/types';
import { packTone, tone } from '../lib/tone';
import NotFoundPage from '../pages/NotFoundPage';

const ScriptContext = createContext<ScriptPack | null>(null);

/** route ครอบหน้าที่อยู่ใต้ /:script — ตรวจว่ามีชุดตัวอักษรนี้จริง */
export function ScriptRoute() {
  const { script } = useParams();
  const pack = getScript(script);
  if (!pack) return <NotFoundPage />;
  return (
    <ScriptContext value={pack}>
      {/* key: เมื่อสลับชุด (เช่น /hiragana/... → /katakana/...) ให้หน้าเริ่มใหม่ทั้งหมด
          ไม่อย่างนั้นสถานะเดิม (กระดานเขียน ข้อสอบ) จะค้างข้ามชุด เพราะ id ตัวอักษรของคานะทั้งสองชุดเหมือนกัน */}
      {/* สีประจำสายของชุดนี้ (แท็บ ตัวเลือก ป้าย) ส่งต่อให้ทุกหน้าในชุด — display: contents ไม่กระทบการจัดวาง */}
      <div key={pack.id} className="tone" style={{ ...tone(packTone(pack)), display: 'contents' }}>
        <Outlet />
      </div>
    </ScriptContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useScriptPack(): ScriptPack {
  const pack = use(ScriptContext);
  if (!pack) throw new Error('useScriptPack ต้องใช้ภายใต้ <ScriptRoute>');
  return pack;
}
