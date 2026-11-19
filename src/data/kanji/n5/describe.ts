import { k, lesson, segment } from '../build';

/** ช่วง 5: คำบอกลักษณะ */
export const DESCRIBE = segment('describe', 'ようす', 'คำบอกลักษณะ', [
  lesson('k-size', '大小高', 'ใหญ่ เล็ก สูง ถูก มาก น้อย', [
    k('大', 3, 'ใหญ่', [
      ['おお', 'kun', ['ookii', 'ookina', 'oozei']],
      ['たい・だい', 'on', ['taisetsu', 'daigaku', 'daisuki']],
    ], { special: ['otona'] }),
    k('小', 3, 'เล็ก', [['ちい', 'kun', ['chiisai', 'chiisana']]], { note: 'อ่าน しょう (อง) ได้ด้วย' }),
    k('高', 10, 'สูง / แพง', [['たか', 'kun', ['takai']]]),
    k('安', 6, 'ถูก (ราคา) / สบายใจ', [['やす', 'kun', ['yasui']]]),
    k('多', 6, 'มาก', [
      ['おお', 'kun', ['ooi']],
      ['た', 'on', ['tabun']],
    ]),
    k('少', 4, 'น้อย', [
      ['すく', 'kun', ['sukunai']],
      ['すこ', 'kun', ['sukoshi']],
    ]),
  ]),
  lesson('k-new-old', '新古長', 'ใหม่ เก่า ยาว ขาว', [
    k('新', 13, 'ใหม่', [
      ['あたら', 'kun', ['atarashii']],
      ['しん', 'on', ['shinbun']],
    ]),
    k('古', 5, 'เก่า', [['ふる', 'kun', ['furui']]]),
    k('長', 8, 'ยาว / หัวหน้า', [['なが', 'kun', ['nagai']]]),
    k('白', 5, 'ขาว', [['しろ', 'kun', ['shiro', 'shiroi', 'omoshiroi']]]),
  ]),
]);
