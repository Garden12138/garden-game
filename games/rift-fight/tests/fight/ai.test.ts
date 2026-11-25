import { describe, expect, it } from "vitest";
import { chooseAiInputs } from "../../src/fight/ai/chooseInputs";
import { createFight } from "../../src/fight/engine/createFight";
import { tick } from "../../src/fight/engine/tick";
import { EMPTY_INPUT, INTRO_FRAMES, MAX_HEALTH } from "../../src/fight/engine/types";

describe("格斗 AI", () => {
  it("在可行动帧给出按键位图", () => {
    const state = createFight({ p1: "Ahri", p2: "Garen", versus: "ai", aiDifficulty: "normal" });
    state.phase = "fight";
    state.frame = 8;
    const input = chooseAiInputs(state, { ...EMPTY_INPUT });
    expect(input).toEqual(expect.objectContaining({
      left: expect.any(Boolean),
      right: expect.any(Boolean),
      lp: expect.any(Boolean),
    }));
  });

  it.each(["Garen", "Yasuo", "Thresh"] as const)("普通 %s 从默认站位接近并主动命中", (opponent) => {
    let state = createFight({ p1: "Ahri", p2: opponent, versus: "ai", aiDifficulty: "normal" });
    for (let frame = 0; frame < INTRO_FRAMES + 360 && state.fighters[0].health === MAX_HEALTH; frame++) {
      state = tick(state, EMPTY_INPUT, EMPTY_INPUT);
    }
    expect(state.fighters[0].health).toBeLessThan(MAX_HEALTH);
    expect(state.fighters[1].x).toBeLessThan(550);
  });
});
