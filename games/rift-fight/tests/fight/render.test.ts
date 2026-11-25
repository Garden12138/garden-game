import { describe, expect, it } from "vitest";
import { createFight } from "../../src/fight/engine/createFight";
import { EMPTY_INPUT } from "../../src/fight/engine/types";
import { drawPuppet } from "../../src/fight/puppet/renderPuppet";
import { drawMatch } from "../../src/fight/render/drawMatch";

// Capture geometry and labels without requiring an installed canvas backend in jsdom.
function recordCanvas() {
  const calls: Array<[string, ...unknown[]]> = [];
  const ctx = new Proxy({}, {
    get(_, name: string) {
      if (name === "createLinearGradient") return () => ({ addColorStop() {} });
      return (...args: unknown[]) => calls.push([name, ...args]);
    },
    set(_, name: string, value) {
      calls.push([name, value]);
      return true;
    },
  }) as CanvasRenderingContext2D;
  return { ctx, calls };
}

function mirror() {
  return createFight({ p1: "Garen", p2: "Garen", versus: "local", aiDifficulty: "normal" });
}

describe("格斗动作与席位辨识", () => {
  it("低扫与轻拳在实际生效高度伸展，致命打击的起手与后摇使用不同姿势", () => {
    const fighter = mirror().fighters[0];
    function frameOf(moveId: string, poseFrame: number) {
      const { ctx, calls } = recordCanvas();
      drawPuppet(ctx, { ...fighter, pose: "attack", poseFrame, moveId }, 0, 400, new Map(), 0, 0, EMPTY_INPUT);
      return calls;
    }
    const extendsInto = (calls: ReturnType<typeof frameOf>, minReach: number, bottom: number, top: number) =>
      calls.some(([name, x, y]) => name === "lineTo" && typeof x === "number" && x >= minReach &&
        typeof y === "number" && -y >= bottom && -y <= top);
    expect(extendsInto(frameOf("2hk", 9), 90, 4, 34)).toBe(true);
    expect(extendsInto(frameOf("5lp", 3), 60, 92, 120)).toBe(true);
    expect(frameOf("strike", 2)).not.toEqual(frameOf("strike", 20));
  });

  it("同英雄贴身换边后，两个标签仍跟随各自玩家且互不遮挡", () => {
    const state = mirror();
    const xFor = (p1: number, p2: number) => {
      state.fighters[0].x = p1;
      state.fighters[1].x = p2;
      const { ctx, calls } = recordCanvas();
      drawMatch(ctx, state, new Map(), 800, 600);
      return ["P1", "P2"].map(label =>
        Number(calls.find(([name, text]) => name === "fillText" && text === label)?.[2]),
      ) as [number, number];
    };
    const [leftP1, rightP2] = xFor(500, 505);
    const [rightP1, leftP2] = xFor(505, 500);
    expect(rightP2 - leftP1).toBeGreaterThan(38);
    expect(rightP1 - leftP2).toBeGreaterThan(38);
  });
});
