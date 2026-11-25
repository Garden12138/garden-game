import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../../src/ygo/ai/chooseAction";
import { createDuel } from "../../src/ygo/engine/createDuel";
import type { DuelState } from "../../src/ygo/engine/types";
import { legalActions } from "../../src/ygo/engine/legal";
import { reduce } from "../../src/ygo/engine/reduce";
import { duel } from "./helpers";

function playThroughTurn(initial: DuelState, turn: number): DuelState {
  let state = initial;
  for (let step = 0; state.winner === null && state.turn <= turn; step++) {
    if (step >= 150) throw new Error("AI did not finish its turn");
    state = reduce(state, chooseAiAction(state));
  }
  return state;
}

describe("ygo ai", () => {
  it("always returns a currently legal action", () => {
    let state = duel("overlay", "piltover");
    state.players[1].controller = "ai";
    for (let i = 0; i < 30; i += 1) {
      if (state.phase === "gameOver") break;
      const actions = legalActions(state);
      if (actions.length === 0) break;
      const action = chooseAiAction(state);
      expect(actions).toContainEqual(action);
      state = reduce(state, action);
    }
  });

  it("keeps its attacker on an empty board instead of flashing it back to hand", () => {
    let state = createDuel({ seed: 4, p0DeckId: "demacia", p1DeckId: "piltover" });
    for (let i = 0; i < 3; i++) state = reduce(state, { type: "nextPhase" });
    state = playThroughTurn(state, 2);
    expect(state.players[0].lp).toBeLessThan(4000);
    expect(state.players[1].gy.some((c) => c.defId === "flash")).toBe(false);
  });

  it("uses Garen's equipment to contest a stronger fusion without repeatedly activating it", () => {
    const state = playThroughTurn(createDuel({ seed: 1649, p0DeckId: "piltover", p1DeckId: "demacia" }), 2);
    const garen = state.players[1].monsters.find((c) => c?.defId === "garen");
    expect(garen).toBeTruthy();
    expect(state.players[1].spells.some((c) => c?.defId === "infinityEdge" && c.equippedTo === garen!.uid)).toBe(true);
    expect(state.log.filter((entry) => entry === "对手发动 无尽之刃")).toHaveLength(1);
  });

  it("uses burn and fusion without tributing its stronger monster for Syndra", () => {
    const state = playThroughTurn(createDuel({ seed: 16844, p0DeckId: "piltover", p1DeckId: "shadow", firstPlayer: 1 }), 1);
    expect(state.players[1].monsters.some((c) => c?.defId === "shadowTwin")).toBe(true);
    expect(state.players[1].hand.some((c) => c.defId === "syndra")).toBe(true);
    expect(state.players[0].lp).toBe(700);
  });

  it("chooses Noxus removal for a blocker and burn when the two materials finish the duel", () => {
    const state = createDuel({ seed: 61, p0DeckId: "piltover", p1DeckId: "noxus", firstPlayer: 1 });
    const player = state.players[1];
    const field = player.hand.filter((c) => c.defId === "draven" || c.defId === "swain");
    player.hand = player.hand.filter((c) => !field.includes(c));
    player.monsters.splice(0, 2, ...field);
    const foe = state.players[0];
    const jinx = foe.hand.find((c) => c.defId === "jinx")!;
    foe.hand = foe.hand.filter((c) => c !== jinx);
    foe.monsters[0] = jinx;
    expect(chooseAiAction(state)).toMatchObject({ type: "xyzSummon", extraId: "noxusReign" });
    foe.lp = 1500;
    expect(chooseAiAction(state)).toMatchObject({ type: "xyzSummon", extraId: "noxusBlades" });
    expect(playThroughTurn(state, 1).winner).toBe(1);
  });

  it("develops two level-four monsters before spending removal on the campaign defender", () => {
    let state = createDuel({ seed: 226, p0DeckId: "piltover", p1DeckId: "noxus" });
    for (let step = 0; step < 70 && !state.chain.some((link) => link.defId === "noxusReign"); step++) {
      state = reduce(state, chooseAiAction(state));
    }
    const jinx = state.players[0].monsters.find((c) => c?.defId === "jinx");
    expect(jinx).toBeTruthy();
    expect(state.chain.at(-1)).toMatchObject({ defId: "noxusReign", targets: [jinx!.uid] });
    const block = chooseAiAction(state);
    const shield = state.players[0].spells.find((c) => c?.defId === "barrier");
    expect(block).toMatchObject({ type: "activate", uid: shield?.uid, targets: [jinx!.uid] });
  });

  it("passes up a losing battle and does not change its target based on a face-down identity", () => {
    const state = duel("piltover", "demacia");
    const vi = state.players[0].hand.shift()!;
    state.players[0].monsters[0] = vi;
    const garen = state.players[1].hand.shift()!;
    state.players[1].monsters[0] = garen;
    state.phase = "battle";
    expect(chooseAiAction(state)).toEqual({ type: "nextPhase" });
    garen.face = "down";
    garen.position = "def";
    const choice = chooseAiAction(state);
    garen.defId = "chogath";
    expect(chooseAiAction(state)).toEqual(choice);
  });
});
