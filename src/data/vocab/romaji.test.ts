import { describe, expect, it } from 'vitest';
import { kanaToRomaji } from './romaji';

describe('kanaToRomaji', () => {
  it.each([
    ['みず', 'mizu'],
    ['おとうさん', 'otousan'],
    ['せんせい', 'sensei'],
    ['しゃしん', 'shashin'],
    ['きゅう', 'kyuu'],
    ['じどうしゃ', 'jidousha'],
    ['ちょっと', 'chotto'],
    ['いっしょ', 'issho'],
    ['マッチ', 'matchi'],
    ['がっこう', 'gakkou'],
    ['コーヒー', 'koohii'],
    ['シャワー', 'shawaa'],
    ['パーティー', 'paatii'],
    ['フィルム', 'firumu'],
    ['きんようび', "kin'youbi"],
    ['でんわ', 'denwa'],
    ['こんばん', 'konban'],
    ['ふつか', 'futsuka'],
    ['ぢ', 'ji'],
  ])('%s → %s', (kana, romaji) => {
    expect(kanaToRomaji(kana)).toBe(romaji);
  });

  it('refuses characters it cannot read, so typos in the data fail loudly', () => {
    expect(() => kanaToRomaji('みずA')).toThrow();
    expect(() => kanaToRomaji('ーあ')).toThrow();
    expect(() => kanaToRomaji('あっ')).toThrow();
  });
});
