import { cloneState } from "./helpers";
import type { GameCard, GameState, PlayerId } from "./types";

function hiddenCard(card: GameCard): GameCard {
  return { ...card, kind: "strike", suit: "spade", rank: 0 };
}

export function viewFor(state: GameState, viewer: PlayerId): GameState {
  const view = cloneState(state);
  if (state.phase !== "gameOver") {
    view.config.seed = 0;
    view.rngSeed = 0;
    view.rngState = 0;
  }
  if (state.prompt.actor !== viewer) {
    view.prompt.legalCardIds = [];
    if (state.phase === "pick") view.prompt.message = "等待选将";
  }
  view.deck = state.deck.map((card, index) => hiddenCard({ ...card, id: `deck-${index}` }));
  for (const seat of view.players) {
    const revealIdentity =
      seat.id === viewer ||
      seat.identity === "baron" ||
      !seat.alive ||
      state.phase === "gameOver" ||
      state.config.mode !== "identity";
    if (!revealIdentity) {
      seat.identity = "vanguard";
    }
    if (seat.id !== viewer) {
      seat.candidates = [];
      seat.hand = seat.hand.map((card, index) => hiddenCard({ ...card, id: `hidden-${seat.id}-${index}` }));
    }
  }
  return view;
}
