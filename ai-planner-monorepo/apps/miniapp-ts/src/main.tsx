import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

window.Telegram?.WebApp?.ready();
window.Telegram?.WebApp?.expand();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
