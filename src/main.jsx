import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initInteraction } from "./enhancements/interaction.js";
import { initPersonMentions } from "./enhancements/person-mentions.js";
import { initSuccessFeedback } from "./enhancements/success-feedback.js";
import { initTreePan } from "./enhancements/tree-pan.js";
import "./styles/paper.css";
import "./styles/garden.css";
import "./styles/case-workspace.css";
import "./styles/interaction.css";
import "./styles/success-feedback.css";
import "./styles/ink-theme.css";

initInteraction();
initPersonMentions();
initSuccessFeedback();
initTreePan();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
