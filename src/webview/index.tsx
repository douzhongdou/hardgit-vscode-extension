import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./viewer-layout.css";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Missing #root container for hardgit webview.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
