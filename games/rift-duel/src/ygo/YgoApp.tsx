import { useEffect, useState } from "react";
import { chooseAiAction } from "./ai/chooseAction";
import { createDuel } from "./engine/createDuel";
import { reduce } from "./engine/reduce";
import type { Action, DuelState } from "./engine/types";
import { DuelScreen } from "./ui/DuelScreen";
import { LobbyScreen } from "./ui/LobbyScreen";
import { ResultScreen } from "./ui/ResultScreen";

export function YgoApp() {
  const [deckId, setDeckId] = useState("piltover");
  const [state, setState] = useState<DuelState | null>(null);

  const begin = () => {
    const next = createDuel({
      seed: Date.now() % 1_000_000,
      p0DeckId: deckId,
      p1DeckId: deckId === "piltover" ? "shadow" : "piltover",
      p0Controller: "human",
      p1Controller: "ai",
    });
    setState(next);
  };

  useEffect(() => {
    if (!state || state.phase === "gameOver") return;
    if (state.players[state.prompt.actor]?.controller !== "ai") return;
    const frame = window.requestAnimationFrame(() => {
      setState((current) => {
        if (!current || current.phase === "gameOver") return current;
        if (current.players[current.prompt.actor]?.controller !== "ai") return current;
        return reduce(current, chooseAiAction(current));
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state]);

  const onAct = (action: Action) => {
    setState((current) => (current ? reduce(current, action) : current));
  };

  if (!state) {
    return <LobbyScreen deckId={deckId} onDeck={setDeckId} onStart={begin} />;
  }

  if (state.phase === "gameOver") {
    return (
      <ResultScreen
        state={state}
        onRematch={begin}
        onLobby={() => setState(null)}
      />
    );
  }

  return <DuelScreen state={state} onAct={onAct} onExit={() => setState(null)} />;
}
