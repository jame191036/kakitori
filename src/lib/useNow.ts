import { useSyncExternalStore } from 'react';

/**
 * เวลาปัจจุบันสำหรับใช้ตอน render (อัปเดตทุกนาที และทันทีที่กลับมาเปิดแท็บ)
 * — ใช้แทนการเรียก Date.now() ตรงๆ ใน component ซึ่งทำให้ render ไม่คงที่
 */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: number | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function onVisible() {
  if (document.visibilityState === 'visible') tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now(); // React อ่านค่าใหม่เองหลัง subscribe
    timer = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

const getNow = () => now;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getNow, getNow);
}
