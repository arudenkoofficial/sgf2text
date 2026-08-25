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

const formatNumber = new Intl.NumberFormat('ru');

const stones = (count: number): string =>
  `${formatNumber.format(count)} ${inflect(count, { one: 'камень', few: 'камня', many: 'камней' })}`;

const points = (count: number): string =>
  `${formatNumber.format(count)} ${inflect(count, { one: 'очко', few: 'очка', many: 'очков' })}`;

const variations = (count: number): string =>
  `${formatNumber.format(count)} ${inflect(count, { one: 'вариант', few: 'варианта', many: 'вариантов' })}`;

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
    note: 'Примечание',
  },

  boardSize: (size) => `${size}×${size}`,

  number: (value) => formatNumber.format(value),

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

  problem: (toPlay) => `Задача. Ход ${SIDE_GENITIVE[toPlay]}.`,

  setup: (color, placements) => `${SIDE[color]}: ${stones(placements.length)} — ${placements.join(', ')}`,

  // «Поставлено» — как «снято» в записи хода: безличная форма согласуется с любым
  // числом, и слушателю не приходится учить вторую конструкцию.
  placed: (color, placements) =>
    `Поставлено ${stones(placements.length)} ${SIDE_GENITIVE[color]}: ${placements.join(', ')}`,

  // «Убрано», а не «снято»: «снято» занято взятием в записи хода, и спутать их
  // нельзя. Корни разные на слух — у-бра-но и сня-то — при том же безличном
  // обороте, что у «поставлено».
  removed: (color, placements) =>
    `Убрано с доски ${stones(placements.length)} ${SIDE_GENITIVE[color]}: ${placements.join(', ')}`,

  solution: (count) =>
    count === 0 ? 'Решения в файле нет.' : `Решение: ${variations(count)}.`,

  // «Там» уходит от согласования с числом: и «ещё 1 вариант», и «ещё 2 варианта»
  // продолжаются одним и тем же оборотом.
  unreadableLines: (count) =>
    `Ещё ${variations(count)} прочитать не удалось: там есть ход, который не получилось разобрать.`,

  line: (n, correct) => (correct ? `Вариант ${n} — правильный:` : `Вариант ${n}:`),
};
