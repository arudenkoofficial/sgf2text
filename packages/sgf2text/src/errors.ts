/** What went wrong, in a form a caller can translate. */
export type SgfErrorCode =
  | 'empty-input'
  | 'not-sgf'
  | 'rectangular-board'
  | 'unreadable-size'
  /**
   * A square board the notation cannot name. Distinct from `unreadable-size`,
   * which is a size that could not be read at all: this one was read perfectly
   * well and is simply larger than the column letters go.
   */
  | 'unsupported-size'
  | 'unreadable-move'
  | 'unknown-locale';

/**
 * An error carrying a code alongside its message.
 *
 * The message is English and meant for developers and the CLI. A user
 * interface must not show it: this tool is read aloud, and an English sentence
 * spliced into Russian speech is close to unintelligible through a screen
 * reader. Interfaces switch on `code` and supply their own wording.
 */
export class SgfError extends Error {
  code: SgfErrorCode;

  constructor(code: SgfErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SgfError';
    this.code = code;
  }
}

export const isSgfError = (error: unknown): error is SgfError => error instanceof SgfError;
