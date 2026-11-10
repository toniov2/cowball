import i18next from 'i18next';
import { ru } from './ru';
import { en } from './en';

export const SUPPORTED = ['ru', 'en'] as const;

export async function initI18n(lang: string) {
  const lng = (SUPPORTED as readonly string[]).includes(lang) ? lang : 'ru';
  await i18next.init({
    lng,
    fallbackLng: 'ru',
    resources: { ru: { translation: ru }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return i18next;
}
export const t = (key: string, opts?: Record<string, unknown>): string => i18next.t(key, opts ?? {});
