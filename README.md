# sgf2text

Converts an SGF Go game record or problem into plain text that a screen reader
can read out.

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

## Problems

A problem file is not a game. Its position is set up rather than played, and its
answer is a tree rather than a line, so the converter recognises one and reads it
out differently: the stones named by colour, so the position can be laid out by
hand, and then every line of the answer.

```
Board size: 9×9
Problem. White to play.
White: 2 stones — C6, D7
Black: 2 stones — C7, D6

Solution: 2 variations.

Variation 1:
1. White C5
2. Black D5

Variation 2:
1. White D5
2. Black C5
```

The side to move is read out first, and the file's own statement, when it has
one, follows under `Note:`.

Every line is written out from its first move, including the moves it shares with
the line before it. A tree written once with its branches indented is shorter, and
on screen it is plainly better; read aloud it cannot be followed at all, because a
screen reader conveys no indentation and both your hands are on the board.

Lines the file marks as solving the problem are marked. The rest are numbered and
nothing more: SGF has no way of saying that a branch fails, so a line the
converter can read no verdict for gets none rather than being called wrong.

A file counts as a problem when it sets up white stones before anybody plays —
in the root, or in the nodes below it, since a file is free to spend its root on
`GM`, `FF` and `SZ` alone. A handicap places black stones only, so a handicap
game stays a game, and so does a reviewed game full of variations. A recorded
result or handicap settles it outright, which keeps a game resumed from a diagram
on the game side.

`PL` is not part of the test, tempting as it looks: it is how a handicap game
says that White moves first. It still says whose move it is once the file is
known to be a problem.

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
import { sgfToText, sgfToRecord, sgfToDocument } from 'sgf2text';

sgfToText(sgf);                   // text in Russian, the default
sgfToText(sgf, { locale: 'en' }); // text in English
sgfToRecord(sgf);                 // the game as data, no strings
sgfToDocument(sgf);               // { kind: 'game' | 'problem', … }, also no strings
```

`sgfToRecord` returns the parsed game with no language in it: moves, passes,
setup stones and the vertices each move captured. Other tools can reuse the
parsing and the capture logic without the text layer.

`sgfToDocument` reads the file as whichever of the two genres it turns out to be,
returning a `GameRecord` or a `ProblemRecord` under a `kind`. Every line of a
problem is replayed on its own from the setup position, so each carries the
stones its own moves captured and no line can be contaminated by the branch
beside it. `sgfToRecord` still answers with a game record whatever it is given,
so callers written before problems existed are unaffected.

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
  number;
- stones placed rather than played part-way through — a position resumed from a
  diagram, a stone added to make a point — announced where they appear instead of
  reaching the board in silence;
- `AE`, which takes a stone off without anybody capturing it, announced in words
  that cannot be mistaken for a capture: a capture means a move worked, and a
  reader whose board says only that a stone is gone has nothing else to go on;
- problem files, which it does not mistake for a handicap game of twenty-seven
  stones, and whose answer it reads out in full rather than one branch of it.

SGF does not record captured stones, so the converter replays the game under the
rules to find them, in the order the rules prescribe: it places the stone, lifts
enemy groups left without liberties, and only then looks at the player's own
group. A move with no liberty of its own still captures.

## Limitations

- In a game, the converter renders only the main line and skips variations
  instead of guessing at them. In a problem the variations are the answer, so all
  of them are read out.
- Comments (`C[]`) appear only as a problem's statement, taken from the root node.
  A comment on a move does not appear in the output, and it does not break
  conversion.
- A problem's statement is passed through in whatever language the file wrote it,
  which is usually English. Nothing marks it as such for a screen reader.
- A deep problem tree produces a long text. Nothing caps it: a silent cap on an
  accessibility tool is worse than a text that takes a while.
- A branch of a problem holding a move that cannot be read is dropped rather than
  failing the whole file, and the heading says how many lines went with it.
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
