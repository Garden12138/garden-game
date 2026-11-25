import { useEffect, useLayoutEffect, useState } from "react";
import { chooseAiAction } from "./ai/chooseAction";
import {
  CAMPAIGN_DECK_ID,
  CAMPAIGN_PROGRESS_KEY,
  CAMPAIGN_STAGES,
  readCampaignProgress,
  recordCampaignWin,
} from "./data/campaign";
import { createDuel } from "./engine/createDuel";
import { legalActions, reduce } from "./engine/reduce";
import type { Action, DuelState } from "./engine/types";
import { DuelScreen } from "./ui/DuelScreen";
import { LobbyScreen } from "./ui/LobbyScreen";
import { ResultScreen } from "./ui/ResultScreen";

function playAction(state: DuelState, action: Action): DuelState {
  let next = reduce(state, action);
  while (next.phase !== "gameOver" && next.prompt.kind === "respond") {
    const options = legalActions(next);
    const only = options[0];
    if (options.length !== 1 || only?.type !== "respondPass") break;
    next = reduce(next, only);
  }
  return next;
}

export function YgoApp() {
  const [deckId, setDeckId] = useState("piltover");
  const [state, setState] = useState<DuelState | null>(null);
  const [progress, setProgress] = useState(readCampaignProgress);
  const [stageIndex, setStageIndex] = useState(-1);
  const stage = CAMPAIGN_STAGES[stageIndex];
  const cleared = stage && state?.winner === 0 ? stageIndex + 1 : 0;
  const unlocked = Math.max(progress, cleared);
  const screen = !state ? "lobby" : state.phase === "gameOver" ? "result" : "duel";

  useLayoutEffect(() => {
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }, [screen]);

  useEffect(() => {
    if (cleared > 0) {
      const saved = recordCampaignWin(cleared);
      setProgress((previous) => Math.max(previous, saved));
    }
  }, [cleared]);

  useEffect(() => {
    function syncProgress(event: StorageEvent) {
      if (event.key === CAMPAIGN_PROGRESS_KEY) {
        const saved = readCampaignProgress();
        setProgress((previous) => Math.max(previous, saved));
      }
    }
    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  const beginFreeDuel = () => {
    setStageIndex(-1);
    setState(createDuel({
      seed: Date.now() % 1_000_000,
      p0DeckId: deckId,
      p1DeckId: deckId === "piltover" ? "shadow" : "piltover",
    }));
  };

  const beginChallenge = (id: string) => {
    const index = CAMPAIGN_STAGES.findIndex((item) => item.id === id);
    const challenge = CAMPAIGN_STAGES[index];
    if (!challenge || index > unlocked) return;
    setStageIndex(index);
    setState(createDuel({
      seed: challenge.seed,
      p0DeckId: CAMPAIGN_DECK_ID,
      p1DeckId: challenge.opponentDeckId,
      firstPlayer: challenge.firstPlayer,
    }));
  };

  useEffect(() => {
    if (!state || state.phase === "gameOver") return;
    if (state.players[state.prompt.actor].controller !== "ai") return;
    const timer = window.setTimeout(() => {
      setState((current) => current === state ? playAction(state, chooseAiAction(state)) : current);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state]);

  const onAct = (action: Action) => {
    if (!state || state.players[state.prompt.actor].controller !== "human") return;
    setState((current) => current === state ? playAction(state, action) : current);
  };

  if (!state) {
    return (
      <LobbyScreen
        deckId={deckId}
        onDeck={setDeckId}
        onStart={beginFreeDuel}
        campaignProgress={unlocked}
        onChallenge={beginChallenge}
      />
    );
  }

  if (state.phase === "gameOver") {
    const next = cleared > 0 ? CAMPAIGN_STAGES[stageIndex + 1] : undefined;
    return (
      <ResultScreen
        state={state}
        stage={stage}
        onNext={next ? () => beginChallenge(next.id) : undefined}
        onRematch={stage ? () => beginChallenge(stage.id) : beginFreeDuel}
        onLobby={() => setState(null)}
      />
    );
  }

  return (
    <DuelScreen
      state={state}
      encounterName={stage?.name}
      objective={stage?.objective}
      onAct={onAct}
      onExit={() => setState(null)}
    />
  );
}
