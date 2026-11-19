import { k, lesson, segment } from '../build';

/** ช่วง 3: คนและร่างกาย */
export const PEOPLE = segment('people', 'ひと', 'คนและร่างกาย', [
  lesson('k-people', '人子女', 'คนและครอบครัว', [
    k('人', 2, 'คน', [
      ['ひと', 'kun', ['hito']],
      ['じん', 'on', ['gaikokujin']],
    ], {
      special: ['hitori', 'futari', 'otona'],
      note: 'คนชาติ… ใช้ ประเทศ + じん เช่น タイじん = คนไทย · นับคน 3 คนขึ้นไปใช้ にん เช่น さんにん',
    }),
    k('子', 3, 'เด็ก / ลูก', [
      ['こ', 'kun', ['kodomo', 'otokonoko', 'onnanoko']],
      ['し', 'on', ['okashi', 'boushi']],
    ]),
    k('女', 3, 'ผู้หญิง', [['おんな', 'kun', ['onna', 'onnanoko']]]),
    k('男', 7, 'ผู้ชาย', [['おとこ', 'kun', ['otoko', 'otokonoko']]], { note: 'ประกอบจาก 田 (นา) + 力 (แรง)' }),
    k('父', 4, 'พ่อ', [], { special: ['otousan'], note: 'พ่อของเราเอง (เวลาเล่าให้คนอื่นฟัง) อ่าน ちち' }),
    k('母', 5, 'แม่', [], { special: ['okaasan'], note: 'แม่ของเราเอง (เวลาเล่าให้คนอื่นฟัง) อ่าน はは' }),
  ]),
  lesson('k-body', '口目手', 'เพื่อน ชื่อ และร่างกาย', [
    k('友', 4, 'เพื่อน', [['とも', 'kun', ['tomodachi']]]),
    k('名', 6, 'ชื่อ', [
      ['な', 'kun', ['namae']],
      ['めい', 'on', ['yuumei']],
    ]),
    k('口', 3, 'ปาก / ทางเข้าออก', [['くち・ぐち', 'kun', ['kuchi', 'iriguchi', 'deguchi']]]),
    k('目', 5, 'ตา', [['め', 'kun', ['me']]]),
    k('耳', 6, 'หู', [['みみ', 'kun', ['mimi']]]),
    k('手', 4, 'มือ', [['て', 'kun', ['te', 'tegami', 'kitte']]], { special: ['jouzu', 'heta'] }),
    k('足', 7, 'เท้า / ขา', [['あし', 'kun', ['ashi']]]),
  ]),
]);
