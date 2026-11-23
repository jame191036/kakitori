import { lesson, p, segment } from './build';

/** ช่วง 10: ป้ายที่เห็นบ่อย — อ่านให้ออก (ป้ายเขียนด้วยคันจิ ไม่มีคำอ่าน) */
export const HYOUJI = segment('hyouji', 'ひょうじ', 'ป้ายที่เห็นบ่อย', [
  lesson('eki-hyouji', 'えきの ひょうじ', 'ป้ายในสถานีและบนถนน', [
    p('s-deguchi', '{出口|でぐち}', 'ทางออก', { sign: true, avoid: ['s-hijouguchi'] }),
    p('s-iriguchi', '{入口|いりぐち}', 'ทางเข้า', { sign: true, note: 'บางที่เขียน 入り口' }),
    p('s-kaisatsu', '{改札|かいさつ}', 'ประตูตรวจตั๋ว', { sign: true, note: 'แตะบัตร IC หรือสอดตั๋วตรงนี้' }),
    p('s-kippu-uriba', '{切符|きっぷ}/{売|う}り{場|ば}', 'ที่ขายตั๋ว', { sign: true }),
    p('s-norikae', '{乗|の}り{換|か}え', 'ทางเปลี่ยนสาย (ไปขึ้นรถไฟสายอื่น)', { sign: true }),
    p('s-hijouguchi', '{非常口|ひじょうぐち}', 'ทางออกฉุกเฉิน', { sign: true }),
    p('s-tomare', '{止|と}まれ', 'หยุด (ป้ายจราจร)', { sign: true }),
    p('s-kiken', '{危険|きけん}', 'อันตราย', { sign: true }),
  ]),
  lesson('mise-hyouji', 'みせの ひょうじ', 'ป้ายในร้านและห้องน้ำ', [
    p('s-eigyouchuu', '{営業中|えいぎょうちゅう}', 'เปิดอยู่ (ร้าน)', { sign: true }),
    p('s-junbichuu', '{準備中|じゅんびちゅう}', 'ยังไม่เปิด (กำลังเตรียมร้าน)', { sign: true }),
    p('s-otearai', 'お{手洗|てあら}い', 'ห้องน้ำ', { sign: true, avoid: ['s-otoko', 's-onna'] }),
    p('s-otoko', '{男|おとこ}', 'ชาย (ห้องน้ำชาย)', { sign: true }),
    p('s-onna', '{女|おんな}', 'หญิง (ห้องน้ำหญิง)', { sign: true }),
    p('s-kinen', '{禁煙|きんえん}', 'ห้ามสูบบุหรี่', { sign: true }),
    p('s-osu', '{押|おす}', 'ผลัก (ประตู)', { sign: true, note: 'ป้ายบนประตูเขียนแค่ 押 (อ่าน おす) · คู่กับ 引 (ひく = ดึง)' }),
    p('s-hiku', '{引|ひく}', 'ดึง (ประตู)', { sign: true }),
  ]),
]);
