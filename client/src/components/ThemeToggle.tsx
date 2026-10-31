import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/store/ThemeStore";

export default function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const Icon = mode === "system" ? Monitor : mode === "dark" ? Moon : Sun;
  return (
    <label className="relative flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-secondary-background pl-2.5 text-muted-foreground transition-colors hover:text-foreground">
      <Icon size={14} aria-hidden="true" />
      <select
        aria-label="Color theme"
        value={mode}
        onChange={(event) => setMode(event.target.value as ThemeMode)}
        className="h-full appearance-none rounded-lg bg-transparent pr-7 text-xs outline-none focus-visible:outline-offset-2"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-2"
        aria-hidden="true"
      />
    </label>
  );
}
