import { useCallback, useSyncExternalStore } from 'react';

/**
 * เสียงอ่านภาษาญี่ปุ่นจากเบราว์เซอร์ (Web Speech API) — ฟรี ไม่ต้องมีไฟล์เสียง
 * ถ้าเครื่องไม่มีเสียงภาษาญี่ปุ่น ปุ่มเสียงและข้อสอบแบบฟังจะถูกซ่อน/ปิดไว้
 * (ภายหลังเปลี่ยนไปใช้ไฟล์เสียงอัดจริงได้ โดยแก้แค่ไฟล์นี้)
 */

const synth: SpeechSynthesis | undefined =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;

let voice: SpeechSynthesisVoice | null = null;
const listeners = new Set<() => void>();

function pickVoice(): void {
  if (!synth) return;
  const ja = synth.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  // เลือกเสียงที่ติดมากับเครื่องก่อน (ใช้ได้แม้ออฟไลน์)
  const next = ja.find((v) => v.localService) ?? ja[0] ?? null;
  if (next !== voice) {
    voice = next;
    listeners.forEach((l) => l());
  }
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getAvailable = () => voice !== null;

/** ตรวจแบบไม่ใช้ hook (เช่นตอนสร้างชุดคำถาม) */
export const isSpeechAvailable = getAvailable;

export function speak(text: string, rate = 0.8): void {
  if (!synth || !voice) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  synth.speak(u);
}

/**
 * อ่านหลายประโยคต่อกัน (บทสนทนา) — pitch ต่างกันให้พอแยกผู้พูดได้ (เครื่องส่วนใหญ่มีเสียงญี่ปุ่นเสียงเดียว)
 */
export function speakSequence(lines: readonly { text: string; pitch?: number }[], rate = 0.8): void {
  if (!synth || !voice) return;
  synth.cancel();
  for (const line of lines) {
    const u = new SpeechSynthesisUtterance(line.text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    if (line.pitch) u.pitch = line.pitch;
    synth.speak(u);
  }
}

export function useSpeech(): { available: boolean; speak: (text: string) => void } {
  const available = useSyncExternalStore(subscribe, getAvailable, () => false);
  const say = useCallback((text: string) => speak(text), []);
  return { available, speak: say };
}
