import { ClerkProvider } from "@clerk/react";
import { Outlet } from "react-router-dom";

const ClerkRoutes = () => (
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      variables: { colorPrimary: "#18181b", fontFamily: '"Geist Variable", sans-serif', borderRadius: "0.65rem" },
      elements: { cardBox: "shadow-none w-full", card: "shadow-none border border-zinc-200", rootBox: "w-full", footer: "bg-zinc-50" },
    }}
  >
    <Outlet />
  </ClerkProvider>
);

export default ClerkRoutes;
