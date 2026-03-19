import React from "react";
import ReactDOM from "react-dom/client";
import { Global, css } from "@emotion/react";
import { App } from "./App";

const globalStyles = css`
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    min-height: 100%;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    background: #0b1020;
    color: #f3f4f6;
  }

  body {
    min-height: 100vh;
  }

  button,
  input {
    font: inherit;
  }
`;

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Global styles={globalStyles} />
    <App />
  </React.StrictMode>,
);