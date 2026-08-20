import type { Locale, LocaleId } from '../locale.ts';
import { ru } from './ru.ts';
import { en } from './en.ts';

const LOCALES: Record<LocaleId, Locale> = { ru, en };

/** The locales this build supports, in the order they should be offered. */
export const LOCALE_IDS: LocaleId[] = ['ru', 'en'];

export const DEFAULT_LOCALE: LocaleId = 'ru';

export const isLocaleId = (id: string): id is LocaleId =>
  Object.prototype.hasOwnProperty.call(LOCALES, id);

export const getLocale = (id: string): Locale => {
  if (!isLocaleId(id)) {
    throw new Error(`Unknown language "${id}". Supported languages: ${LOCALE_IDS.join(', ')}`);
  }

  return LOCALES[id];
};
