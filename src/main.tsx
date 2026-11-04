import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./app.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ToastProvider } from "./components/Toast.tsx";
import { VoltProvider } from "./context/VoltContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <VoltProvider>
          <App />
        </VoltProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
