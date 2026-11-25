import { describe, expect, it } from "vitest";
import { legalActions } from "../../src/ygo/engine/legal";
import { act, duel, moveToHand, must, passBoth } from "./helpers";

describe("battle", () => {
  it("deals direct damage when the opponent has no monsters", () => {
    let state = duel();
    state = act(state, must(state, (action) => action.type === "normalSummon"));
    state = act(state, { type: "nextPhase" });
    const attack = must(state, (action) => action.type === "attack" && action.targetUid === "direct");
    state = act(state, attack);
    state = passBoth(state);
    expect(state.players[1].lp).toBeLessThan(4000);
  });

  it("destroys a defense-position monster without piercing", () => {
    let state = duel();
    state = act(state, must(state, (action) => action.type === "setMonster"));
    for (let i = 0; i < 3; i += 1) state = act(state, { type: "nextPhase" });
    state = act(state, must(state, (action) => action.type === "normalSummon"));
    state = act(state, { type: "nextPhase" });
    const lp = state.players[0].lp;
    const attack = must(state, (action) => action.type === "attack");
    state = act(state, attack);
    state = passBoth(state);
    expect(state.players[0].monsters.every((card) => card === null)).toBe(true);
    expect(state.players[0].lp).toBe(lp);
  });
});

describe("zhonya", () => {
  it("negates an attack when activated in the respond window", () => {
    let state = moveToHand(duel(), 0, "zhonya");
    const set = must(
      state,
      (action) =>
        action.type === "setSpellTrap" &&
        state.players[0].hand.some((card) => card.uid === action.uid && card.defId === "zhonya"),
    );
    state = act(state, must(state, (action) => action.type === "normalSummon"));
    state = act(state, set);
    for (let i = 0; i < 3; i += 1) state = act(state, { type: "nextPhase" });
    state = act(state, must(state, (action) => action.type === "normalSummon"));
    state = act(state, { type: "nextPhase" });
    const lp = state.players[0].lp;
    const attack = must(state, (action) => action.type === "attack");
    state = act(state, attack);
    const zhonya = legalActions(state).find((action) => action.type === "activate");
    expect(zhonya).toBeTruthy();
    if (zhonya) state = act(state, zhonya);
    state = passBoth(state);
    expect(state.players[0].lp).toBe(lp);
    expect(legalActions(state).some((action) => action.type === "attack")).toBe(false);
  });
});

it("does not reactivate a resolved equipment and drops it when its monster leaves", () => {
  let state = moveToHand(duel(), 0, "infinityEdge");
  state = act(state, must(state, (a) => a.type === "normalSummon"));
  const edge = state.players[0].hand.find((c) => c.defId === "infinityEdge")!;
  state = passBoth(act(state, must(state, (a) => a.type === "activate" && a.uid === edge.uid)));
  expect(state.players[0].spells.some((c) => c?.uid === edge.uid && c.equippedTo)).toBe(true);
  expect(legalActions(state).some((a) => a.type === "activate" && a.uid === edge.uid)).toBe(false);
  const target = state.players[0].monsters.find((c) => c !== null)!;
  const flash = state.players[0].hand[0]!;
  flash.defId = "flash";
  state = passBoth(act(state, must(state, (a) => a.type === "activate" && a.uid === flash.uid && a.targets[0] === target.uid)));
  expect(state.players[0].gy.some((c) => c.uid === edge.uid)).toBe(true);
});
