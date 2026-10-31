import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./Router";
import ThemeProvider from "./components/ThemeProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </StrictMode>,
);
