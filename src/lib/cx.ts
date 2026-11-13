/** รวม className โดยข้ามค่าที่เป็น false/undefined */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
