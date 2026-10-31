import { useEffect, type ReactNode } from "react";
import { parseTheme, themeStorageKey, useThemeStore } from "@/store/ThemeStore";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => useThemeStore.getState().syncSystem();
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === localStorage &&
        (event.key === themeStorageKey || event.key === null)
      ) {
        useThemeStore.getState().setMode(parseTheme(event.newValue));
      }
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return children;
}
