import { readFileSync } from 'node:fs';
import process from 'node:process';
import { DEFAULT_LOCALE, LOCALE_IDS, sgfToText } from './src/index.ts';

const USAGE = `sgf2text — convert an SGF Go file into readable text.

Usage:
  node cli.ts [options] [file.sgf]

Reads <file.sgf>, or standard input when no file is given, and writes the
converted text to standard output. Game records and problems are both read;
which one the file holds is worked out from the file itself.

Options:
  --lang <id>   Output language: ${LOCALE_IDS.join(', ')} (default: ${DEFAULT_LOCALE})
  --help, -h    Show this message

Examples:
  node cli.ts game.sgf
  node cli.ts problem.sgf
  node cli.ts --lang en game.sgf > game.txt
  cat game.sgf | node cli.ts
`;

type Options = {
  help: boolean;
  locale: string;
  file: string | undefined;
};

const parseArguments = (argv: string[]): Options => {
  const options: Options = { help: false, locale: DEFAULT_LOCALE, file: undefined };

  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i] ?? '';

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (argument === '--lang') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error('--lang needs a language, for example: --lang en');
      }

      options.locale = value;
      i += 1;
      continue;
    }

    if (argument.startsWith('--lang=')) {
      options.locale = argument.slice('--lang='.length);
      continue;
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown option ${argument}. Run with --help to see the options.`);
    }

    options.file = argument;
  }

  return options;
};

const readInput = (file: string | undefined): string => {
  if (file === undefined) {
    // Standard input, read whole. Games are small and this keeps the tool
    // usable in a pipeline without pulling in a streaming parser.
    return readFileSync(0, 'utf8');
  }

  try {
    return readFileSync(file, 'utf8');
  } catch {
    throw new Error(`Cannot read ${file}`);
  }
};

const main = (): number => {
  let options: Options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    return 1;
  }

  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  let text: string;
  try {
    // Everything that can fail happens before the first write, so a failure
    // never leaves half a game on standard output.
    text = sgfToText(readInput(options.file), { locale: options.locale });
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    return 1;
  }

  process.stdout.write(`${text}\n`);
  return 0;
};

process.exitCode = main();
