import { western } from '../coords.ts';
import type { Locale } from '../locale.ts';
import type { Color, GameResult } from '../types.ts';

const SIDE: Record<Color, string> = { B: 'Чёрные', W: 'Белые' };
const SIDE_GENITIVE: Record<Color, string> = { B: 'чёрных', W: 'белых' };

const opposite = (color: Color): Color => (color === 'B' ? 'W' : 'B');

// Russian needs three plural forms, and the rule is not "1 versus the rest".
// Intl.PluralRules knows the rule; hand-written conditions here get 21, 104
// and fractional margins wrong.
const plural = new Intl.PluralRules('ru');

const inflect = (count: number, forms: { one: string; few: string; many: string }): string => {
  const category = plural.select(count);
  if (category === 'one') {
    return forms.one;
  }
  if (category === 'few') {
    return forms.few;
  }
  if (category === 'many') {
    return forms.many;
  }

  return forms.few;
};

const stones = (count: number): string =>
  `${count} ${inflect(count, { one: 'камень', few: 'камня', many: 'камней' })}`;

const points = (count: number): string =>
  `${count} ${inflect(count, { one: 'очко', few: 'очка', many: 'очков' })}`;

export const ru: Locale = {
  id: 'ru',
  coordinates: western,

  labels: {
    boardSize: 'Размер доски',
    event: 'Турнир',
    place: 'Место',
    date: 'Дата',
    komi: 'Коми',
    handicap: 'Фора',
    result: 'Результат',
  },

  boardSize: (size) => `${size}×${size}`,

  players: (black, white) => {
    const parts: string[] = [];
    if (black !== undefined) {
      parts.push(`чёрные ${black}`);
    }
    if (white !== undefined) {
      parts.push(`белые ${white}`);
    }
    if (parts.length === 0) {
      return undefined;
    }

    const line = parts.join(', ');
    return line.charAt(0).toUpperCase() + line.slice(1);
  },

  handicap: (count, placements) => {
    if (placements.length === 0) {
      return stones(count);
    }

    return `${stones(count)} — ${placements.join(', ')}`;
  },

  result: (result: GameResult) => {
    if (result.kind === 'draw') {
      return 'ничья';
    }
    if (result.kind === 'void') {
      return 'партия аннулирована';
    }
    if (result.kind === 'unknown') {
      return 'неизвестен';
    }

    const winner = SIDE[result.winner].toLowerCase();
    const loser = SIDE[opposite(result.winner)].toLowerCase();

    if (result.kind === 'resignation') {
      return `${winner} выиграли, ${loser} сдались`;
    }
    if (result.kind === 'time') {
      return `${winner} выиграли по времени`;
    }
    if (result.kind === 'forfeit') {
      return `${winner} выиграли, ${loser} дисквалифицированы`;
    }

    return `${winner} выиграли ${points(result.points)}`;
  },

  move: (n, color, coordinate, captured, capturedFrom) => {
    const line = `${n}. ${SIDE[color]} ${coordinate}`;
    if (captured.length === 0) {
      return line;
    }

    return `${line} — снято ${stones(captured.length)} ${SIDE_GENITIVE[capturedFrom]}: ${captured.join(', ')}`;
  },

  pass: (n, color) => `${n}. ${SIDE[color]} пас`,
};
