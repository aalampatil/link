import { ClerkProvider } from "@clerk/react";
import { Outlet } from "react-router-dom";
import { useThemeStore } from "@/store/ThemeStore";

export default function ClerkRoutes() {
  const dark = useThemeStore((state) => state.resolvedTheme === "dark");
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: dark ? "#fafafa" : "#18181b",
          colorPrimaryForeground: dark ? "#18181b" : "#ffffff",
          colorBackground: dark ? "#111113" : "#ffffff",
          colorForeground: dark ? "#fafafa" : "#18181b",
          colorMutedForeground: dark ? "#a1a1aa" : "#71717a",
          colorInput: dark ? "#18181b" : "#ffffff",
          colorInputForeground: dark ? "#fafafa" : "#18181b",
          colorNeutral: dark ? "#fafafa" : "#18181b",
          fontFamily: '"Geist Variable", sans-serif',
          borderRadius: "0.65rem",
        },
        elements: {
          cardBox: "shadow-none w-full",
          card: "shadow-none border border-border",
          rootBox: "w-full",
          footer: "bg-muted",
        },
      }}
    >
      <Outlet />
    </ClerkProvider>
  );
}
