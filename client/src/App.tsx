import { useLayoutEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { ToastContainer } from "react-toastify";
import { attachTokenInterceptor } from "./config/axiosApi";
import { useAuth } from "@clerk/react";
import axiosApi from "./config/axiosApi";

function App() {
  const { isLoaded, getToken } = useAuth();
  const getTokenRef = useRef<typeof getToken | null>(null);

  // always keep ref in sync, no effect re-runs
  getTokenRef.current! = getToken;

  useLayoutEffect(() => {
    if (!isLoaded) return;

    const interceptorId = attachTokenInterceptor(
      () => getTokenRef.current?.() ?? Promise.resolve(null),
    );

    return () => {
      axiosApi.interceptors.request.eject(interceptorId);
    };
  }, [isLoaded]); // only fires once when clerk finishes loading

  return (
    <>
      <ToastContainer
        position="bottom-right"
        theme="light"
        toastStyle={{
          fontFamily: "inherit",
          fontSize: "14px",
          borderRadius: "10px",
        }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
        >
          Skip to content
        </a>
        <Header />

        <div id="main-content" className="flex flex-1 flex-col">
          <Outlet />
        </div>

        <Footer />
      </div>
    </>
  );
}

export default App;
