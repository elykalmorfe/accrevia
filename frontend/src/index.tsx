import "./index.css";
import "./styles/dark.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { applyTheme } from "./hooks/useTheme";
import { initializeAuthStore } from "./utils/auth";

applyTheme();
initializeAuthStore().catch((error) => console.error("Failed to initialize the account store", error));

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App viewAs="Superadmin" />);
}