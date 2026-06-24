import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./components/AuthProvider";
import { AppRouter } from "./router/AppRouter";
import "./styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found in DOM");

ReactDOM.createRoot(rootEl).render(
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);