import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./lib/toast";
import { IS_DEMO } from "./config";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

// Offline support: production only (the demo never caches, so switching modes is instant).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (!IS_DEMO && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`).catch(() => {});
    } else {
      // Switched back to demo: remove any offline copy left from production.
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    }
  });
}
