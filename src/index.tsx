import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

console.log('index.tsx loaded');
const root = document.getElementById("root");
console.log('root element:', root);
if (root) {
  console.log('creating root...');
  try {
    createRoot(root).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering App:', error);
  }
}