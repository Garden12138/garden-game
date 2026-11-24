import { useState } from "react";
import { GameApp } from "./game/ui/GameApp";

export function App() {
  const [session, setSession] = useState(0);
  return <GameApp key={session} onExit={() => setSession((value) => value + 1)} />;
}
