import type { Point } from './geometry';

/**
 * แปลง SVG path `d` ให้เป็นเส้นตรงต่อกัน (polyline)
 * รองรับ M L H V C S Q T Z ทั้งแบบตัวใหญ่ (absolute) และตัวเล็ก (relative)
 * ส่วน A (arc) จะประมาณเป็นเส้นตรง — KanjiVG ไม่ใช้คำสั่งนี้
 */
const TOKEN = /([MmLlHhVvCcSsQqTtZzAa])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;

export function flattenPath(d: string, segmentsPerCurve = 12): Point[] {
  const tokens: (string | number)[] = [];
  for (const m of d.matchAll(TOKEN)) tokens.push(m[1] ?? Number(m[2]));

  const pts: Point[] = [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCubic: Point | null = null;
  let lastQuad: Point | null = null;

  const num = (): number => {
    const t = tokens[i++];
    if (typeof t !== 'number') throw new Error(`SVG path ไม่ถูกต้อง: "${d}"`);
    return t;
  };

  const cubic = (c1: Point, c2: Point, end: Point) => {
    const p0 = { x: cx, y: cy };
    for (let k = 1; k <= segmentsPerCurve; k++) {
      const t = k / segmentsPerCurve;
      const u = 1 - t;
      pts.push({
        x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
        y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
      });
    }
  };

  const quad = (c: Point, end: Point) => {
    const p0 = { x: cx, y: cy };
    for (let k = 1; k <= segmentsPerCurve; k++) {
      const t = k / segmentsPerCurve;
      const u = 1 - t;
      pts.push({
        x: u * u * p0.x + 2 * u * t * c.x + t * t * end.x,
        y: u * u * p0.y + 2 * u * t * c.y + t * t * end.y,
      });
    }
  };

  while (i < tokens.length) {
    const t = tokens[i];
    if (typeof t === 'string') {
      cmd = t;
      i++;
    } else if (!cmd) {
      throw new Error(`SVG path ต้องขึ้นต้นด้วยคำสั่ง: "${d}"`);
    }

    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    const upper = cmd.toUpperCase();
    let nextCubic: Point | null = null;
    let nextQuad: Point | null = null;

    switch (upper) {
      case 'M': {
        cx = num() + ox;
        cy = num() + oy;
        startX = cx;
        startY = cy;
        pts.push({ x: cx, y: cy });
        // พิกัดที่ตามหลัง M โดยไม่มีคำสั่งใหม่ ถือเป็น L
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L': {
        cx = num() + ox;
        cy = num() + oy;
        pts.push({ x: cx, y: cy });
        break;
      }
      case 'H': {
        cx = num() + ox;
        pts.push({ x: cx, y: cy });
        break;
      }
      case 'V': {
        cy = num() + oy;
        pts.push({ x: cx, y: cy });
        break;
      }
      case 'C': {
        const c1 = { x: num() + ox, y: num() + oy };
        const c2 = { x: num() + ox, y: num() + oy };
        const end = { x: num() + ox, y: num() + oy };
        cubic(c1, c2, end);
        cx = end.x;
        cy = end.y;
        nextCubic = c2;
        break;
      }
      case 'S': {
        const c1: Point = lastCubic ? { x: 2 * cx - lastCubic.x, y: 2 * cy - lastCubic.y } : { x: cx, y: cy };
        const c2 = { x: num() + ox, y: num() + oy };
        const end = { x: num() + ox, y: num() + oy };
        cubic(c1, c2, end);
        cx = end.x;
        cy = end.y;
        nextCubic = c2;
        break;
      }
      case 'Q': {
        const c = { x: num() + ox, y: num() + oy };
        const end = { x: num() + ox, y: num() + oy };
        quad(c, end);
        cx = end.x;
        cy = end.y;
        nextQuad = c;
        break;
      }
      case 'T': {
        const c: Point = lastQuad ? { x: 2 * cx - lastQuad.x, y: 2 * cy - lastQuad.y } : { x: cx, y: cy };
        const end = { x: num() + ox, y: num() + oy };
        quad(c, end);
        cx = end.x;
        cy = end.y;
        nextQuad = c;
        break;
      }
      case 'A': {
        i += 5; // rx ry rotation large-arc sweep
        cx = num() + ox;
        cy = num() + oy;
        pts.push({ x: cx, y: cy });
        break;
      }
      case 'Z': {
        cx = startX;
        cy = startY;
        pts.push({ x: cx, y: cy });
        cmd = ''; // Z ไม่มีพิกัดตาม ถ้ามีตัวเลขต่อจะถือว่า path ผิด
        break;
      }
      default:
        throw new Error(`ไม่รองรับคำสั่ง SVG "${cmd}"`);
    }
    lastCubic = nextCubic;
    lastQuad = nextQuad;
  }
  return pts;
}
