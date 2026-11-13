import { useSyncExternalStore } from 'react';

/**
 * store เล็กๆ ที่เก็บค่าไว้ใน localStorage ของเบราว์เซอร์ (ไม่มี server / database)
 * - ถ้าเบราว์เซอร์ไม่ให้ใช้ storage (เช่นโหมดส่วนตัวบางแบบ) เว็บยังใช้งานได้ปกติ แค่จำค่าไม่ได้
 * - ซิงก์ข้ามแท็บอัตโนมัติผ่าน event "storage"
 */
export interface Store<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  reset(): void;
}

function readStorage(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // storage เต็มหรือถูกปิด — ข้ามไป ค่าจะอยู่แค่ในหน่วยความจำ
  }
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  /** ตรวจ/ซ่อมข้อมูลที่อ่านจาก storage (อาจเป็นข้อมูลเก่าหรือเสีย) */
  sanitize: (raw: unknown) => T,
): Store<T> {
  let value: T = sanitize(readStorage(key) ?? initial);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return;
      value = sanitize(readStorage(key) ?? initial);
      emit();
    });
  }

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      writeStorage(key, value);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      value = initial;
      writeStorage(key, value);
      emit();
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
