import { describe, expect, it } from 'vitest';
import { GRAMMAR_N5 } from './grammar/n5';
import { KANJI_N5 } from './kanji/n5';
import { loadLineDecks } from './lineDecks';
import { LINE_LESSON_COUNT } from './lineMeta';
import { N5_DECK } from './vocab/n5';

describe('N5 line data loaded on demand', () => {
  it('loads the same decks the N5 pages import', async () => {
    const decks = await loadLineDecks();
    expect(decks.vocab).toBe(N5_DECK);
    expect(decks.kanji).toBe(KANJI_N5);
    expect(decks.grammar).toBe(GRAMMAR_N5);
  });

  it('keeps the lesson counts used by the home page in sync with the data', () => {
    for (const deck of [N5_DECK, KANJI_N5, GRAMMAR_N5]) {
      expect(LINE_LESSON_COUNT[deck.progressKey as keyof typeof LINE_LESSON_COUNT], deck.progressKey).toBe(
        deck.lessons.length,
      );
    }
  });
});
