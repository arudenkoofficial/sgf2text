import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGE_COOKIE,
  languageCookie,
  readCookie,
  resolveLanguage,
} from '../web/language.ts';

const SUPPORTED = ['en', 'ru'] as const;

const resolve = (urlParam: string | null, cookie: string | null) =>
  resolveLanguage({ urlParam, cookie, supported: SUPPORTED, fallback: 'en' });

// Every test that proves a source was consulted expects Russian. English is also
// the fallback, so a test expecting English would pass even if the source it names
// were never read at all.

test('a language in the URL outranks a remembered one', () => {
  assert.deepEqual(resolve('ru', 'en'), { language: 'ru', source: 'url' });
});

test('the cookie decides when the URL says nothing', () => {
  assert.deepEqual(resolve(null, 'ru'), { language: 'ru', source: 'cookie' });
});

test('falls back to the served language when nothing was chosen', () => {
  assert.deepEqual(resolve(null, null), { language: 'en', source: 'fallback' });
});

test('a region subtag narrows a language rather than naming another', () => {
  assert.equal(resolve('ru-BY', null).language, 'ru', 'from the URL');
  assert.equal(resolve(null, 'ru-BY').language, 'ru', 'from the cookie');
});

test('an unsupported language is passed over, not fatal', () => {
  assert.deepEqual(resolve('de', 'ru'), { language: 'ru', source: 'cookie' });
});

test('matching ignores case', () => {
  assert.equal(resolve('RU', null).language, 'ru');
  assert.equal(resolve(null, 'Ru').language, 'ru');
});

test('an empty or blank value counts as absent', () => {
  assert.deepEqual(resolve('', '  '), { language: 'en', source: 'fallback' });
});

test('the browser is not an input, so it cannot be consulted', () => {
  // The guarantee is structural, and `tsc` enforces it: the directive below turns
  // into an "unused @ts-expect-error" failure the moment `browser` becomes an
  // accepted field, so sniffing cannot be re-added quietly. The literal has to sit
  // inline — hoisting it to a variable would switch off the excess property check
  // and leave this test asserting nothing.
  assert.deepEqual(
    resolveLanguage({
      urlParam: null,
      cookie: null,
      supported: SUPPORTED,
      fallback: 'en',
      // @ts-expect-error a browser language list is deliberately not part of the input
      browser: ['ru'],
    }),
    { language: 'en', source: 'fallback' },
    'a browser preference has no way in, and no effect when forced in',
  );
});

test('the language is read out of a header holding several cookies', () => {
  assert.equal(readCookie('theme=dark; lang=ru; seen=1', LANGUAGE_COOKIE), 'ru');
  assert.equal(readCookie('lang=ru; theme=dark', LANGUAGE_COOKIE), 'ru', 'first');
  assert.equal(readCookie('theme=dark; lang=ru', LANGUAGE_COOKIE), 'ru', 'last');
});

test('a cookie whose name merely ends with the wanted one is not mistaken for it', () => {
  assert.equal(readCookie('mylang=ru', LANGUAGE_COOKIE), null);
  assert.equal(readCookie('mylang=ru; lang=en', LANGUAGE_COOKIE), 'en');
});

test('an absent, empty or valueless cookie yields null', () => {
  assert.equal(readCookie('', LANGUAGE_COOKIE), null, 'empty header');
  assert.equal(readCookie('theme=dark', LANGUAGE_COOKIE), null, 'absent');
  assert.equal(readCookie('lang=', LANGUAGE_COOKIE), null, 'no value');
  assert.equal(readCookie('lang=   ', LANGUAGE_COOKIE), null, 'blank value');
});

test('a malformed header does not throw', () => {
  assert.equal(readCookie('lang', LANGUAGE_COOKIE), null, 'no separator');
  assert.equal(readCookie('=ru; lang=ru', LANGUAGE_COOKIE), 'ru', 'nameless pair skipped');
});

test('the serialised cookie outlives the session and survives arriving from a link', () => {
  const cookie = languageCookie('ru');

  assert.match(cookie, /^lang=ru;/);
  assert.match(cookie, /Max-Age=\d+/, 'persistent rather than a session cookie');
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /Secure/);

  // Lax, never Strict: Strict withholds the cookie on a cross-site top-level
  // navigation, which is exactly how someone arrives from a link in a chat — the
  // one visit where a remembered language matters most.
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /SameSite=Strict/);
});
