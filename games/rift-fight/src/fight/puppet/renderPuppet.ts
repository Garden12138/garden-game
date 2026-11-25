import { getFighterDef } from "../data/roster";
import { findMove } from "../engine/combat";
import { holdingBack } from "../engine/input";
import type { Fighter, InputBits, MoveDef } from "../engine/types";

export type ArtMap = Map<string, HTMLImageElement>;
export const SEAT_COLORS = ["#75ebdf", "#ffd18a"] as const;
const INK = "#101e29";
type Point = [number, number];

function polygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string, edge?: string, weight = 2) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = weight;
    ctx.stroke();
  }
}

function limb(ctx: CanvasRenderingContext2D, start: Point, joint: Point, end: Point, color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(...start);
  ctx.lineTo(...joint);
  ctx.lineTo(...end);
  ctx.strokeStyle = INK;
  ctx.lineWidth = width + 4;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function blade(ctx: CanvasRenderingContext2D, hand: Point, tip: Point, accent: string) {
  const dx = tip[0] - hand[0];
  const dy = tip[1] - hand[1];
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const base: Point = [hand[0] + dx * 0.16, hand[1] + dy * 0.16];
  polygon(ctx, [[base[0] + nx * 7, base[1] + ny * 7], tip, [base[0] - nx * 7, base[1] - ny * 7]], "#dbe6e6", INK);
  polygon(ctx, [base, tip, [base[0] + nx * 6, base[1] + ny * 6]], "#86a8b3");
  limb(ctx, [base[0] + nx * 11, base[1] + ny * 11], base, [base[0] - nx * 11, base[1] - ny * 11], accent, 4);
}

function attackExtension(frame: number, move: MoveDef): number {
  if (frame < move.startup) return -0.35 * (frame + 1) / Math.max(1, move.startup);
  if (frame < move.startup + move.active) return 1;
  const remaining = 1 - (frame - move.startup - move.active + 1) / Math.max(1, move.recovery);
  return Math.max(0, remaining) * 0.55;
}

function drawFace(ctx: CanvasRenderingContext2D, fighter: Fighter, x: number, y: number, seat: string, art: ArtMap) {
  const shape: Point[] = [[x - 13, y - 16], [x + 8, y - 18], [x + 17, y - 7], [x + 14, y + 10], [x + 4, y + 17], [x - 12, y + 9]];
  polygon(ctx, shape, "#e1caab", seat, 3);
  const image = art.get(fighter.id);
  if (image) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(image, x - 18, y - 20, 38, 40);
    ctx.restore();
  } else {
    polygon(ctx, [[x - 14, y - 15], [x + 7, y - 18], [x + 16, y - 7], [x + 2, y - 8], [x - 12, y + 5]], "#343e51");
    polygon(ctx, [[x + 5, y - 2], [x + 15, y - 3], [x + 11, y + 1]], INK);
  }
}

export function drawPuppet(
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  cameraX: number,
  groundY: number,
  art: ArtMap,
  side: 0 | 1,
  frame: number,
  input: InputBits,
): void {
  const def = getFighterDef(fighter.id);
  const seat = SEAT_COLORS[side];
  const move = fighter.moveId ? findMove(fighter, fighter.moveId) : undefined;
  const attack = move && ["attack", "throw", "special", "super"].includes(fighter.pose) ? move : undefined;
  const extension = attack ? attackExtension(fighter.poseFrame, attack) : 0;
  const live = !!attack && fighter.poseFrame >= attack.startup && fighter.poseFrame < attack.startup + attack.active;
  const recovering = !!attack && fighter.poseFrame >= attack.startup + attack.active;
  const low = attack?.height === "low";
  const overhead = attack?.height === "overhead";
  const strike = fighter.id === "Garen" && attack?.id === "strike";
  const guarding = fighter.pose === "block" || fighter.blockstun > 0 ||
    (fighter.pose === "walk" && fighter.y <= 1 && holdingBack(input, fighter.facing));
  const crouched = (guarding && input.down) || fighter.pose === "crouch" || attack?.id.startsWith("2");
  const hurt = fighter.hitstun > 0 || fighter.pose === "crumple";
  const down = fighter.pose === "knockdown" || fighter.pose === "ko";
  const height = def.height * (crouched ? 0.65 : 1);
  const stride = fighter.pose === "walk" ? Math.sin(frame * 0.23) : 0;
  const lean = hurt ? -13 : guarding ? -8 : strike && recovering ? 14 : extension * 12;
  const hip: Point = [lean * 0.35, -height * 0.47];
  const shoulder: Point = [lean + 3, -height * 0.74 + Math.abs(stride) * 2];
  const head: Point = [shoulder[0] + 2, shoulder[1] - 21];
  const foot: Point = [23 + stride * 15, -5 - (fighter.y > 3 ? 16 : Math.max(0, -stride) * 5)];
  const knee: Point = [24 + stride * 7, hip[1] * 0.52];
  const hand: Point = [28, shoulder[1] + 20];
  const elbow: Point = [8, shoulder[1] + 29];
  const reach = attack ? attack.hitbox.x + attack.hitbox.w * 0.90 : 0;
  const targetY = attack ? -(attack.hitbox.y + attack.hitbox.h * 0.5) : 0;
  if (low) {
    foot[0] += extension * (reach - foot[0]);
    foot[1] = live ? targetY : foot[1] - Math.abs(extension) * 18;
    knee[0] = hip[0] + (foot[0] - hip[0]) * 0.52 + (extension < 0 ? 10 : 0);
    knee[1] = live ? targetY - 8 : knee[1] - Math.abs(extension) * 14;
  } else if (guarding) {
    hand[0] = head[0] + 20;
    hand[1] = head[1] + 3;
    elbow[0] = shoulder[0] + 31;
  } else if (attack) {
    hand[0] += extension * ((strike ? 51 : reach) - hand[0]);
    hand[1] += Math.max(0, extension) * (targetY - hand[1]);
    if (overhead && extension < 0) hand[1] -= 45;
    if (strike && extension < 0) hand[1] = head[1] + 8;
    if (strike && recovering) hand[1] += 18;
    elbow[0] = (shoulder[0] + hand[0]) / 2 - (extension < 0 ? 20 : 0);
    elbow[1] = (shoulder[1] + hand[1]) / 2 + (live ? 2 : 16);
  }

  ctx.save();
  ctx.translate(fighter.x - cameraX, groundY - fighter.y);
  ctx.scale(fighter.facing, 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (down) ctx.rotate(-1.15);

  if (fighter.id === "Ahri") {
    for (let i = 0; i < 3; i++) {
      const wave = Math.sin(frame * 0.07 + i) * 3;
      const tailTip: Point = [-48 - i * 7, hip[1] - 45 + i * 25 + wave];
      polygon(ctx, [[hip[0] - 4, hip[1] + 6], [-40, hip[1] + 14 + i * 4], tailTip, [-27, hip[1] - 2 + i * 7]], i === 1 ? "#a7bbd0" : "#d7e2e8", INK);
    }
  }
  limb(ctx, hip, [-17 - stride * 8, hip[1] * 0.54], [-23 - stride * 15, -5 - (fighter.y > 3 ? 22 : 0)], "#34495b", 11);
  limb(ctx, hip, knee, foot, seat, 10);
  limb(ctx, [foot[0] - 2, foot[1]], foot, [foot[0] + 8, foot[1]], "#dce6e4", 8);
  const back: Point = [shoulder[0] - 19, shoulder[1]];
  const backHem: Point = [hip[0] - 24, hip[1] + 12];
  const torso: Point[] = [back, [shoulder[0] + 14, shoulder[1] - 2], [hip[0] + 13, hip[1] - 3], [hip[0] + 24, hip[1] + 18], backHem];
  polygon(ctx, torso, def.color, seat, 3);
  polygon(ctx, [back, [shoulder[0] - 4, shoulder[1] + 8], [hip[0] + 5, hip[1] - 2], backHem], "#253849");
  polygon(ctx, [[hip[0] - 15, hip[1] - 5], [hip[0] + 13, hip[1] - 9], [hip[0] + 14, hip[1] - 3], [hip[0] - 16, hip[1] + 1]], "#dec891");
  if (fighter.id === "Ahri") {
    polygon(ctx, [[head[0] - 14, head[1] - 7], [head[0] - 21, head[1] - 34], [head[0] - 1, head[1] - 15]], "#efc9d4", INK);
    polygon(ctx, [[head[0] + 2, head[1] - 12], [head[0] + 10, head[1] - 30], [head[0] + 16, head[1] - 9]], "#f5dce1", INK);
  }
  drawFace(ctx, fighter, head[0], head[1], seat, art);
  if (fighter.id === "Garen") {
    polygon(ctx, [[shoulder[0] - 22, shoulder[1]], [shoulder[0] - 14, shoulder[1] - 9], [shoulder[0] + 2, shoulder[1] - 8], [shoulder[0] + 12, shoulder[1] + 6], [shoulder[0] - 17, shoulder[1] + 10]], "#c4ac72", INK);
    if (strike || !attack) {
      let tip: Point = [hand[0] + 12, hand[1] - 61];
      if (strike && live) tip = [reach, targetY - 10];
      else if (strike && recovering) tip = [hand[0] + 47, hand[1] + 35];
      else if (strike) tip = [hand[0] - 34, hand[1] - 62];
      blade(ctx, hand, tip, "#e6c77e");
      if (strike && live) {
        ctx.beginPath();
        ctx.moveTo(tip[0] - 40, tip[1] - 48);
        ctx.quadraticCurveTo(tip[0] + 3, tip[1] - 26, tip[0], tip[1]);
        ctx.strokeStyle = "#fff1c3";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  }
  limb(ctx, shoulder, elbow, hand, seat, 8);
  if (guarding) {
    const x = head[0] + 30;
    const y = shoulder[1] + 4;
    polygon(ctx, [[x - 4, y - 25], [x + 11, y - 16], [x + 8, y + 13], [x - 3, y + 23]], fighter.blockstun > 0 ? "#e2ffff" : "#36768a", "#8deee4");
  }
  if (fighter.invuln > 0) {
    ctx.strokeStyle = "#f6eac4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(head[0], head[1], 24, -2.7, -0.35);
    ctx.stroke();
  }
  ctx.restore();
}
