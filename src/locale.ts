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
    /** The label a problem's statement is carried under. */
    note: string;
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

  /** Says the file is a problem rather than a game, and whose move it is. */
  problem(toPlay: Color): string;

  /**
   * One colour's setup stones. Two lines rather than one: the colours are what a
   * reader places by hand, and a run of coordinates that does not say which is
   * which cannot be placed at all.
   */
  setup(color: Color, stones: string[]): string;

  /**
   * Stones that appear on the board part-way through, placed rather than played.
   * SGF allows it and files use it — a position resumed from a diagram, a stone
   * added to illustrate a point.
   *
   * It has to be said where it happens, and that is the whole reason this exists
   * separately from `setup`. The stones reach the board either way, because the
   * rules are applied to them and the captures around them are found; a reader
   * who is not told they appeared is left with a board that no longer matches the
   * text, which is the one failure this converter exists to prevent.
   *
   * Worded after a capture on purpose — placed and captured are the two things
   * that happen to stones without anybody playing a move, and a listener who has
   * learnt one sentence should recognise the other.
   */
  placed(color: Color, stones: string[]): string;

  /**
   * The heading that opens the answer. It states how much of it there is, and it
   * is also what lets a listener stop before hearing the solution — so it has to
   * arrive before any of it.
   */
  solution(lines: number): string;

  /**
   * Said when part of the answer could not be read, and only then. A reader who
   * is told nothing assumes she heard the whole solution and goes looking for the
   * refutation that is not there — so the shortfall is stated rather than left to
   * be inferred from a number she has nothing to check against.
   */
  unreadableLines(count: number): string;

  /**
   * The heading of one line of the answer. `correct` is what the file said, and
   * its absence is not a verdict: SGF has no way of marking a branch as failing,
   * so an unmarked line is numbered and nothing more.
   */
  line(n: number, correct: boolean): string;
};
