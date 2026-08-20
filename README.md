# sgf2text

Converts an SGF Go game record into plain text that a screen reader can read out.

A saved game is useless to a blind player: SGF is a dense machine format, and a
screen reader pronounces it as noise. This turns it into a numbered move list.
For every capturing move it names the stones you lift off the board, so you can
replay the game on a tactile board.

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

Coordinates run `A`–`T` without `I`, and rows count from the bottom. Go servers
use the same notation, so a game sounds the same in review as in live play.

## Usage

### Command line

```sh
node cli.ts game.sgf                  # convert a file
node cli.ts --lang en game.sgf        # choose the language
cat game.sgf | node cli.ts            # or read from standard input
node cli.ts --help
```

Errors go to standard error, and the converter writes nothing partial to standard
output, so redirecting into a file leaves either a whole game or nothing.

### Library

```js
import { sgfToText, sgfToRecord } from 'sgf2text';

sgfToText(sgf);                  // text in Russian, the default
sgfToText(sgf, { locale: 'en' }); // text in English
sgfToRecord(sgf);                // the game as data, no strings
```

`sgfToRecord` returns the parsed game with no language in it: moves, passes,
setup stones and the vertices each move captured. Other tools can reuse the
parsing and the capture logic without the text layer.

Languages: `ru` (default), `en`.

### Web page

The page is live at <https://sgf.rudenko.live/>. To hand someone the Russian
version, send them <https://sgf.rudenko.live/?lang=ru>: it opens in Russian for
them whatever they last chose.

GitHub Pages serves the document in English, and the page's own script rewrites
it into the chosen language. That language comes from an ordered chain, stopping
at the first source that names one it supports:

1. `?lang=` in the URL, so `…/?lang=ru` opens in Russian for anyone you send it
   to, whatever they last chose;
2. the `lang` cookie, which records the last language you saw;
3. English.

One control sets both the page and the record, so a game comes out in the
language you are reading the page in.

The page never reads the browser's preferred languages. Sniffing them was meant to
spare a Russian-reading player from choosing, but many blind users run an
English-language system with an English screen reader, which makes the browser the
least reliable signal for the person it was meant to serve. It would also let an
OS update change the page's language with no action from you. A fixed default and
one link that sticks give you the same page every time.

The page passes over a value naming an unsupported language instead of failing,
so `?lang=de` still lets the cookie decide. The cookie holds a language tag and
nothing else, and carries `SameSite=Lax` so it survives your arrival from a link
in a chat. Every visit rewrites it with a fresh year, so the choice keeps holding
as long as you keep coming back. If your browser blocks cookies, the page works
in full and says nothing about it.

A Russian-reading visitor gets English on the bare URL. Open `?lang=ru` once and
the cookie remembers it. The address bar names the language from then on, so a
link you copy opens the way you saw it.

## What it handles

Each item below breaks the only comparable converter, [aigo.tokyo/sgf-txt][aigo],
and each has a test here:

- a pass in the modern encoding, `B[]`, which is what Go servers write;
- a pass in the legacy FF[3] encoding, `B[tt]`, but only on boards too small to
  hold that vertex, where it cannot mean a real move;
- nodes carrying only a comment;
- variation branches, which the renderer keeps out of the game rather than
  splicing them in as if someone had played them;
- player names that happen to contain the letters of another SGF property, such
  as `PB[FREDDY]`;
- handicap games, listing the coordinates of the stones and not only their
  number.

SGF does not record captured stones, so the converter replays the game under the
rules to find them, in the order the rules prescribe: it places the stone, lifts
enemy groups left without liberties, and only then looks at the player's own
group. A move with no liberty of its own still captures.

## Limitations

- The converter renders only the main line of a game tree. It skips variations
  instead of guessing at them.
- Comments (`C[]`) do not appear in the output, and they do not break conversion.
- No reverse conversion (text back to SGF).
- No Japanese locale yet. The coordinate system is a separate concept, so you can
  add one without reworking the renderer.

## Development

Requires Node 24 or newer; developed on the version in `.nvmrc`. Node runs the
TypeScript sources as they are, so nothing needs compiling while you work.

```sh
npm install
npm test              # node --test
npm run typecheck     # the library, and the web modules without the dom lib
npm run typecheck:web # the page's DOM wiring, with the dom lib
npm run build         # emit dist/ for publishing
npm run build:web     # bundle web/dist/main.js for the page
```

Both typechecks matter, and they check different things. `web/language.ts`,
`web/metadata.ts` and `web/ui-strings.ts` reach `npm run typecheck` through the
tests that import them, where `lib` carries no `dom`. A stray `document` in one of
them fails that build, which is what keeps the language logic testable without a
browser.

Use only erasable TypeScript syntax: no `enum`, no `namespace`, no constructor
parameter properties. Node strips types rather than transforming them, and
`erasableSyntaxOnly` in `tsconfig.json` enforces the rule.

## Prior art

The idea, and the shape of the output, come from [aigo.tokyo/sgf-txt][aigo], which
the Japan Go Association for the Visually Impaired (日本視覚障害者囲碁協会)
publishes. Theirs was the only such tool, and it answers in Japanese. Real blind
players have proven its output structure, so this converter reuses it. The code
here is independent.

## License

MIT

[aigo]: https://aigo.tokyo/sgf-txt
