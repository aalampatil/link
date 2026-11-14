import { lazy, Suspense, type ReactNode } from "react";
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
const NotificationPage = lazy(() => import("./pages/NotificationPage"));

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-sm text-muted-foreground">Loading...</div>
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
          { path: "notifications/:action", element: withSuspense(<NotificationPage />) },
          {
            path: "manage/:slug",
            element: withSuspense(
              <ProtectedRoute>
                <ManageUrlPage />
              </ProtectedRoute>,
            ),
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
        path: "sign-in/*",
        element: withSuspense(<SignInPage />),
      },
      {
        path: "sign-up/*",
        element: withSuspense(<SignUpPage />),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
