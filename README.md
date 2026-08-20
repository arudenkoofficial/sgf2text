# sgf2text

Converts an SGF Go game record into plain text that a screen reader can read out.

A saved game is useless to a blind player: SGF is a dense machine format, and a
screen reader pronounces it as noise. This turns it into a numbered move list —
including, for every capturing move, the stones that have to be taken off the
board, which is what makes a game replayable on a tactile board.

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

Coordinates are `A`–`T` without `I`, rows counted from the bottom — the notation
used by Go servers, so a game sounds the same in review as it does in live play.

## Usage

### Command line

```sh
node cli.ts game.sgf                  # convert a file
node cli.ts --lang en game.sgf        # choose the language
cat game.sgf | node cli.ts            # or read from standard input
node cli.ts --help
```

Errors go to standard error and nothing partial is written to standard output,
so redirecting into a file always leaves either a whole game or nothing.

### Library

```js
import { sgfToText, sgfToRecord } from 'sgf2text';

sgfToText(sgf);                  // text in Russian, the default
sgfToText(sgf, { locale: 'en' }); // text in English
sgfToRecord(sgf);                // the game as data, no strings
```

`sgfToRecord` returns the parsed game — moves, passes, setup stones and the
vertices each move captured — with no language in it. It exists so other tools
can reuse the parsing and the capture logic without the text layer.

Languages: `ru` (default), `en`.

## What it handles

Every item here breaks the only comparable converter, [aigo.tokyo/sgf-txt][aigo],
and each one is covered by a test:

- a pass in the modern encoding, `B[]`, which is what Go servers write;
- a pass in the legacy FF[3] encoding, `B[tt]` — but only on boards too small to
  hold that vertex, where it cannot mean a real move;
- nodes carrying only a comment;
- variation branches, which are not spliced into the game as if they had been
  played;
- player names that happen to contain the letters of another SGF property, such
  as `PB[FREDDY]`;
- handicap games, listing the coordinates of the stones and not merely a count.

Captured stones are not read from the file — SGF does not record them. The game
is replayed under the rules to find them, in the order the rules prescribe: the
stone is placed, enemy groups without liberties come off, and only then is the
player's own group considered. A move with no liberty of its own still captures.

## Limitations

- Only the main line of a game tree is rendered. Variations are skipped rather
  than guessed at.
- Comments (`C[]`) are not rendered. They do not break conversion.
- No reverse conversion (text back to SGF).
- No Japanese locale yet, though the coordinate system is a separate concept so
  one can be added without reworking the renderer.

## Development

Requires Node 24 or newer; developed on the version in `.nvmrc`. Node runs the
TypeScript sources directly, so there is no build step while developing.

```sh
npm install
npm test          # node --test
npm run typecheck # tsc --noEmit
npm run build     # emit dist/ for publishing
```

Only erasable TypeScript syntax is allowed — no `enum`, no `namespace`, no
constructor parameter properties — because Node strips types rather than
transforming them. `erasableSyntaxOnly` in `tsconfig.json` enforces this.

## Prior art

The idea, and the shape of the output, come from [aigo.tokyo/sgf-txt][aigo], the
converter published by the Japan Go Association for the Visually Impaired
(日本視覚障害者囲碁協会). Theirs is the only such tool that existed, it answers in
Japanese, and its output structure is proven with real blind players. The
implementation here is independent.

## License

MIT

[aigo]: https://aigo.tokyo/sgf-txt
