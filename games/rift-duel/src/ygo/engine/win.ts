import { sideName } from "./helpers";
import type { DuelState, PlayerId } from "./types";

export function applyWinCheck(state: DuelState): DuelState {
  if (state.winner !== null) {
    state.phase = "gameOver";
    state.prompt = { kind: "free", actor: state.turnPlayer };
    return state;
  }
  for (const player of state.players) {
    if (player.lp <= 0) {
      state.winner = player.id === 0 ? 1 : 0;
      state.winReason = "lp";
      state.phase = "gameOver";
      state.log.push(`${sideName(player.id)}的生命归零`);
      return state;
    }
  }
  return state;
}

export function loseByDeckout(state: DuelState, player: PlayerId): DuelState {
  state.winner = player === 0 ? 1 : 0;
  state.winReason = "deckout";
  state.phase = "gameOver";
  state.log.push(`${sideName(player)}的卡组抽空`);
  return state;
}
