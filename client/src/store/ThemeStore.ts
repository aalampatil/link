import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
export const themeStorageKey = "deadlink-theme";

export function parseTheme(value: string | null): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}
function readPreference(): ThemeMode {
  try {
    return parseTheme(localStorage.getItem(themeStorageKey));
  } catch {
    return "system";
  }
}
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;
}
function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#09090b" : "#ffffff");
}

type ThemeState = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  syncSystem: () => void;
};
const initialMode = readPreference();
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolvedTheme: resolveTheme(initialMode),
  setMode: (mode) => {
    const resolvedTheme = resolveTheme(mode);
    applyTheme(resolvedTheme);
    set({ mode, resolvedTheme });
    try {
      localStorage.setItem(themeStorageKey, mode);
    } catch {
      /* Keep the choice for this session when storage is unavailable. */
    }
  },
  syncSystem: () => {
    const resolvedTheme = resolveTheme(get().mode);
    applyTheme(resolvedTheme);
    set({ resolvedTheme });
  },
}));
