/** ตัวสุ่ม (ส่งตัวสุ่มแบบกำหนด seed ได้ในเทส) */
export type Rng = () => number;

/** สลับลำดับแบบ Fisher–Yates (คืนอาร์เรย์ใหม่) */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
