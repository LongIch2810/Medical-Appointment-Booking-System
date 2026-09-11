import { applyStoredTheme, applyTheme, THEME_STORAGE_KEY } from '@/utils/theme';

describe('theme utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('applies and persists an explicit dark theme', () => {
    applyTheme('DARK');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('DARK');
  });

  it('falls back to the system theme for an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'UNKNOWN');
    applyStoredTheme();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('SYSTEM');
  });
});
