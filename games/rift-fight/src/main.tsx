import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FightApp } from "./fight/FightApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FightApp />
  </StrictMode>,
);
