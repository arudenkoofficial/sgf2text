import type { Locale } from './locale.ts';
import type { Color, GameEvent, GameRecord, ProblemRecord, Vertex } from './types.ts';

const opposite = (color: Color): Color => (color === 'B' ? 'W' : 'B');

/**
 * One event as one line, or nothing at all for a setup, which is stated once
 * elsewhere rather than repeated wherever it appears.
 *
 * Shared by both renderers, so a move inside a problem's answer is worded
 * exactly as the same move inside a game — including the stones it captured.
 * That is not a resemblance to be checked afterwards: there is one sentence and
 * both paths ask for it.
 */
const speak = (
  event: GameEvent,
  locale: Locale,
  format: (vertex: Vertex) => string,
): string[] => {
  if (event.kind === 'setup') {
    return [];
  }
  if (event.kind === 'pass') {
    return [locale.pass(event.n, event.color)];
  }

  return [
    locale.move(
      event.n,
      event.color,
      format(event.at),
      event.captures.map(format),
      opposite(event.color),
    ),
  ];
};

/**
 * Renders a game record as text: a metadata block, a blank line, then one line
 * per event. Every line stands on its own so a screen reader user can move
 * through the game line by line.
 *
 * Metadata the file does not carry is left out entirely — an empty label is
 * noise when it is read aloud.
 */
export const render = (record: GameRecord, locale: Locale): string => {
  const { labels } = locale;
  const format = (vertex: Vertex): string => locale.coordinates.format(vertex, record.size);

  const header: string[] = [`${labels.boardSize}: ${locale.boardSize(record.size)}`];

  const addMeta = (label: string, value: string | number | undefined): void => {
    if (value === undefined || value === '') {
      return;
    }

    header.push(`${label}: ${value}`);
  };

  addMeta(labels.event, record.meta.event);
  addMeta(labels.place, record.meta.place);
  addMeta(labels.date, record.meta.date);

  const players = locale.players(record.meta.blackPlayer, record.meta.whitePlayer);
  if (players !== undefined) {
    header.push(players);
  }

  addMeta(
    labels.komi,
    record.meta.komi === undefined ? undefined : locale.number(record.meta.komi),
  );

  const setup = record.events.find((event) => event.kind === 'setup');
  const handicapStones = setup?.stones.map((stone) => format(stone.at)) ?? [];
  const handicapCount = record.meta.handicap ?? handicapStones.length;
  if (handicapCount > 0) {
    addMeta(labels.handicap, locale.handicap(handicapCount, handicapStones));
  }

  if (record.meta.result !== undefined) {
    addMeta(labels.result, locale.result(record.meta.result));
  }

  const body = record.events.flatMap((event) => speak(event, locale, format));

  return [...header, '', ...body].join('\n');
};

/**
 * Renders a problem: a statement block, then the answer under a heading of its
 * own. Neither block is separated from the other by a rule drawn in punctuation
 * — a screen reader speaks a row of dashes as a row of dashes — and the heading
 * does the work instead, which is also what lets a player stop before the answer.
 *
 * The answer is a flat list of complete lines rather than a tree. On screen the
 * tree is plainly better, shared prefixes written once; read aloud it cannot be
 * followed at all. Indentation does not survive speech, so following a nested
 * branch would mean holding a position in a tree from memory while moving stones
 * with both hands. The cost is repetition, and it was the form blind readers
 * preferred when shown both.
 */
export const renderProblem = (problem: ProblemRecord, locale: Locale): string => {
  const { labels } = locale;
  const format = (vertex: Vertex): string => locale.coordinates.format(vertex, problem.size);

  const statement: string[] = [
    `${labels.boardSize}: ${locale.boardSize(problem.size)}`,
    locale.problem(problem.toPlay),
  ];

  // The side to move first: a player hears her own stones before the opponent's.
  for (const color of [problem.toPlay, opposite(problem.toPlay)]) {
    const placements = problem.setup
      .filter((stone) => stone.color === color)
      .map((stone) => format(stone.at));

    if (placements.length > 0) {
      statement.push(locale.setup(color, placements));
    }
  }

  if (problem.note !== undefined) {
    statement.push(`${labels.note}: ${problem.note}`);
  }

  const solution = problem.lines.flatMap((line) => [
    '',
    locale.line(line.n, line.correct),
    ...line.events.flatMap((event) => speak(event, locale, format)),
  ]);

  // Beside the heading rather than at the end: the heading is what a reader uses
  // to decide whether to hear the answer at all, and what is missing from it is
  // part of that decision.
  const heading = [
    locale.solution(problem.lines.length),
    ...(problem.unreadable > 0 ? [locale.unreadableLines(problem.unreadable)] : []),
  ];

  return [...statement, '', ...heading, ...solution].join('\n');
};
