import { Volume2 } from 'lucide-react';
import { useSpeech } from '../features/speech/useSpeech';
import { cx } from '../lib/cx';

interface SpeakButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** ปุ่มฟังเสียง — ซ่อนอัตโนมัติถ้าเครื่องไม่มีเสียงภาษาญี่ปุ่น */
export function SpeakButton({ text, label = 'ฟังเสียง', size = 'md', className }: SpeakButtonProps) {
  const { available, speak } = useSpeech();
  if (!available) return null;
  const icon = size === 'lg' ? 28 : size === 'sm' ? 16 : 20;
  return (
    <button
      type="button"
      className={cx('btn btn-icon', size === 'sm' && 'btn-sm', className)}
      style={size === 'lg' ? { width: 64, height: 64 } : undefined}
      onClick={() => speak(text)}
      aria-label={label}
      title={label}
    >
      <Volume2 size={icon} strokeWidth={1.6} aria-hidden />
    </button>
  );
}
