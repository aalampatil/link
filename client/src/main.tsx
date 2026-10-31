import { lazy, StrictMode, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const App = lazy(() => import("./App"));
const ClerkRoutes = lazy(() => import("./config/ClerkRoutes"));
const ProtectedRoute = lazy(() => import("./config/Protected"));
const Homepage = lazy(() => import("./pages/Homepage"));
const GenerateLink = lazy(() => import("./pages/GenerateLink"));
const PublicUrl = lazy(() => import("./pages/PublicUrl"));
const ManageUrlPage = lazy(() => import("./pages/ManageUrlPage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const GetAllLinks = lazy(() => import("./pages/GetAllLinks"));

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <div className="border-4 border-border bg-secondary-background px-6 py-4 font-heading shadow-shadow">
      Loading...
    </div>
  </div>
);

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={pageFallback}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    element: withSuspense(<ClerkRoutes />),
    children: [
      {
        path: "/",
        element: withSuspense(<App />),
        children: [
          {
            path: "",
            index: true,
            element: withSuspense(<Homepage />),
          },
          {
            path: "create-link",
            element: withSuspense(
              <ProtectedRoute>
                <GenerateLink />
              </ProtectedRoute>,
            ),
          },
          {
            path: "l/:slug",
            element: withSuspense(<PublicUrl />),
          },
          {
            path: "manage/:slug",
            element: withSuspense(<ManageUrlPage />),
          },
          {
            path: "get-all",
            element: withSuspense(
              <ProtectedRoute>
                <GetAllLinks />
              </ProtectedRoute>,
            ),
          },
        ],
      },
      {
        path: "sign-in",
        element: withSuspense(<SignInPage />),
      },
      {
        path: "sign-up",
        element: withSuspense(<SignUpPage />),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
