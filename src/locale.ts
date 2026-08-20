import type { Color, CoordinateSystem, GameResult } from './types.ts';

export type LocaleId = 'ru' | 'en';

/**
 * Everything language-specific lives behind this interface, so the renderer
 * itself contains no words. A locale also carries its coordinate system:
 * notation is a function of the reader's convention, not only of vocabulary.
 */
export type Locale = {
  id: LocaleId;
  coordinates: CoordinateSystem;

  /** Labels for the metadata block, in the order they should be printed. */
  labels: {
    boardSize: string;
    event: string;
    place: string;
    date: string;
    komi: string;
    handicap: string;
    result: string;
  };

  boardSize(size: number): string;

  /**
   * A number in this language's own convention. Komi read aloud as "6.5" by a
   * Russian voice comes out as "six point five"; "6,5" is read as the number.
   */
  number(value: number): string;

  /**
   * Both players on one line. Two separate lines would double the listening
   * time for what is a single fact: who played which colour.
   */
  players(black: string | undefined, white: string | undefined): string | undefined;
  handicap(count: number, stones: string[]): string;
  result(result: GameResult): string;

  move(n: number, color: Color, coordinate: string, captured: string[], capturedFrom: Color): string;
  pass(n: number, color: Color): string;
};
