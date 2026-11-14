import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "../src/index.css";
import ManageUrlPage from "../src/pages/ManageUrlPage";
import PublicUrl from "../src/pages/PublicUrl";
import GetAllLinks from "../src/pages/GetAllLinks";
import NotificationPage from "../src/pages/NotificationPage";
import axiosApi from "../src/config/axiosApi";

// This harness is served only by the test Vite server and is excluded from builds.
// Authentication is synthetic only in server/test/helpers.ts, never in production.
axiosApi.defaults.headers.common["x-test-owner"] = "browser-owner";
const params = new URLSearchParams(window.location.search);
const view = params.get("view") ?? "manage";
const slug = params.get("slug") ?? "";
const initial =
  view === "public"
    ? `/l/${slug}`
    : view === "dashboard"
      ? "/get-all"
      : `/manage/${slug}`;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastContainer />
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/manage/:slug" element={<ManageUrlPage />} />
        <Route path="/l/:slug" element={<PublicUrl />} />
        <Route path="/get-all" element={<GetAllLinks />} />
        <Route path="/notifications/:action" element={<NotificationPage />} />
      </Routes>
    </MemoryRouter>
  </StrictMode>,
);
