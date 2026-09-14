import React, { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");


const root = ReactDOM.createRoot(rootElement);

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary Fallback for production crashes
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            color: "white",
            textAlign: "center",
            background: "#000",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Cairo",
          }}
        >
          <h1 style={{ color: "#ef4444" }}>⚠️ حدث خطأ في تشغيل الظل</h1>
          <p style={{ opacity: 0.5, marginTop: "10px" }}>
            {this.state.error?.message || "خطأ غير معروف"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "white",
              color: "black",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    // Explicitly access props via any cast to resolve TypeScript error
    return (this as any).props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
