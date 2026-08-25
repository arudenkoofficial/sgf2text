# TODO

Follow-ups found while implementing `read-sgf-problems`, and in the review that
followed it. None is urgent, each is independent, and none is big enough to need
its own OpenSpec change unless it turns out to be.

## The page still describes itself as a converter of games

`web/ui-strings.ts` — `title`, `subtitle`, `tagline` and `description`, in both
languages, all say the page converts a game record. It converts problems too now,
and nothing on the page says so.

Not cosmetic. The subtitle and the tagline are read out on every visit, so
somebody sent here for problems hears a tool for games and concludes she has been
given the wrong address.

Worth checking in the same pass: `web/manifest.ru.webmanifest`,
`web/manifest.en.webmanifest` and the link-preview description, which repeat the
same sentence.

`cli.ts` says the same thing in its `USAGE` text — "convert an SGF Go game record
into readable text", "Reads the game from <file.sgf>" — while converting problems
perfectly well. Anyone reading `--help` cannot learn the feature exists from the
interface that ships it.

Size: a handful of sentences, twice.

## Stones added after play has begun are dropped from a problem

`expandLines` in `src/parse.ts` reads moves from every node of the tree but no
setup properties at all. The position a problem opens with is now read from the
whole opening — the root and the nodes below it, up to the first move — so a file
that spends its root on `GM`/`FF`/`SZ` and sets the stones out one node down is
handled. What is still dropped is a branch that adds stones as it goes:

    (;GM[1]FF[4]SZ[9]AB[cc][dd]AW[cd][dc]PL[W];AB[ee];W[ce];B[de])

E5 is never mentioned — not in the statement, not in the solution. `AE`, which
removes a stone, is ignored the same way, and a variation node holding nothing
but `AB[dd]` disappears from the list of lines entirely.

The game path does not have this hole: `gameFrom` collects setup from every node
of the main line, so `replay` puts those stones on the board and finds the
captures around them.

The failure is quiet, but not in the way a missed capture is quiet. The stone is
absent from the text and from the reader's board alike, so the two stay
consistent with each other; it is simply a different position from the one the
file records, and its answer may make no sense.

Which is why half a fix would be worse than none. Applying the stones to the
board without telling the reader they appeared is exactly the failure this
converter exists to prevent: her board would drift out of step with the text. So
the appearance has to be spoken, which means new wording in both locales — and
that is why this is not a two-line change.

The reference problem does not use this. Whether real collections do is unknown.
Check more files before building anything.

## A stone set up in a game is announced as a handicap

`render` in `src/render.ts` takes the first `setup` event it finds and reports it
under the handicap label, whatever colour the stones are and wherever they sit:

    (;GM[1]SZ[9];B[ba];AW[aa];B[ab])                        →  Фора: 1 камень — A9
    (;GM[1]SZ[19]PB[Bob]PW[Alice]RE[B+R]AW[dd]AB[pp];B[qq]) →  Фора: 2 камня — Q4, D16

A handicap places black stones only, and places them before the first move. This
is the same mistake `read-sgf-problems` fixed for problems, still standing on the
game path; it predates that change.

The second example matters more than it used to. A recorded result now settles
the genre before the stones are examined, which is what keeps a game resumed from
a diagram on the game side — correctly, and straight into this label.

The rules are unaffected — the stone does reach the board and its capture is
found. Only the header line lies.

## The page announces a solution of zero lines

`doneProblem` in `web/ui-strings.ts` states a count whatever it is, so converting
a file that records a position and no answer puts

    Готово. Это задача. Вариантов в решении: 0.

in the live region while the result on the page says `Решения в файле нет.` The
listener hears a count and then reads a denial. `test/locales.test.ts:82` forbids
exactly this one layer down, for `locale.solution(0)` — "a count of nothing is not
a heading a listener can use" — but the announcement layer has no equivalent
guard, and no test holds it to one.

Size: one branch and one string in each language, plus the test that would have
caught it.

## Smaller things

`web/main.ts:281` keeps the whole parsed document alive in the standing-message
closure, and recomputes `events.filter(...).length` on every language change, to
recover two facts — the genre and a count — that could be captured as scalars at
conversion time.

`isProblem` and `problemFrom` in `src/parse.ts` each call `opening(root)` and
walk its setup, so both are computed twice for every problem. Threading the
result from the classifier into the builder would also put the one place setup is
read where the mid-tree fix above belongs.
