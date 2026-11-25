import { describe, expect, it } from "vitest";
import { createFight } from "../../src/fight/engine/createFight";
import { tick } from "../../src/fight/engine/tick";
import { EMPTY_INPUT, MAX_HEALTH, type FighterId, type FightState, type InputBits } from "../../src/fight/engine/types";

type Keys = Partial<InputBits>;
const downForward = [{ down: true }, { down: true, right: true }, { right: true }];
const fireball = [...downForward, { hp: true }];
const kickBack = [{ down: true }, { down: true, left: true }, { left: true, lk: true }];
const punchBack = [{ down: true }, { down: true, left: true }, { left: true, lp: true }];
const superPunch = [...downForward, ...downForward, { hp: true }];

function duel(p1: FighterId, distance: number, p2: FighterId = "Garen"): FightState {
  const state = createFight({ p1, p2, versus: "local", aiDifficulty: "normal" });
  state.phase = "fight";
  state.fighters[1].x = state.fighters[0].x + distance;
  return state;
}

function play(state: FightState, inputs: Keys[], frames: number, defense: Keys = {}) {
  const damage: number[] = [];
  let returning = false;
  let launched = false;
  for (let frame = 0; frame < frames; frame++) {
    const health = state.fighters[1].health;
    state = tick(state, { ...EMPTY_INPUT, ...inputs[frame] }, { ...EMPTY_INPUT, ...defense });
    if (health > state.fighters[1].health) damage.push(health - state.fighters[1].health);
    if (state.projectiles.some((shot) => shot.returningLeg)) returning = true;
    if (state.fighters[1].y > 1) launched = true;
  }
  return { state, damage, returning, launched };
}

describe("同屏交手", () => {
  it.each(["lp", "hp", "hk"] as const)("两侧同帧的 %s 同时命中", (key) => {
    let state = duel("Garen", 60);
    const press = { ...EMPTY_INPUT, [key]: true };
    state = tick(state, press, press);
    state = play(state, [], 40).state;
    expect(state.fighters[0].health).toBeLessThan(MAX_HEALTH);
    expect(state.fighters[0].health).toBe(state.fighters[1].health);
  });

  it("后下能挡普通攻击，投技破防，起跳能躲投", () => {
    const crouchBlock = { down: true, right: true };
    const grab = [{ lp: true, lk: true }];
    const start = duel("Garen", 60);
    expect(play(start, [{ lp: true }], 20, crouchBlock).damage).toEqual([]);
    expect(play(start, grab, 20, crouchBlock).damage).toEqual([120]);
    expect(play(start, grab, 20, { up: true }).damage).toEqual([]);
  });
});

describe("英雄招牌招式", () => {
  it("欺诈宝珠去程命中即结束；落空后可以在回程截到对手", () => {
    const hit = play(duel("Ahri", 180), fireball, 100);
    expect(hit.damage).toEqual([70]);
    expect(hit.returning).toBe(false);
    const missed = play(duel("Ahri", 650), fireball, 60);
    expect(missed.damage).toEqual([]);
    expect(missed.returning).toBe(true);
    missed.state.fighters[1].x = missed.state.fighters[0].x + 230;
    expect(play(missed.state, [], 35).damage).toEqual([70]);
  });

  it("宝珠命中后可在收招中接超必，超必命中不能取消进自身", () => {
    let state = duel("Ahri", 90);
    state.fighters[0].meter = 250;
    state = play(state, fireball, 22).state;
    expect(state.fighters[0].moveId).toBe("orb");
    expect(state.fighters[0].hitConnect).toBe(true);
    state = play(state, superPunch, 22).state;
    expect(state.fighters[0].moveId).toBe("soul");
    expect(state.fighters[0].hitConnect).toBe(true);
    const meter = state.fighters[0].meter;
    state = play(state, superPunch, superPunch.length).state;
    expect(state.fighters[0].meter).toBe(meter);
  });

  it("盖伦审判和死亡莲华按段命中；卡特需支付一格气", () => {
    expect(play(duel("Garen", 60), kickBack, 60).damage).toEqual([28, 28, 28]);
    const state = duel("Katarina", 60);
    state.fighters[0].meter = 100;
    const cast = play(state, superPunch, superPunch.length);
    expect(cast.state.fighters[0].meter).toBe(0);
    expect(play(cast.state, [], 90).damage).toEqual([40, 40, 40, 40, 40, 40]);
  });

  it("致命打击可以挥空，防守方能在盖伦收剑时出重拳反击", () => {
    let state = duel("Garen", 185, "Ahri");
    const strike = [{ down: true }, { down: true, right: true }, { right: true, hp: true }];
    let punishedDuringRecovery = false;
    for (let frame = 0; frame < 55; frame++) {
      const [garen, defender] = state.fighters;
      const recovering = garen.moveId === "strike" && garen.poseFrame >= 14;
      let defense: Keys = {};
      if (recovering) defense = defender.x - garen.x > 146 ? { left: true } : { hp: true };
      state = tick(state, { ...EMPTY_INPUT, left: frame > 12, ...strike[frame] }, { ...EMPTY_INPUT, ...defense });
      if (recovering && state.fighters[0].health < garen.health) punishedDuringRecovery = true;
    }
    expect(state.fighters[1].health).toBe(MAX_HEALTH);
    expect(punishedDuringRecovery).toBe(true);
  });

  it("斩钢闪命中两次后下一次出风，击飞远端对手并清空层数", () => {
    let state = duel("Yasuo", 65);
    for (let stack = 1; stack <= 2; stack++) {
      state = play(state, fireball, 50).state;
      expect(state.fighters[0].yasuoStacks).toBe(stack);
    }
    state.fighters[1].x = state.fighters[0].x + 280;
    const wind = play(state, fireball, 70);
    expect(wind.damage).toEqual([70]);
    expect(wind.launched).toBe(true);
    expect(wind.state.fighters[0].yasuoStacks).toBe(0);
  });

  it("李青的天音波仅在命中时标记，回音击消耗标记追到远端", () => {
    const start = duel("LeeSin", 300);
    expect(play(start, fireball, 55, { right: true }).state.fighters[1].leeMarked).toBe(0);
    expect(play(start, kickBack, 55).damage).toEqual([]);
    const marked = play(start, fireball, 55).state;
    expect(marked.fighters[1].leeMarked).toBeGreaterThan(0);
    const followup = play(marked, kickBack, 40);
    expect(followup.state.fighters[1].leeMarked).toBe(0);
    expect(followup.damage).toEqual([90]);
  });

  it("拉克丝光束覆盖前方远端，伊泽瑞尔的秘术射击可远距命中，锤石命中会拉近", () => {
    const lux = duel("Lux", 760);
    lux.fighters[0].meter = 100;
    expect(play(lux, superPunch, 60).damage).toEqual([280]);
    expect(play(duel("Ezreal", 460), fireball, 70).damage).toEqual([65]);
    const hook = play(duel("Thresh", 260), fireball, 70);
    expect(hook.damage).toEqual([80]);
    expect(hook.state.fighters[1].x - hook.state.fighters[0].x).toBeLessThan(170);
  });

  it("拉克丝光缚命中才定身；卡特瞬步能跨过拳脚距离接近命中", () => {
    const lux = duel("Lux", 160);
    expect(play(lux, punchBack, 38).state.fighters[1].crumple).toBeGreaterThan(0);
    expect(play(lux, punchBack, 50, { down: true, right: true }).state.fighters[1].crumple).toBe(0);
    const kat = duel("Katarina", 140);
    expect(play(kat, [{ lp: true }], 30).damage).toEqual([]);
    expect(play(kat, kickBack, 40).damage).toEqual([45]);
  });
});
