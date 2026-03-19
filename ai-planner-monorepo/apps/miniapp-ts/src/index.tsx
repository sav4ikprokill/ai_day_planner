import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return <div>Mini App scaffold is ready</div>;
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}