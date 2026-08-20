import { western } from '../coords.ts';
import type { Locale } from '../locale.ts';
import type { Color, GameResult } from '../types.ts';

const SIDE: Record<Color, string> = { B: 'Black', W: 'White' };

const opposite = (color: Color): Color => (color === 'B' ? 'W' : 'B');

const formatNumber = new Intl.NumberFormat('en');

const stones = (count: number): string =>
  `${formatNumber.format(count)} ${count === 1 ? 'stone' : 'stones'}`;

const points = (count: number): string =>
  `${formatNumber.format(count)} ${count === 1 ? 'point' : 'points'}`;

export const en: Locale = {
  id: 'en',
  coordinates: western,

  labels: {
    boardSize: 'Board size',
    event: 'Event',
    place: 'Place',
    date: 'Date',
    komi: 'Komi',
    handicap: 'Handicap',
    result: 'Result',
  },

  boardSize: (size) => `${size}×${size}`,

  number: (value) => formatNumber.format(value),

  players: (black, white) => {
    const parts: string[] = [];
    if (black !== undefined) {
      parts.push(`black ${black}`);
    }
    if (white !== undefined) {
      parts.push(`white ${white}`);
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
      return 'a draw';
    }
    if (result.kind === 'void') {
      return 'the game was voided';
    }
    if (result.kind === 'unknown') {
      return 'unknown';
    }

    const winner = SIDE[result.winner];
    const loser = SIDE[opposite(result.winner)].toLowerCase();

    if (result.kind === 'resignation') {
      return `${winner} wins by resignation, ${loser} resigned`;
    }
    if (result.kind === 'time') {
      return `${winner} wins on time`;
    }
    if (result.kind === 'forfeit') {
      return `${winner} wins by forfeit`;
    }

    return `${winner} wins by ${points(result.points)}`;
  },

  move: (n, color, coordinate, captured, capturedFrom) => {
    const line = `${n}. ${SIDE[color]} ${coordinate}`;
    if (captured.length === 0) {
      return line;
    }

    const side = SIDE[capturedFrom].toLowerCase();
    return `${line} — ${stones(captured.length)} of ${side} captured: ${captured.join(', ')}`;
  },

  pass: (n, color) => `${n}. ${SIDE[color]} passes`,
};
