import type { Locale } from './locale.ts';
import { settle } from './position.ts';
import type { Color, GameEvent, GameRecord, ProblemRecord, SetupStone, Vertex } from './types.ts';

const opposite = (color: Color): Color => (color === 'B' ? 'W' : 'B');

/**
 * One sentence per colour, and none for a colour with nothing to say.
 *
 * Split by colour rather than listed together because the colours are what a
 * reader places and removes by hand: a run of coordinates that does not say which
 * is which cannot be acted on at all.
 */
const byColour = (
  stones: readonly SetupStone[],
  format: (vertex: Vertex) => string,
  say: (color: Color, coordinates: string[]) => string,
): string[] =>
  (['B', 'W'] as const).flatMap((color) => {
    const coordinates = stones
      .filter((stone) => stone.color === color)
      .map((stone) => format(stone.at));

    return coordinates.length > 0 ? [say(color, coordinates)] : [];
  });

/**
 * One event as one line — or two, when stones of both colours appear at once.
 *
 * Shared by both renderers, so a move inside a problem's answer is worded
 * exactly as the same move inside a game — including the stones it captured.
 * That is not a resemblance to be checked afterwards: there is one sentence and
 * both paths ask for it.
 *
 * A setup reaching here is one that happens during play. The position a game or
 * a problem opens with is stated by its own block above and is filtered out
 * before this is called; what is left is stones appearing part-way through, and
 * saying nothing about those is what leaves a reader's board behind the text.
 */
const speak = (
  event: GameEvent,
  locale: Locale,
  format: (vertex: Vertex) => string,
): string[] => {
  if (event.kind === 'setup') {
    // Placed before taken off, which is the order they happen in and the order she
    // works in: a point may be filled and emptied by the same node.
    return [
      ...byColour(event.stones, format, locale.placed),
      ...byColour(event.cleared, format, locale.removed),
    ];
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

  // Where the game starts. Everything before it states the position the players
  // sat down to; everything after it is something that happens during the game,
  // and the two cannot share a sentence.
  const start = record.events.findIndex((event) => event.kind !== 'setup');
  const opened = record.events.slice(0, start === -1 ? record.events.length : start);
  // What the edits settle to, not every stone they name. A file that puts a stone
  // down and takes it off again before anybody moves describes a board without
  // one, and that is what a reader is asked to build.
  const position = settle(
    opened
      .filter((event) => event.kind === 'setup')
      .map((event) => ({ stones: event.stones, cleared: event.cleared.map((stone) => stone.at) })),
  );

  /**
   * A handicap is black stones, placed before anybody moves. Both halves matter,
   * and neither used to be checked: the first setup event anywhere in the file
   * was announced under this label whatever colour it was and wherever it sat, so
   * a game resumed from a diagram opened with white stones called a handicap.
   */
  const isHandicap = position.length > 0 && position.every((stone) => stone.color === 'B');
  const handicapCount = record.meta.handicap ?? (isHandicap ? position.length : 0);

  if (handicapCount > 0) {
    addMeta(
      labels.handicap,
      locale.handicap(
        handicapCount,
        position.filter((stone) => stone.color === 'B').map((stone) => format(stone.at)),
      ),
    );
  } else if (position.length > 0) {
    // Not a handicap, so it is a position — and a position is stated the way a
    // problem states one, by colour. The first player is named first, as there.
    const first = record.events.find((event) => event.kind !== 'setup')?.color ?? 'B';
    for (const color of [first, opposite(first)]) {
      const placements = position
        .filter((stone) => stone.color === color)
        .map((stone) => format(stone.at));

      if (placements.length > 0) {
        header.push(locale.setup(color, placements));
      }
    }
  }

  if (record.meta.result !== undefined) {
    addMeta(labels.result, locale.result(record.meta.result));
  }

  // Setup before the first move belongs to the header above; setup after it is an
  // event, and `speak` says it where it happens rather than dropping it. Dropping
  // it is what the old code did everywhere except the one line it mislabelled,
  // which left the reader's board holding fewer stones than the rules were being
  // applied to.
  const body = record.events.flatMap((event, index) =>
    index < opened.length ? [] : speak(event, locale, format),
  );

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
