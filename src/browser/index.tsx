import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";
import "../webview/styles.css";
import "../webview/viewer-layout.css";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Missing #root container for hardgit browser preview.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
