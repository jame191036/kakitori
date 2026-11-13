import { useEffect } from 'react';
import { useSettings, type ThemePref } from '../features/settings/settings';

const THEME_COLOR = { light: '#faf7f2', dark: '#17161b' } as const;

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
