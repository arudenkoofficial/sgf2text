import { documentToText, isSgfError, sgfToDocument } from '../src/index.ts';
import {
  conversionMessage,
  destinationFor,
  fieldInvalidity,
  staleRegions,
  survivesRestatement,
} from './announcement.ts';
import type { Destination, Standing, Subject, Tone } from './announcement.ts';
import {
  LANGUAGE_COOKIE,
  languageCookie,
  readCookie,
  resolveLanguage,
} from './language.ts';
import { alternateLinks, canonicalUrl, manifestAddress } from './metadata.ts';
import { shareThePage } from './share.ts';
import type { ShareCapabilities } from './share.ts';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, stringsFor } from './ui-strings.ts';
import type { UiStrings } from './ui-strings.ts';

const need = <T extends Element>(selector: string, within: ParentNode = document): T => {
  const element = within.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page is missing ${selector}`);
  }

  return element;
};

const form = need<HTMLFormElement>('#form');
const input = need<HTMLTextAreaElement>('#sgf');
const file = need<HTMLInputElement>('#file');
const language = need<HTMLSelectElement>('#lang');
const convertButton = need<HTMLButtonElement>('#convert');
const copyButton = need<HTMLButtonElement>('#copy');
const shareButtons = [
  need<HTMLButtonElement>('#share-top'),
  need<HTMLButtonElement>('#share-bottom'),
];
const result = need<HTMLPreElement>('#result');

/**
 * A place a message can be said, and what saying it there means.
 *
 * `kind` is the whole of the semantics: `field` is the region the game field names in
 * `aria-describedby`, so it may hold only what the record is about. Everything else is
 * a notice — an event, said beside the control that caused it.
 *
 * Four of them, because the same action is offered in two places and one region cannot
 * sit beside two controls at opposite ends of a page. Only ever one holds text.
 */
type Region = {
  kind: Destination;
  node: HTMLParagraphElement;
};

const fieldRegion: Region = { kind: 'field', node: need<HTMLParagraphElement>('#status') };

const noticeFor = (selector: string): Region => ({
  kind: 'notice',
  node: need<HTMLParagraphElement>(selector),
});

const resultNotice = noticeFor('#notice');
const shareNotices = new Map<HTMLButtonElement, Region>([
  [shareButtons[0] as HTMLButtonElement, noticeFor('#notice-top')],
  [shareButtons[1] as HTMLButtonElement, noticeFor('#notice-bottom')],
]);

const regions: readonly Region[] = [
  fieldRegion,
  resultNotice,
  ...shareNotices.values(),
];

const ui = (): UiStrings => stringsFor(language.value);

/**
 * Announcements go through a small status line rather than making the whole
 * result a live region: a live region holding a 300-move game would be read
 * out in full on every conversion.
 *
 * A message arrives as a function of the strings rather than as a finished
 * sentence, so it can be rebuilt later in another language. The status line was
 * the one piece of text `applyLanguage` did not translate, and the messages that
 * outlive a switch are exactly the failures: every error path empties the result
 * first, and an empty result is what stops the game being re-converted. So an
 * error announced in English stayed under a `lang="ru"` document, which is the
 * wording a screen reader then reads out with the wrong language's phonemes.
 */
type Message = (strings: UiStrings) => string;

/**
 * `tone` decides how it is drawn; `subject` decides everything else — which region it
 * is said in, and therefore what it means for the game field.
 *
 * These were two arguments and then one, and this is the third arrangement. A separate
 * "is this about the record" flag could contradict the region it travelled with;
 * naming the region alone removed the contradiction but left the subject unstated, so
 * the choice of region was a habit no test could read. Now the call site states the one
 * thing it knows and the rest follows from it.
 */
type Announcement = {
  subject: Subject;
  message: Message;
  tone: Tone;
  region: Region;
};

const standing = ({ tone, region }: Announcement): Standing => ({ tone, where: region.kind });

let announcement: Announcement | null = null;

/**
 * Written every time, including when the sentence is the one already there.
 *
 * This used to return early on an unchanged sentence, and that was the second press of
 * every control going unanswered: a polite region reports what appears in it, and a
 * sentence left in place never appears. Measured rather than argued — two presses of the
 * copy control recorded one DOM mutation and then none. She presses again precisely
 * because she is unsure the first press registered, and silence is the one answer she
 * cannot investigate.
 *
 * Nothing is lost by writing unconditionally. Assigning `''` to a region that is already
 * empty records no mutation at all — measured too — so the clearing loop in `render`
 * costs nothing on the three regions that had nothing to clear.
 */
const say = (region: Region, text: string, tone: Tone | null): void => {
  region.node.textContent = text;

  if (tone === null) {
    delete region.node.dataset.tone;
    return;
  }

  region.node.dataset.tone = tone;
};

const render = (current: Announcement): void => {
  const { message, tone, region } = current;

  // Emptying the notices that are no longer true, and only those. A polite region
  // reports what appears in it rather than what leaves, so this announces nothing —
  // and `say` skips a region that already holds what it is being given, so re-rendering
  // in a new language cannot make an empty region speak.
  //
  // The field's description is never in this set. It is the condition of the field
  // rather than an event, and clearing it used to leave a record marked invalid with
  // nothing on the page saying why.
  for (const stale of staleRegions(regions, region)) {
    say(stale, '', null);
  }

  say(region, message(ui()), tone);

  // The field's description is `#status`, so a failure about the record has to mark
  // the field invalid too — otherwise a screen reader reads the message but the input
  // still sounds fine. A message in a notice touches nothing here: the field is
  // neither wrong nor newly right, and a standing mark on a record that failed to
  // parse has to survive a share that had nothing to do with it.
  const invalidity = fieldInvalidity(standing(current));
  if (invalidity !== null) {
    input.setAttribute('aria-invalid', invalidity);
  }
};

/**
 * `notice` says which notice, for the messages that are said in one. It is only ever
 * needed by the share controls, since they are the same action offered twice and the
 * answer belongs beside the one that was pressed; everything else has a single home and
 * takes the default.
 *
 * Whether a notice is used at all is not this argument's business — `destinationFor`
 * decides that from the subject, so a message about the record cannot be talked into
 * the footer by passing one.
 */
const announce = (
  subject: Subject,
  message: Message,
  tone: Tone = 'info',
  notice: Region = resultNotice,
): void => {
  const region = destinationFor(subject) === 'field' ? fieldRegion : notice;

  announcement = { subject, message, tone, region };
  render(announcement);

  // The same condition that marks the field invalid, asked once rather than restated:
  // a field worth marking is a field worth sending her to.
  if (fieldInvalidity(standing(announcement)) === 'true') {
    input.focus();
  }
};

/**
 * Re-renders the standing message in the current language. Deliberately not
 * `announce`: moving focus belongs to the failure that caused the message, not to
 * a later change of language. A visitor operating the language control must not
 * be thrown out of it and into the game field.
 *
 * A message that has stopped being true is dropped rather than translated. Restating a
 * failure is restating something still in force; restating "the address of this page has
 * been copied" announces a copy that is not happening, which is what the page did until
 * now. It is forgotten as well as cleared, so a second change of language cannot bring
 * it back.
 */
const reannounce = (): void => {
  if (announcement === null) {
    return;
  }

  if (!survivesRestatement(standing(announcement))) {
    say(announcement.region, '', null);
    announcement = null;
    return;
  }

  render(announcement);
};

/**
 * The field's description and its mark are a verdict on one particular record. She
 * replaces the record, and the verdict is about something that no longer exists — so it
 * goes when she edits, rather than standing until the next conversion and telling a
 * screen reader that a record the page has never examined is wrong.
 *
 * The mark is removed rather than set to `'false'`: there is no verdict now, and
 * `'false'` is a verdict — it would claim the new record is valid, which nothing checked.
 *
 * Only the record's own message. A notice about the clipboard or the page has nothing to
 * do with what she is typing, and clearing it would make editing the field a way to erase
 * an answer she has not read yet.
 *
 * Read from the field itself rather than from `announcement`, and the first attempt got
 * this wrong in exactly the way this file's own distinction predicts. `announcement` is
 * the last thing the page *said*; the field's description is a state that outlives it. So
 * a failed conversion followed by a share leaves the verdict standing in the field while
 * the last announcement is the share's — and asking `announcement` then reports no
 * verdict to clear. Which is the same mistake as keeping our own flag for an open share
 * sheet: one variable answering for two independent facts.
 *
 * The standing announcement is forgotten only when it is the one being cleared, so a
 * later change of language cannot restate it.
 */
const forgetTheVerdict = (): void => {
  if (fieldRegion.node.textContent === '' && !input.hasAttribute('aria-invalid')) {
    return;
  }

  say(fieldRegion, '', null);
  input.removeAttribute('aria-invalid');

  if (announcement !== null && announcement.region.kind === 'field') {
    announcement = null;
  }
};

const showResult = (text: string): void => {
  // textContent only. A player name or comment may contain angle brackets, and
  // nothing from a game file is ever treated as markup.
  result.textContent = text;
  copyButton.setAttribute('aria-disabled', text === '' ? 'true' : 'false');
};

const convert = (): void => {
  const sgf = input.value.trim();

  if (sgf === '') {
    showResult('');
    announce('record', (strings) => strings.emptyInput, 'error');
    return;
  }

  try {
    // Read once and kept, rather than converted straight to text: what the file
    // turned out to be decides what is announced, and the announcement is
    // restated whenever the language changes.
    const file = sgfToDocument(input.value);
    showResult(documentToText(file, { locale: language.value }));
    announce('record', (strings) => conversionMessage(file, strings));
  } catch (error) {
    // The input is left exactly as the visitor typed it, so it can be corrected.
    // Only translated wording is announced: the library's own messages are
    // English, and English spliced into Russian speech is barely intelligible
    // through a screen reader.
    //
    // The code is kept rather than the sentence, so the same failure can be
    // stated again if the language changes before it is dealt with.
    const code = isSgfError(error) ? error.code : null;
    showResult('');
    announce(
      'record',
      (strings) => (code === null ? strings.parseFailed : strings.errors[code]),
      'error',
    );
  }
};

/**
 * The base every address on this page is built from, and it is built rather than read
 * from the HTML so that a repository rename or a custom domain corrects itself for
 * every visitor. The hardcoded values in the document remain only as the floor for a
 * crawler that runs no JavaScript.
 *
 * Resolved against the directory rather than assembled from `origin` and `pathname`.
 * Two reasons, both of which used to bite:
 *
 * `/sgf2text/index.html` and `/sgf2text/` are the same page, and building the base
 * from `pathname` gave each of them a canonical address naming itself — so they
 * competed as duplicates, which is the opposite of what the hreflang set is here to
 * do. `new URL('.', …)` resolves both to the directory.
 *
 * And `origin` serialises to the string "null" in a document with an opaque origin,
 * such as a sandboxed frame. `new URL('null' + '/sgf2text/')` is not a valid URL, so
 * this threw — in the middle of translating the page, leaving the metadata in one
 * language and every visible string in the other.
 */
const pageBase = (): URL => new URL('.', window.location.href);

/**
 * The address the share control hands over: the same one the canonical link
 * declares, so what is shared, what the address bar shows and what a search engine
 * is told cannot become three different answers.
 *
 * Deliberately not `location.href`, which is usually right and occasionally not:
 * `rememberLanguageInUrl` is wrapped in a `try` because Safari refuses history writes
 * after enough of them, and that refusal is silent. So the address bar is the one
 * source that can disagree with the language actually being read.
 */
const pageAddress = (): string => canonicalUrl(pageBase(), language.value);

const applyAddresses = (chosen: string): void => {
  const base = pageBase();

  need<HTMLLinkElement>('link[rel="canonical"]').href = canonicalUrl(base, chosen);
  need<HTMLMetaElement>('meta[property="og:url"]').content = canonicalUrl(base, chosen);

  for (const { hreflang, href } of alternateLinks(base, SUPPORTED_LANGUAGES)) {
    const link = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${hreflang}"]`,
    );

    if (link !== null) {
      link.href = href;
    }
  }
};

const AIGO = 'https://aigo.tokyo/sgf-txt';
const REPOSITORY = 'https://github.com/arudenkoofficial/sgf2text';

const link = (href: string): HTMLAnchorElement => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = href.replace(/^https:\/\//, '');

  return anchor;
};

/**
 * Rebuilt from nodes rather than assigned as markup: the paragraph holds two
 * links, and this page never has a path that turns a string into HTML.
 */
const applyCredits = (strings: UiStrings): void => {
  need('#credits').replaceChildren(
    document.createTextNode(strings.creditsBefore),
    link(AIGO),
    document.createTextNode(strings.creditsBetween),
    link(REPOSITORY),
    document.createTextNode('.'),
  );
};

/**
 * The description and the link-preview tags reach a visitor before the page does
 * — in a search result, or in a link someone pasted into a chat — so they have to
 * follow the language too, not just what is visible on screen.
 */
const applyMetadata = (strings: UiStrings): void => {
  need<HTMLMetaElement>('meta[name="description"]').content = strings.description;
  need<HTMLMetaElement>('meta[property="og:title"]').content = strings.title;
  need<HTMLMetaElement>('meta[property="og:description"]').content = strings.description;
  need<HTMLMetaElement>('meta[property="og:locale"]').content = strings.ogLocale;
  applyAddresses(language.value);
};

const applyVisible = (strings: UiStrings): void => {
  // The language attribute belongs here rather than with the metadata: it is what
  // chooses the screen reader's voice, so it is read by the visitor, not by a
  // crawler, and it must never be the part that gets skipped.
  document.documentElement.lang = strings.htmlLang;
  document.title = strings.title;

  need('#skip-link').textContent = strings.skipLink;
  need('#subtitle').textContent = strings.subtitle;
  need('#tagline').textContent = strings.tagline;
  need('#sgf-label').textContent = strings.sgfLabel;
  need('#file-label').textContent = strings.fileLabel;
  need('#lang-label').textContent = strings.langLabel;
  need('#input-heading').textContent = strings.inputHeading;
  need('#result-heading').textContent = strings.resultHeading;
  need('#privacy').textContent = strings.privacy;
  need('#keep-summary').textContent = strings.keepSummary;
  need('#keep-instruction').textContent = strings.keepInstruction;
  applyCredits(strings);
  convertButton.textContent = strings.convert;
  copyButton.textContent = strings.copy;
  for (const button of shareButtons) {
    // The label is its own element, so translating it cannot reach the mark beside it.
    // Writing to the button's text would have deleted the glyph, and relying on the
    // last child would have deleted it the day somebody reformatted the markup.
    need('.label', button).textContent = strings.share;
  }
  result.dataset.placeholder = strings.placeholder;
  reannounce();
};

/**
 * The name under the icon, once the page is on a home screen.
 *
 * Visitor-facing, so it is not part of the metadata block that crawlers read and that
 * is allowed to fail — she reads this on her own home screen every time she goes
 * looking for the tool. But it is also the only place in either block that has to find
 * a tag before it can do anything, while the page works completely without it.
 *
 * So it runs last of everything, which is the one position where its failure costs
 * only itself. It sat at the head of `applyVisible` first, where a renamed tag would
 * have thrown before a single label was translated and left the page declaring one
 * language over labels written in the other — the precise incoherence the ordering in
 * `applyLanguage` exists to remove.
 *
 * Both sources of the name are rewritten, because which one the platform reads is not
 * this page's decision: `apple-mobile-web-app-title`, and the manifest, of which there
 * is one per language since a static file cannot follow a control. If a platform
 * honours the swapped link she gets her own language; if it ignores it, it falls back
 * to the served manifest and lands exactly where a single manifest would have left
 * her. It cannot come out worse, and one manifest could come out wrong.
 */
const applyHomeScreenName = (strings: UiStrings): void => {
  need<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]').content = strings.appName;
  need<HTMLLinkElement>('link[rel="manifest"]').href = `./${manifestAddress(language.value)}`;
};

/**
 * The visible page first, the metadata second, the home screen name last.
 *
 * These were one sequence with the metadata at the front, so a single missing tag
 * aborted the run and left every label in one language beneath metadata already
 * rewritten into the other — the precise incoherence this change exists to
 * remove. Ordered this way, a metadata failure costs a crawler its signal and
 * costs the visitor nothing.
 *
 * The order is what each failure costs, cheapest last: labels she is reading now,
 * then a crawler's signal, then a name she will read the next time she looks at her
 * home screen. Nothing follows the last one, so nothing can be taken down by it.
 *
 * A throw in here is our defect, not a condition of the visitor's browser, so
 * unlike the cookie and the address bar it is reported. The page makes no network
 * request by design, which leaves the console as the only place to report it.
 */
const applyLanguage = (): void => {
  const strings = ui();

  applyVisible(strings);

  try {
    applyMetadata(strings);
  } catch (error) {
    console.error('The page metadata could not be updated', error);
  }

  applyHomeScreenName(strings);
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  convert();
});

/**
 * A record in the field is unsaved work: it was pasted or read from a file, this
 * page stores nothing, and a reload loses it with no way back.
 *
 * Guarded on the field being non-empty, which keeps the dialog away from the
 * visitor who has converted nothing and is simply leaving. The browser decides
 * the wording — no message of ours is shown, and none is worth writing.
 */
window.addEventListener('beforeunload', (event) => {
  if (input.value.trim() === '') {
    return;
  }

  event.preventDefault();
});

/**
 * The chosen language lives in the URL, so a link can open the page in either
 * language — useful for sending someone straight to the version they read.
 */
const rememberLanguageInUrl = (): void => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('lang') === language.value) {
    return;
  }

  url.searchParams.set('lang', language.value);

  try {
    window.history.replaceState(null, '', url);
  } catch {
    // The same reasoning as the cookie, and the same failures: a document with an
    // opaque origin refuses a history write, and Safari refuses one after enough
    // of them in a short window. The address bar is a convenience; the page is
    // not. This used to run unguarded, and ahead of the translation, so a refusal
    // here left the language control naming a language the page was not in.
  }
};

/**
 * Reading cookies can raise a SecurityError in a sandboxed frame, and writing one
 * silently does nothing when the browser blocks them. Either way the page works in
 * full and the visitor is told nothing: a preference that could not be stored is
 * not their problem to solve.
 */
const storedLanguage = (): string | null => {
  try {
    return readCookie(document.cookie, LANGUAGE_COOKIE);
  } catch {
    return null;
  }
};

const rememberLanguageInCookie = (): void => {
  try {
    document.cookie = languageCookie(language.value);
  } catch {
    // Nothing to do and nothing to say.
  }
};

/**
 * The chain: the URL wins, then the cookie, then the language the document was
 * served in. `navigator.languages` is deliberately absent — Russian is reached
 * only by an act of choosing, so the page a visitor gets never changes without an
 * action of theirs.
 */
const restoreLanguage = (): void => {
  const { language: chosen } = resolveLanguage({
    urlParam: new URL(window.location.href).searchParams.get('lang'),
    cookie: storedLanguage(),
    supported: SUPPORTED_LANGUAGES,
    fallback: DEFAULT_LANGUAGE,
  });

  language.value = chosen;

  // The URL carries the resolved language from the start, not only after the
  // control is used. Otherwise a visitor reading Russian on the bare URL — because
  // their cookie says so — would copy an address that opens in whatever language
  // the recipient's own cookie holds, and the canonical address would disagree
  // with the one in the address bar.
  rememberLanguageInUrl();

  // A link someone was sent becomes their remembered choice, so the cookie always
  // holds the last language they actually saw.
  //
  // Written on every visit, including the ones that resolved *from* the cookie:
  // refreshing the expiry is the whole point. Skipping those visits meant the year
  // never slid forward, so a reader who chose Russian once and afterwards always
  // arrived on the bare URL lost it a year after that single choice — however
  // often she had come back in between. She is the one visitor for whom this
  // cookie is the only thing standing between her and an English page.
  rememberLanguageInCookie();
};

language.addEventListener('change', () => {
  applyLanguage();
  rememberLanguageInUrl();
  rememberLanguageInCookie();

  // A game already converted is re-rendered, so the visitor does not have to
  // paste it again to hear it in another language.
  if (result.textContent !== '') {
    convert();
  }
});

// Typing or pasting replaces the record, which retires whatever the page last said about
// the old one. Not fired by the page's own writes, so reading a file still converts and
// announces normally.
input.addEventListener('input', forgetTheVerdict);

file.addEventListener('change', () => {
  const chosen = file.files?.[0];
  if (chosen === undefined) {
    return;
  }

  // Emptied now that the file has been taken. `change` fires when the control's value
  // changes, and choosing the file already in it does not always change it — browsers
  // differ, and she should not have to have the right one. Emptying makes the next
  // identical choice a change everywhere; the `File` above is already in hand, so the
  // read is unaffected.
  file.value = '';

  chosen
    .text()
    .then((text) => {
      input.value = text;
      convert();
    })
    .catch(() => {
      // A notice, not the field's description. The field is where the file's contents
      // were going, which is the whole of its claim on the message — nothing here read
      // the record, so nothing here may call it invalid or pull her into it. She may be
      // holding a perfectly good game she pasted an hour ago.
      announce('file', (strings) => strings.fileFailed, 'error');
    });
});

copyButton.addEventListener('click', () => {
  const text = result.textContent ?? '';
  if (text === '') {
    // The button stays focusable while there is nothing to copy, so say why
    // rather than doing nothing when it is pressed.
    announce('result', (strings) => strings.emptyResult, 'error');
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      announce('result', (strings) => strings.copied);
    })
    .catch(() => {
      announce('result', (strings) => strings.copyFailed, 'error');
    });
});

/**
 * The two capabilities, read at press time rather than once at load: a permission
 * can be granted between one press and the next.
 *
 * `share` is bound because `navigator.share` called detached loses its receiver. It
 * is offered only when it is a function, and even then the call may be refused —
 * which is why `shareThePage` decides by outcome rather than trusting this check.
 *
 * `copy` reaches through `navigator.clipboard`, which is absent on an insecure
 * origin; the property access throws, the promise rejects, and the fallback path
 * treats it as the failure it is.
 */
const shareCapabilities = (): ShareCapabilities => ({
  share:
    typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined,
  copy: async (text: string) => {
    await navigator.clipboard.writeText(text);
  },
});

/**
 * One handler, bound to both controls, each answering in its own region.
 *
 * The region comes from the button that was pressed rather than from a fixed choice,
 * which is the whole reason there are two of them: a confirmation drawn at the other
 * end of the page is one a reader at high magnification never sees.
 */
const share = (notice: Region): void => {
  shareThePage(shareCapabilities(), { title: ui().title, url: pageAddress() })
    .then((outcome) => {
      if (outcome === 'busy') {
        // A sheet is already open and unanswered, which is what the browser says when
        // the other control is pressed while the first one's sheet stands. Saying
        // anything would report an outcome that has not happened yet.
        return;
      }

      if (outcome === 'cancelled') {
        // She closed the sheet. Nothing happened, and saying so would report a
        // failure for a decision she made on purpose.
        return;
      }

      if (outcome === 'shared') {
        announce('page', (strings) => strings.shared, 'info', notice);
        return;
      }

      if (outcome === 'copied') {
        announce('page', (strings) => strings.addressCopied, 'info', notice);
        return;
      }

      // Drawn in the failure colour, but said in a notice: the game in the field is not
      // what failed, so it is not marked invalid and does not take focus. The message
      // names the browser's own share control, which is all the page has left to offer.
      announce('page', (strings) => strings.shareFailed, 'error', notice);
    })
    .catch(() => {
      // `shareThePage` is documented never to reject, and this is the backstop for
      // that promise being broken: silence is the one outcome a blind visitor cannot
      // detect, so something is always said.
      announce('page', (strings) => strings.shareFailed, 'error', notice);
    });
};

for (const [button, region] of shareNotices) {
  button.addEventListener('click', () => {
    share(region);
  });
}

restoreLanguage();
applyLanguage();
