export interface Point {
  x: number;
  y: number;
}

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export function polylineLength(pts: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1]!, pts[i]!);
  return total;
}

/**
 * สุ่มจุดใหม่ n จุดให้ห่างกันเท่าๆ กันตามความยาวเส้น
 * (ทำให้เทียบเส้นสองเส้นแบบจุดต่อจุดได้ แม้จะเขียนเร็ว/ช้าไม่เท่ากัน)
 */
export function resample(pts: readonly Point[], n: number): Point[] {
  if (pts.length === 0) return [];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (n < 2) return [{ ...first }];
  const total = polylineLength(pts);
  if (total === 0) return Array.from({ length: n }, () => ({ ...first }));

  const step = total / (n - 1);
  const out: Point[] = [{ ...first }];
  let walked = 0;
  let target = step;
  for (let i = 1; i < pts.length && out.length < n - 1; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = dist(a, b);
    while (seg > 0 && walked + seg >= target && out.length < n - 1) {
      const t = (target - walked) / seg;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      target += step;
    }
    walked += seg;
  }
  while (out.length < n - 1) out.push({ ...last });
  out.push({ ...last });
  return out;
}

export function centroid(pts: readonly Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function boundingBox(pts: Iterable<Point>): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (minX === Infinity) minX = minY = maxX = maxY = 0;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function translate(pts: readonly Point[], dx: number, dy: number): Point[] {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * เกลี่ยเส้นให้เรียบด้วยค่าเฉลี่ยจุดใกล้เคียง (คงจุดต้นและจุดปลายไว้)
 * — ตัดอาการมือสั่นถี่ๆ ที่ทำให้ขีดสั้น (เช่นจุดในคันจิ) ดูยาวและเบี้ยวกว่าจริง
 */
export function smooth(pts: readonly Point[], radius = 2): Point[] {
  if (pts.length < radius * 2 + 1) return [...pts];
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p;
    const r = Math.min(radius, i, pts.length - 1 - i);
    let x = 0;
    let y = 0;
    for (let k = i - r; k <= i + r; k++) {
      x += pts[k]!.x;
      y += pts[k]!.y;
    }
    return { x: x / (2 * r + 1), y: y / (2 * r + 1) };
  });
}

/** แปลง polyline เป็น SVG path `d` */
export function toPathData(pts: readonly Point[]): string {
  if (pts.length === 0) return '';
  const f = (n: number) => Math.round(n * 100) / 100;
  const [first, ...rest] = pts;
  if (rest.length === 0) return `M${f(first!.x)} ${f(first!.y)}l0 0`;
  return `M${f(first!.x)} ${f(first!.y)}` + rest.map((p) => `L${f(p.x)} ${f(p.y)}`).join('');
}
