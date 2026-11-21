export type Theme = 'dark' | 'light'

export const THEME_KEY = 'preppilots.theme.v1'

/** Read the persisted theme choice (defaults to the cinematic dark theme). */
export function loadTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'dark'
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(theme: Theme): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked — the theme simply will not persist */
  }
}

/** Apply the theme to the document root so every CSS token switches at once. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}
