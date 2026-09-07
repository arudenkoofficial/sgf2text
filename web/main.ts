import { documentToText, isSgfError, sgfToDocument } from '../src/index.ts';
import {
  conversionMessage,
  destinationFor,
  fieldInvalidity,
  reconvertsOnLanguageChange,
  staleRegions,
  summarise,
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
import { downloadName, saveTheText } from './save.ts';
import type { SaveCapabilities } from './save.ts';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, stringsFor } from './ui-strings.ts';
import type { UiStrings } from './ui-strings.ts';

const need = <T extends Element>(selector: string, within: ParentNode = document): T => {
  const element = within.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page is missing ${selector}`);
  }

  return element;
};

const file = need<HTMLInputElement>('#file');
const language = need<HTMLSelectElement>('#lang');
const saveButton = need<HTMLButtonElement>('#save');
const result = need<HTMLPreElement>('#result');

/**
 * The game the page was given, held here rather than in a field on the page.
 *
 * The textarea used to be both the way in and this variable: the file handler wrote the
 * file's text into it, `convert()` read it back, and a change of language re-converted
 * from it. Only the first of those was ever about the visitor, and it was the one she
 * never used — a game reaches her as a file. The other two are the machine reading its
 * own storage, and storage does not need to be a control she tabs through.
 */
let record: string | null = null;

/**
 * A place a message can be said, and what saying it there means.
 *
 * `kind` is the whole of the semantics: `field` is the region the file control names in
 * `aria-describedby`, so it may hold only what the game the page was given is about.
 * Everything else is a notice — an event, said beside the control that caused it.
 *
 * Two of them. There were four while the same action was offered at both ends of the
 * page and one region could not sit beside two controls; the rule outlives that
 * arrangement, and the page currently has one control that answers a press.
 */
type Region = {
  kind: Destination;
  node: HTMLParagraphElement;
};

/**
 * One entry per destination, and the list of them read back off it rather than written
 * out a second time.
 *
 * Keyed rather than chosen by a test on the destination, for the reason `announcement.ts`
 * gives beside `DESTINATIONS`: a branch returning a bare constant never touches the value
 * it switched on, so a third destination would compile and quietly inherit whichever
 * region the test happened to fall through to.
 *
 * Each entry is pinned to the key it is filed under, the way the string catalogue pins
 * each language's `htmlLang` to its own key. `kind` and the key say the same thing twice,
 * and the two are read by different code — `staleRegions` and `fieldInvalidity` go by
 * `kind`, `regionFor` and `standingByRegion` go by the key. Filing the notice under
 * `field` would compile without this, and every message meant for one would be judged as
 * the other: a save confirmation would become the file control's description and mark
 * her file valid.
 */
const REGIONS = {
  field: { kind: 'field', node: need<HTMLParagraphElement>('#status') },
  notice: { kind: 'notice', node: need<HTMLParagraphElement>('#notice') },
} satisfies { [D in Destination]: Region & { kind: D } };

const regions: readonly Region[] = Object.values(REGIONS);

const ui = (): UiStrings => stringsFor(language.value);

/**
 * Announcements go through a small status line rather than making the whole
 * result a live region: a live region holding a 300-move game would be read
 * out in full on every conversion.
 *
 * A message arrives as a function of the strings rather than as a finished
 * sentence, so it can be rebuilt later in another language. The status line was
 * the one piece of text `applyLanguage` did not translate, so an error announced
 * in English stayed under a `lang="ru"` document, which is the wording a screen
 * reader then reads out with the wrong language's phonemes.
 *
 * Which messages outlive a change of language is `survivesRestatement`'s decision, not
 * this comment's. It used to claim the failures were exactly the survivors because
 * "every error path empties the result first" — which is false of the one error path
 * that deliberately does not, and the guard on re-conversion was built on that false
 * universal. A comment asserting a universal is worse than no comment: the next reader
 * stops checking.
 */
type Message = (strings: UiStrings) => string;

/**
 * `tone` decides how it is drawn; `subject` decides everything else — which region it
 * is said in, and therefore what it means for the file control.
 *
 * These were two arguments and then one, and this is the third arrangement. A separate
 * "is this about the game" flag could contradict the region it travelled with; naming
 * the region alone removed the contradiction but left the subject unstated, so the
 * choice of region was a habit no test could read. Now the call site states the one
 * thing it knows and the rest follows from it.
 *
 * The region is not stored beside them. It is a function of the subject, and holding
 * both let the type describe a save confirmation filed under the file control's
 * description — the very contradiction the paragraph above says naming the region alone
 * removed. It survived one level up: unreachable, because `announce` is the only thing
 * that builds one, but representable. Derived where it is used instead, so it cannot
 * disagree with the subject it came from.
 */
type Announcement = {
  subject: Subject;
  message: Message;
  tone: Tone;
};

const standing = ({ subject, tone }: Announcement): Standing => ({
  tone,
  where: destinationFor(subject),
});

const regionFor = (subject: Subject): Region => REGIONS[destinationFor(subject)];

/**
 * The standing message in each region, rather than one for the page.
 *
 * One variable for two regions is the same mistake this codebase has now made three
 * times — the verdict read from `announcement` instead of the control, the latch kept
 * for an open share sheet — and it reached the language switch. The two regions hold two
 * independent sentences: the field's is the condition of the game the page was given,
 * the notice's is the last event.
 *
 * Pressing save with nothing to save writes a notice, which replaced the page's single
 * standing message while `staleRegions` correctly left the field's sentence alone. A
 * change of language then restated the notice and left the field's sentence sitting in
 * the language she had just switched away from — still the file control's description,
 * still explaining a mark the control was still carrying.
 */
const standingByRegion = new Map<Destination, Announcement>();

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
 * costs nothing on a region that had nothing to clear.
 */
const say = (region: Region, text: string, tone: Tone | null): void => {
  region.node.textContent = text;

  if (tone === null) {
    delete region.node.dataset.tone;
    return;
  }

  region.node.dataset.tone = tone;
};

/**
 * Putting one message where it goes, and nothing else.
 *
 * Split from `render` because restating is not announcing. Restating every standing
 * message in turn through `render` would have the field's restatement supersede the
 * notice beside it — a language change is not an event that makes an older notice untrue.
 */
const draw = (current: Announcement): void => {
  say(regionFor(current.subject), current.message(ui()), current.tone);

  // The field's description is `#status`, which the file control names in
  // `aria-describedby`, so a failure about the game has to mark that control invalid
  // too — otherwise a screen reader reads the message while the control still sounds
  // fine. A message in the notice touches nothing here: the file is neither wrong nor
  // newly right, and a standing mark on a file that failed to parse has to survive a
  // save that had nothing to do with it.
  const invalidity = fieldInvalidity(standing(current));
  if (invalidity !== null) {
    file.setAttribute('aria-invalid', invalidity);
  }
};

const render = (current: Announcement): void => {
  // Emptying the notices that are no longer true, and only those. A polite region
  // reports what appears in it rather than what leaves, so this announces nothing.
  //
  // The field's description is never in this set. It is the condition of the game the
  // page was given rather than an event, and clearing it used to leave a file marked
  // invalid with nothing on the page saying why.
  //
  // A region emptied here is forgotten as well, or a change of language would restate a
  // sentence that has already been superseded and wiped from the page.
  for (const stale of staleRegions(regions, regionFor(current.subject))) {
    say(stale, '', null);
    standingByRegion.delete(stale.kind);
  }

  draw(current);
};

const announce = (subject: Subject, message: Message, tone: Tone = 'info'): void => {
  const current: Announcement = { subject, message, tone };

  standingByRegion.set(destinationFor(subject), current);
  render(current);

  // The same condition that marks the control invalid, asked once rather than restated:
  // a control worth marking is a control worth sending her to.
  if (fieldInvalidity(standing(current)) === 'true') {
    file.focus();
  }
};

/**
 * Re-renders every standing message in the current language. Deliberately not
 * `announce`: moving focus belongs to the failure that caused the message, not to
 * a later change of language. A visitor operating the language control must not
 * be thrown out of it and into the file control.
 *
 * A message that has stopped being true is dropped rather than translated. Restating a
 * failure is restating something still in force; restating "the file has been saved"
 * announces a save that is not happening, which is what the page did until now. It is
 * forgotten as well as cleared, so a second change of language cannot bring it back.
 *
 * Every region rather than the page's last message, because the page can be holding two
 * true sentences at once: a verdict on the file she chose, and a notice about the save
 * she just pressed. Translating only the more recent of the two left the other in the
 * language she had switched away from, and the one it left behind was the file control's
 * own description.
 */
const reannounce = (): void => {
  for (const region of regions) {
    const current = standingByRegion.get(region.kind);

    if (current === undefined) {
      continue;
    }

    if (!survivesRestatement(standing(current))) {
      say(region, '', null);
      standingByRegion.delete(region.kind);
      continue;
    }

    draw(current);
  }
};

/**
 * The file control's description and its mark are a verdict on one particular file. She
 * chooses another, and the verdict is about something she is no longer holding — so it
 * goes when she chooses, rather than standing until the next conversion and telling a
 * screen reader that a file the page has never examined is wrong.
 *
 * The mark is removed rather than set to `'false'`: there is no verdict now, and
 * `'false'` is a verdict — it would claim the new file is good, which nothing checked.
 *
 * Only the game's own message. A notice about the file she saved has nothing to do with
 * the one she is choosing, and clearing it would make picking a file a way to erase an
 * answer she has not read yet.
 *
 * Read from the control itself rather than from what the page last said, and the first
 * attempt at this got it wrong in exactly the way this file's own distinction predicts.
 * The last thing the page *said* may be about the save she just pressed; the control's
 * description is a state that outlives it. So a failed conversion followed by a save
 * leaves the verdict standing while the last announcement is the save's — and asking for
 * the last announcement then reports no verdict to clear. Which is the same mistake as
 * keeping our own flag for an open share sheet: one variable answering for two
 * independent facts.
 *
 * Only the field's standing message is forgotten, so a later change of language cannot
 * restate the verdict — and the notice beside it, which is about something else, keeps
 * both its sentence and its translation.
 */
const forgetTheVerdict = (): void => {
  if (REGIONS.field.node.textContent === '' && !file.hasAttribute('aria-invalid')) {
    return;
  }

  say(REGIONS.field, '', null);
  file.removeAttribute('aria-invalid');
  standingByRegion.delete('field');
};

const showResult = (text: string): void => {
  // textContent only. A player name or comment may contain angle brackets, and
  // nothing from a game file is ever treated as markup.
  result.textContent = text;
  saveButton.setAttribute('aria-disabled', text === '' ? 'true' : 'false');
};

const convert = (): void => {
  const held = record ?? '';

  if (held.trim() === '') {
    showResult('');
    announce('record', (strings) => strings.emptyFile, 'error');
    return;
  }

  try {
    // Read once, then summarised: what the file turned out to be decides what is
    // announced, and the announcement is restated whenever the language changes.
    // Only the summary is captured, so the record itself is free once the text is
    // on the page rather than held for as long as the message stands.
    const converted = sgfToDocument(held);
    const summary = summarise(converted);
    showResult(documentToText(converted, { locale: language.value }));
    announce('record', (strings) => conversionMessage(summary, strings));
  } catch (error) {
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

const applyAddresses = (chosen: string): void => {
  const base = pageBase();

  // The one address, written to both tags. A canonical link and a link-preview address
  // that disagree describe two pages rather than one, so they are the same string here
  // rather than two calls that could come to differ.
  const address = canonicalUrl(base, chosen);

  need<HTMLLinkElement>('link[rel="canonical"]').href = address;
  need<HTMLMetaElement>('meta[property="og:url"]').content = address;

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

  // Out of the tab order, because the paragraph holding it is out of the accessibility
  // tree. A link a keyboard user can reach and a screen reader cannot name is announced
  // as nothing at all — worse than either half on its own. Set here as well as in the
  // HTML, since this function rebuilds the paragraph on every change of language and
  // would otherwise hand the attribute back.
  anchor.tabIndex = -1;

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

  // The heading's tail only. Writing to the heading itself would delete the accent mark
  // drawn inside the name, which is the mistake the share control's label taught this
  // page — and one nobody would see while reading it in English.
  need('#name-suffix').textContent = strings.nameSuffix;
  need('#tagline').textContent = strings.tagline;
  need('#file-label').textContent = strings.fileLabel;
  need('#lang-label').textContent = strings.langLabel;
  need('#input-heading').textContent = strings.inputHeading;
  need('#result-heading').textContent = strings.resultHeading;

  // Hidden from assistive technology and still translated: both paragraphs are on
  // screen, and a visible paragraph left in the language the page is not in is wrong
  // whoever is reading it.
  need('#privacy').textContent = strings.privacy;
  applyCredits(strings);

  saveButton.textContent = strings.save;
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
 * home screen.
 *
 * Each of the two cheap ones is caught rather than merely placed last. "Nothing follows
 * it" was true of this function and false of its caller, where the URL, the cookie and
 * the re-conversion of the game on screen all follow — so a renamed manifest tag left the
 * page declaring one language over a game rendered in the other, with the cookie still
 * holding the language she had just left.
 *
 * A throw in either is our defect, not a condition of the visitor's browser, so
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

  try {
    applyHomeScreenName(strings);
  } catch (error) {
    console.error('The home screen name could not be updated', error);
  }
};

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

  // A game already converted is re-rendered, so the visitor does not have to choose
  // the file again to hear it in another language.
  //
  // Both halves of the condition are load-bearing, and `announcement.ts` holds the
  // reasoning for each: a result on the page is the game worth re-rendering, and a
  // verdict standing on the file control outranks it. `applyVisible` has just restated
  // whatever stands, through `reannounce`, which deliberately does not move focus —
  // converting again instead would run `announce`, mark the control and pull her out of
  // the language control she is operating.
  if (
    reconvertsOnLanguageChange({
      hasResult: result.textContent !== '',
      fileIsMarkedInvalid: file.getAttribute('aria-invalid') === 'true',
    })
  ) {
    convert();
  }
});

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

  // Choosing a file replaces the game the page was given, which retires whatever it
  // last said about the one before. Before the read rather than after it: a file that
  // cannot be read at all would otherwise land a notice on top of a verdict about a
  // different file, and leave that verdict standing.
  forgetTheVerdict();

  chosen
    .text()
    .then((text) => {
      record = text;
      convert();
    })
    .catch(() => {
      // The record is left as it was, along with the result still on the page: nothing
      // here read the new file, so nothing here knows the old game is no longer the one
      // she is looking at. What she is told is that this file could not be read, and
      // the control that took it is where she goes to choose another.
      //
      // And that the previous game is what she is still holding, where it is — because
      // the save control is live and would write that game to her device under a fresh
      // timestamp, which is a substitution she has no way to notice.
      //
      // Asked inside the message rather than captured beside it, so a restatement in
      // another language describes the page as it is then rather than as it was.
      announce('file', (strings) => strings.fileFailed(result.textContent !== ''), 'error');
    });
});

/**
 * The two ways a file can reach her device, built at press time with the file already
 * made. A capability can be granted between one press and the next, and whether a file
 * can be handed to a sheet is a question about that particular file rather than about
 * files in general.
 *
 * The two are detected differently, and they have to be: `SaveCapabilities` in `save.ts`
 * carries the reasoning, beside the type that encodes it. Kept in one place because two
 * copies of an argument rot independently and the next edit updates one of them.
 *
 * What belongs here rather than there is the risk the feature test carries. WebKit
 * reflected `HTMLAnchorElement.download` before it honoured it, so a browser can pass
 * this test and still navigate to the blob — announcing a file that was never written,
 * on a page replaced by unlabelled text. That is the change's headline risk and it is
 * unsettled: it wants checking on her own device, and inverting the branch order on iOS
 * is the remedy if it turns out to bite.
 */
const TEXT_FILE = 'text/plain;charset=utf-8';

const saveCapabilities = ({ name, text }: { name: string; text: string }): SaveCapabilities => {
  const capabilities: SaveCapabilities = {};

  if ('download' in HTMLAnchorElement.prototype) {
    capabilities.download = (): void => {
      const address = URL.createObjectURL(new Blob([text], { type: TEXT_FILE }));

      try {
        const anchor = document.createElement('a');
        anchor.href = address;
        anchor.download = name;

        // In the document for the click. A detached anchor works in current browsers and
        // did not always, and the cost of not finding out which one she is holding is one
        // append and one removal in the same task.
        //
        // Firefox is the browser that required it: a synthetic click on an anchor outside
        // the document started no download at all, silently, which is this page's worst
        // shape of failure.
        document.body.append(anchor);

        try {
          anchor.click();
        } finally {
          anchor.remove();
        }
      } finally {
        // Revoked on a later task. Revoking in this one cancels the download in Safari,
        // which is the browser this page is most read in.
        //
        // In a `finally` because `saveTheText` treats this closure as all-or-nothing and
        // falls through to the sheet when it throws. Scheduling the revoke only on the
        // way out of a successful run leaked the address for the rest of the visit on
        // every fall-through.
        window.setTimeout(() => {
          URL.revokeObjectURL(address);
        }, 0);
      }
    };
  }

  // Built only where it can be used. This was constructed unconditionally, above the
  // test that decides whether anything will take it — so a browser with no share sheet
  // paid for a second copy of a 300-move game on every press, and a throw from either
  // this line or the test destroyed the link branch that had already been built and
  // would have worked.
  //
  // Typed like the blob, charset included. It was bare `text/plain` here, and a share
  // target that takes the type at its word reads her Russian as latin-1 — the same
  // mojibake the download branch was careful to prevent, through the branch that had no
  // such note.
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    try {
      const saved = new File([text], name, { type: TEXT_FILE });

      if (navigator.canShare({ files: [saved] })) {
        capabilities.share = async (): Promise<void> => {
          // The file alone: no title, no text. A target offered both may take the string
          // and drop the file, which is the whole of what she pressed the control for.
          await navigator.share({ files: [saved] });
        };
      }
    } catch (error) {
      // `canShare` has shipped ahead of file support, and a browser that dislikes a
      // `files` member throws rather than answering false. Reported, and the link branch
      // above is left standing.
      console.error('The sheet branch could not be prepared', error);
    }
  }

  return capabilities;
};

/**
 * The one thing the page can say when a press has led nowhere, and it is reached from
 * four places: a capability that would not build, the outcome that reports its own
 * failure, an outcome the union does not yet know about, and a promise that broke the
 * contract `save.ts` documents.
 *
 * Written once because the sentence is the whole of what is left — it tells her the text
 * is still on the page and how to take it from there — and four copies of it are four
 * chances for one of them to become a different account of the same dead end.
 */
const announceSaveFailure = (): void => {
  announce('result', (strings) => strings.saveFailed, 'error');
};

saveButton.addEventListener('click', () => {
  const text = result.textContent ?? '';

  if (text === '') {
    // The button stays focusable while there is nothing to save, so say why rather
    // than doing nothing when it is pressed.
    announce('result', (strings) => strings.nothingToSave, 'error');
    return;
  }

  // Computed once and used twice, for the file and for the sentence naming it. Computing
  // it again for the announcement would name a file one minute off the one written,
  // whenever a press straddles a minute — and the name is her only handle on the file.
  const name = downloadName(new Date());

  // Built inside the guarantee that she is told something, rather than as an argument to
  // it. Evaluated in the call, this ran before any promise existed, so the backstop below
  // could not see it throw — and a throw from here left the click handler with nothing
  // said in either region. Silence is the one outcome she cannot investigate, and it was
  // reachable only once she had a conversion, which is the moment it matters most.
  let capabilities: SaveCapabilities;

  try {
    capabilities = saveCapabilities({ name, text });
  } catch (error) {
    console.error('The save capabilities could not be built', error);
    announceSaveFailure();
    return;
  }

  saveTheText(capabilities).then(
    (outcome) => {
      if (outcome === 'cancelled' || outcome === 'busy') {
        // She closed the sheet, or one she opened is still standing. Nothing has
        // happened yet, and saying anything would report an outcome that has not.
        return;
      }

      if (outcome === 'saved') {
        announce('result', (strings) => strings.savedToDevice(name));
        return;
      }

      if (outcome === 'shared') {
        // Not the same sentence as a file written to her downloads: the two end up in
        // different places and she cannot look to find out which.
        announce('result', (strings) => strings.handedToSheet(name));
        return;
      }

      if (outcome === 'failed') {
        // Drawn in the failure colour, but said in the notice: the file she chose is not
        // what failed, so it is not marked invalid and does not take focus. The message
        // names the text still on the page, which is all the page has left to offer.
        announceSaveFailure();
        return;
      }

      // A sixth outcome is a compile error here rather than a sentence chosen by a
      // fall-through. The union is the whole vocabulary of what she is told, so the one
      // place that decides what she hears is the place that has to be made to face a new
      // member — an outcome that ought to be silent would otherwise be announced as a
      // failure, which is the mistake `save.ts` exists to prevent, one level up.
      const unanswered: never = outcome;
      void unanswered;
      announceSaveFailure();
    },
    () => {
      // `saveTheText` is documented never to reject, and this is the backstop for that
      // promise being broken: silence is the one outcome a blind visitor cannot
      // detect, so something is always said.
      //
      // The second argument to `then` rather than a `catch` chained after it. Chained, it
      // also caught a throw from the handler above — so a file that had been written was
      // announced as a save that failed, sending her to look for the text on the page
      // instead of the file on her device.
      announceSaveFailure();
    },
  );
});

restoreLanguage();
applyLanguage();
