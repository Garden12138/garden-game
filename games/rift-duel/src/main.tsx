import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { YgoApp } from "./ygo/YgoApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <YgoApp />
  </StrictMode>,
);
