import { k, lesson, segment } from '../build';

/** ช่วง 2: วันและเวลา */
export const TIME = segment('time', 'ひ・とき', 'วันและเวลา', [
  lesson('k-days', '月火水', 'วันในสัปดาห์', [
    k('日', 4, 'วัน / ดวงอาทิตย์', [
      ['にち', 'on', ['mainichi', 'ichinichi', 'nichiyoubi']],
      ['ひ・び', 'kun', ['getsuyoubi', 'tanjoubi']],
      ['か', 'kun', ['mikka', 'youka', 'tooka']],
    ], {
      special: ['kyou', 'kinou', 'ashita', 'tsuitachi', 'futsuka'],
      note: 'ใช้บอกวันที่และวันในสัปดาห์ · หลายคำอ่านพิเศษทั้งคำ ต้องจำเป็นคำ',
    }),
    k('月', 4, 'เดือน / ดวงจันทร์', [
      ['げつ', 'on', ['getsuyoubi', 'kongetsu', 'raigetsu']],
      ['つき', 'kun', ['hitotsuki', 'maitsuki']],
    ], { note: 'ชื่อเดือนอ่าน がつ เช่น いちがつ = มกราคม' }),
    k('火', 4, 'ไฟ', [['か', 'on', ['kayoubi']]], { note: 'คำว่า "ไฟ" อ่าน ひ (คุง)' }),
    k('水', 4, 'น้ำ', [
      ['みず', 'kun', ['mizu']],
      ['すい', 'on', ['suiyoubi']],
    ]),
    k('木', 4, 'ต้นไม้ / ไม้', [
      ['き', 'kun', ['ki-tree']],
      ['もく', 'on', ['mokuyoubi']],
    ]),
    k('金', 8, 'ทอง / เงินตรา', [
      ['きん', 'on', ['kinyoubi']],
      ['かね', 'kun', ['okane']],
    ]),
    k('土', 3, 'ดิน', [['ど', 'on', ['doyoubi']]], { note: 'คำว่า "ดิน" อ่าน つち (คุง)' }),
  ]),
  lesson('k-time-1', '年時分', 'ปี เวลา นาที', [
    k('年', 6, 'ปี', [
      ['ねん', 'on', ['kyonen', 'rainen', 'sarainen']],
      ['とし', 'kun', ['toshi', 'maitoshi']],
    ], { special: ['kotoshi', 'ototoshi'] }),
    k('時', 10, 'เวลา / ชั่วโมง', [
      ['じ', 'on', ['jikan']],
      ['とき・どき', 'kun', ['tokidoki']],
    ], { special: ['tokei'], note: 'บอกเวลาใช้ ตัวเลข + じ เช่น さんじ = 3 นาฬิกา' }),
    k('分', 4, 'ส่วน / นาที', [
      ['ぶん', 'on', ['hanbun', 'jibun', 'tabun']],
      ['わ', 'kun', ['wakaru']],
    ], { note: 'นับนาทีอ่าน ふん / ぷん เช่น ごふん = 5 นาที · じゅっぷん = 10 นาที' }),
    k('半', 5, 'ครึ่ง', [['はん', 'on', ['han', 'hanbun']]]),
    k('午', 4, 'เที่ยงวัน', [['ご', 'on', ['gozen', 'gogo']]]),
    k('今', 4, 'ตอนนี้ / ปัจจุบัน', [
      ['いま', 'kun', ['ima']],
      ['こん', 'on', ['konban', 'konshuu', 'kongetsu']],
    ], { special: ['kyou', 'kesa', 'kotoshi'] }),
  ]),
  lesson('k-time-2', '前後', 'ก่อน หลัง ทุก', [
    k('前', 9, 'ข้างหน้า / ก่อน', [
      ['まえ', 'kun', ['mae', 'namae']],
      ['ぜん', 'on', ['gozen']],
    ]),
    k('後', 9, 'ข้างหลัง / ทีหลัง', [
      ['ご', 'on', ['gogo']],
      ['あと', 'kun', ['ato']],
      ['うし(ろ)', 'kun', ['ushiro']],
    ], { special: ['asatte'] }),
    k('毎', 6, 'ทุกๆ', [['まい', 'on', ['mainichi', 'maiasa', 'maishuu']]]),
    k('週', 11, 'สัปดาห์', [['しゅう', 'on', ['konshuu', 'senshuu', 'raishuu']]]),
    k('間', 12, 'ช่วงเวลา / ระหว่าง', [['かん', 'on', ['jikan']]], { note: 'คำว่า "ระหว่าง" อ่าน あいだ (คุง)' }),
    k('先', 6, 'ก่อน / ข้างหน้า', [
      ['せん', 'on', ['sensei', 'senshuu', 'sengetsu']],
      ['さき', 'kun', ['saki']],
    ]),
  ]),
]);
