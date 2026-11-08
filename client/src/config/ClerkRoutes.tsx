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
          colorPrimary: dark ? "#ffffff" : "#000000",
          colorPrimaryForeground: dark ? "#000000" : "#ffffff",
          colorBackground: dark ? "#000000" : "#ffffff",
          colorForeground: dark ? "#ffffff" : "#000000",
          colorMutedForeground: dark ? "#ffffff" : "#000000",
          colorInput: dark ? "#000000" : "#ffffff",
          colorInputForeground: dark ? "#ffffff" : "#000000",
          colorNeutral: dark ? "#ffffff" : "#000000",
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
