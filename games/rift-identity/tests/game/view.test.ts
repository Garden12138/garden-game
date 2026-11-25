import { describe, expect, it } from "vitest";
import { viewFor } from "../../src/game/engine/view";
import { createMatch } from "../../src/game/engine/createMatch";
import { pickAll } from "./helpers";

describe("viewFor", () => {
  it("hides another player's real hand kinds", () => {
    const state = pickAll(createMatch(11));
    const viewer = state.currentPlayer;
    const other = (viewer + 1) % state.players.length;
    state.players[other]!.hand = [
      { id: "secret", kind: "heal", suit: "heart", rank: 7 },
    ];
    const view = viewFor(state, viewer);
    expect(view.players[other]!.hand[0]!.kind).toBe("strike");
    expect(view.players[other]!.hand[0]!.rank).toBe(0);
    expect(view.players[viewer]!.hand.length).toBe(state.players[viewer]!.hand.length);
  });
});

it("keeps the viewer's private role and withholds the deal and other players' options", () => {
  const state = createMatch(46);
  const id = state.players.find((seat) => seat.identity === "shadow")!.id;
  const view = viewFor(state, id);
  expect(view.players[id]!.identity).toBe("shadow");
  expect(view.players[id]!.candidates).toHaveLength(3);
  expect(view.players.filter((p) => p.id !== id).every((p) => p.candidates.length === 0)).toBe(true);
  expect(view.prompt.message).toBe("等待选将");
  expect(view.config.seed).toBe(0);
  expect(state.config.seed).toBe(46);
});
