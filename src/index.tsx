import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { bootstrapPlatform } from "./services/platform";

const root = document.getElementById("root");
if (root) {
  try {
    void bootstrapPlatform();
    createRoot(root).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
  }
}
