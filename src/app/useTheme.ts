import { useEffect } from 'react';
import { useSettings, type ThemePref } from '../features/settings/settings';

/** ตรงกับ --surface ใน global.css = สีหัวเว็บ (แถบบนสุดของหน้า) → แถบสถานะมือถือกลืนกับหัวเว็บ */
const THEME_COLOR = { light: '#ffffff', dark: '#24231f' } as const;

/** ใส่ data-theme ที่ <html> และปรับสีแถบสถานะของมือถือให้ตรงกับธีม */
export function useApplyTheme(): ThemePref {
  const { theme } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;

    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      const media = meta.getAttribute('media') ?? '';
      const systemValue = media.includes('dark') ? THEME_COLOR.dark : THEME_COLOR.light;
      meta.content = theme === 'system' ? systemValue : THEME_COLOR[theme];
    });
  }, [theme]);
  return theme;
}
