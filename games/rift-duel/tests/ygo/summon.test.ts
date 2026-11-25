import { describe, expect, it } from "vitest";
import { createDuel, MAIN_SIZE, START_HAND, START_LP } from "../../src/ygo/engine/createDuel";
import { legalActions } from "../../src/ygo/engine/legal";
import { act, duel, must } from "./helpers";

describe("createDuel", () => {
  it("starts with 20 cards, 5 in hand, 4000 LP, first turn skip draw", () => {
    const state = duel();
    expect(state.players[0].lp).toBe(START_LP);
    expect(state.players[0].hand.length).toBe(START_HAND);
    expect(state.players[0].deck.length + state.players[0].hand.length).toBe(MAIN_SIZE);
    expect(state.turnPlayer).toBe(0);
    expect(state.phase).toBe("main1");
    expect(state.log.some((line) => line.includes("跳过抽卡"))).toBe(true);
  });

  it("gives the opponent the opening turn and draws for the player on the next turn", () => {
    let state = createDuel({ seed: 16844, p0DeckId: "piltover", p1DeckId: "shadow", firstPlayer: 1 });
    expect(state.prompt.actor).toBe(1);
    expect(state.players[1].hand).toHaveLength(5);
    expect(state.log[0]).toContain("对手先攻");
    for (let i = 0; i < 3; i++) state = act(state, { type: "nextPhase" });
    expect(state.turnPlayer).toBe(0);
    expect(state.players[0].hand).toHaveLength(6);
    expect(state.log.at(-1)).toBe("你抽卡");
  });

  it("keeps the identity of a set card out of the public log", () => {
    let state = duel();
    state = act(state, must(state, (a) => a.type === "setMonster"));
    expect(state.log.at(-1)).toBe("你盖放了 1 只怪兽");
    state = act(state, { type: "nextPhase" });
    state = act(state, { type: "nextPhase" });
    state = act(state, { type: "nextPhase" });
    const spell = state.players[1].hand[0]!;
    spell.defId = "barrier";
    state = act(state, must(state, (a) => a.type === "setSpellTrap" && a.uid === spell.uid));
    expect(state.log.at(-1)).toBe("对手盖放了 1 张魔法或陷阱");
  });
});

describe("summon", () => {
  it("normal summons a level 4 monster", () => {
    const state = duel();
    const summon = must(state, (action) => action.type === "normalSummon");
    const next = act(state, summon);
    expect(next.players[0].monsters.some((card) => card !== null)).toBe(true);
    expect(next.normalSummonUsed).toBe(true);
    expect(legalActions(next).some((action) => action.type === "normalSummon")).toBe(false);
  });

  it("requires tribute for a level 6 monster", () => {
    let state = duel("shadow", "demacia");
    const first = must(state, (action) => action.type === "normalSummon");
    state = act(state, first);
    for (let i = 0; i < 6; i += 1) {
      state = act(state, { type: "nextPhase" });
    }
    expect(state.turnPlayer).toBe(0);
    const tribute = legalActions(state).find(
      (action) => action.type === "normalSummon" && action.tributes.length === 1,
    );
    expect(tribute).toBeTruthy();
    if (!tribute || tribute.type !== "normalSummon") return;
    const next = act(state, tribute);
    expect(next.players[0].gy.length).toBeGreaterThanOrEqual(1);
    expect(next.players[0].monsters.filter(Boolean)).toHaveLength(1);
  });
});
