import { getFighterDef } from "./roster";
import type { FighterId, VersusKind } from "../engine/types";

export const FIGHT_TITLE = "峡谷格斗";
export const FIGHT_SUBTITLE = "SUMMONER'S DUEL";

export type Seat = "p1" | "p2";

export function seatLabel(seat: Seat, versus: VersusKind) {
  if (seat === "p1") return "P1";
  return versus === "local" ? "P2" : "CPU";
}

export const SEAT_CONTROLS = {
  p1: "A / D 移动，W 跳，S 蹲。J / K 轻拳、轻脚，U / I 重拳、重脚。",
  p2: "方向键移动、跳、蹲。[ / ] 轻拳、轻脚，; / ' 重拳、重脚。也可用小键盘 4 / 5 / 1 / 2。",
};

const guides: Record<FighterId, { tip: string; signature: string }> = {
  Ahri: { tip: "拉开距离放宝珠，去程落空时留意折返的路线。", signature: "orb" },
  Garen: { tip: "看准距离沿地面逼近，用致命打击追砍正在收招的对手。", signature: "strike" },
  Yasuo: { tip: "用剑尖刺中两次，下一次斩钢闪会放出击飞对手的旋风。", signature: "steel" },
  Lux: { tip: "留在对手的拳脚之外，用光缚定身，再跟进攻击。", signature: "bind" },
  LeeSin: { tip: "先用天音波标记对手，再用回音击追上去。", signature: "sonic" },
  Katarina: { tip: "先用飞刀试探，等对手收招时用瞬步突进抢攻。", signature: "shunpo" },
  Ezreal: { tip: "在远处用秘术射击打断接近的对手，给自己留出退路。", signature: "mystic" },
  Thresh: { tip: "等对手露出空当，出钩把人拉近，再用拳脚压住起身。", signature: "hook" },
};

export function fighterGuide(id: FighterId, seat: Seat, facing: 1 | -1, versus: VersusKind) {
  const def = getFighterDef(id);
  const guide = guides[id];
  const move = def.specials.find((special) => special.id === guide.signature);
  if (!move) throw new Error(`找不到 ${def.name} 的招牌技 ${guide.signature}`);

  const cpu = seatLabel(seat, versus) === "CPU";
  const letterKeys = seat === "p1";
  const left = letterKeys ? "A" : "←";
  const right = letterKeys ? "D" : "→";
  const down = letterKeys ? "S" : "↓";
  const forward = facing === 1 ? right : left;
  const back = facing === 1 ? left : right;
  const directions: Record<string, string> = {
    "1": down + "+" + back,
    "2": down,
    "3": down + "+" + forward,
    "4": back,
    "6": forward,
  };
  const punch = cpu ? "拳" : letterKeys ? "J" : "[";
  const kick = cpu ? "脚" : letterKeys ? "K" : "]";
  const button = move.button === "K" ? kick : punch;
  const steps = Array.from(move.motion, (dir) => directions[dir]);
  steps[steps.length - 1] += "+" + button;
  return { tip: guide.tip, name: move.name, keys: steps.join(" › ") };
}
