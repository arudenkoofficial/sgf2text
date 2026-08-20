import type { Locale } from './locale.ts';
import type { Color, GameRecord, Vertex } from './types.ts';

const opposite = (color: Color): Color => (color === 'B' ? 'W' : 'B');

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

  addMeta(labels.komi, record.meta.komi);

  const setup = record.events.find((event) => event.kind === 'setup');
  const handicapStones = setup?.stones.map((stone) => format(stone.at)) ?? [];
  const handicapCount = record.meta.handicap ?? handicapStones.length;
  if (handicapCount > 0) {
    addMeta(labels.handicap, locale.handicap(handicapCount, handicapStones));
  }

  if (record.meta.result !== undefined) {
    addMeta(labels.result, locale.result(record.meta.result));
  }

  const body = record.events.flatMap((event) => {
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
  });

  return [...header, '', ...body].join('\n');
};
