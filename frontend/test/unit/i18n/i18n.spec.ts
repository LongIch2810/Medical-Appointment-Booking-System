import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, setAppLanguage } from '@/i18n';
import vi from '@/i18n/locales/vi';
import en from '@/i18n/locales/en';

describe('i18n infrastructure and language switching', () => {
  beforeEach(() => {
    localStorage.clear();
    setAppLanguage('vi');
  });

  it('defaults to Vietnamese ("vi") if localStorage is empty', () => {
    expect(i18n.language).toBe('vi');
    expect(document.documentElement.lang).toBe('vi');
    expect(i18n.t('nav.home')).toBe('Trang chủ');
  });

  it('switches to English and persists in localStorage and html lang attribute', async () => {
    await setAppLanguage('en');
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(i18n.t('nav.home')).toBe('Home');
  });

  it('falls back to "vi" when an unsupported language is passed to setAppLanguage', async () => {
    await setAppLanguage('fr' as never);
    expect(i18n.language).toBe('vi');
    expect(document.documentElement.lang).toBe('vi');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('vi');
  });

  it('contains matching top-level namespace keys between vi and en translation dictionaries', () => {
    const viKeys = Object.keys(vi).sort();
    const enKeys = Object.keys(en).sort();
    expect(viKeys).toEqual(enKeys);
    expect(SUPPORTED_LANGUAGES).toEqual(['vi', 'en']);
  });

  it('contains matching child keys across all primary namespaces in vi and en dictionaries', () => {
    const namespaces = Object.keys(vi) as (keyof typeof vi)[];
    for (const ns of namespaces) {
      if (typeof vi[ns] === 'object' && vi[ns] !== null) {
        const viChildKeys = Object.keys(vi[ns]).sort();
        const enChildKeys = Object.keys(en[ns]).sort();
        expect(viChildKeys).toEqual(enChildKeys);
      }
    }
  });
});
