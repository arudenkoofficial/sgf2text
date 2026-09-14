# sgf2text

Converts an SGF Go game record or problem into plain text that a screen reader
can read out.

A saved game is useless to a blind player: SGF is a dense machine format, and a
screen reader pronounces it as noise. This turns it into a numbered move list.
For every capturing move it names the stones you lift off the board, so the game
can be replayed on a tactile board.

```
Board size: 9×9
Black Alice, white Bob
Result: Black wins by resignation, white resigned

1. Black B9
2. White A9
3. Black A7
4. White A8
5. Black B8 — 2 stones of white captured: A9, A8
```

## Installation

```sh
npm install sgf2text
```

The package is ESM only, requires Node 24 or newer, and carries its own type
declarations.

It works in the browser as well. A bundler building for the browser picks a build
of its own through the `browser` condition of `exports`, as esbuild, Vite and
webpack do by default. That build stubs the Node modules the SGF parser requires
but never uses on a string, so there is nothing to configure, and it carries the
MIT notices of the parser and board libraries it inlines.

## Usage

```js
import { sgfToText, sgfToRecord, sgfToDocument } from 'sgf2text';

sgfToText(sgf);                   // text in Russian, the default
sgfToText(sgf, { locale: 'en' }); // text in English
sgfToRecord(sgf);                 // the game as data, no strings
sgfToDocument(sgf);               // { kind: 'game' | 'problem', … }, also no strings
```

`sgfToRecord` returns the parsed game with no language in it: moves, passes,
setup stones and the vertices each move captured.

`sgfToDocument` reads the file as whichever of the two genres it turns out to be,
returning a `GameRecord` or a `ProblemRecord` under a `kind`. `documentToText`
renders a document already read, so a caller that needs both the text and what the
file was does not parse it twice.

Languages: `ru` (default), `en`.

Try it without installing at <https://sgf.rudenko.live/>.

## License

MIT
