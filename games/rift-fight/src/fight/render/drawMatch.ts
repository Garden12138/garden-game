import { STAGE } from "../data/stages";
import { getFighterDef } from "../data/roster";
import { seatLabel } from "../data/copy";
import { findMove } from "../engine/combat";
import type { Fighter, FightState, Projectile } from "../engine/types";
import { drawPuppet, SEAT_COLORS, type ArtMap } from "../puppet/renderPuppet";

export function drawStage(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const ground = height * 0.72;
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, STAGE.skyTop);
  sky.addColorStop(1, "#365c63");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#243f4c";
  ctx.beginPath();
  ctx.moveTo(0, ground);
  for (const [x, y] of [[0, 0.54], [0.16, 0.37], [0.28, 0.53], [0.47, 0.29], [0.69, 0.52], [0.82, 0.36], [1, 0.55]] as const) {
    ctx.lineTo(width * x, height * y);
  }
  ctx.lineTo(width, ground);
  ctx.fill();
  for (const x of [0.14 * width, 0.86 * width]) {
    ctx.save();
    ctx.translate(x, ground);
    const unit = Math.min(width / 1000, height / 700);
    ctx.scale(unit, unit);
    ctx.fillStyle = "#263d46";
    ctx.fillRect(-17, -85, 34, 85);
    ctx.fillStyle = "#38515a";
    ctx.fillRect(-24, -90, 48, 10);
    ctx.fillRect(-24, -13, 48, 13);
    ctx.beginPath();
    ctx.moveTo(0, -129);
    ctx.lineTo(11, -105);
    ctx.lineTo(0, -91);
    ctx.lineTo(-11, -105);
    ctx.closePath();
    ctx.fillStyle = "#568985";
    ctx.fill();
    ctx.restore();
  }

  const lane = ctx.createLinearGradient(0, ground, 0, height);
  lane.addColorStop(0, "#35514c");
  lane.addColorStop(1, "#101e25");
  ctx.fillStyle = lane;
  ctx.fillRect(0, ground, width, height - ground);
  ctx.fillStyle = "#677660";
  ctx.fillRect(0, ground, width, 3);
  ctx.strokeStyle = "rgba(157, 186, 169, 0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let index = -2; index <= 2; index++) {
    ctx.moveTo(width * (0.5 + index * 0.15), ground + 3);
    ctx.lineTo(width * (0.5 + index * 0.33), height);
  }
  ctx.moveTo(0, ground + (height - ground) * 0.39);
  ctx.lineTo(width, ground + (height - ground) * 0.39);
  ctx.stroke();
}

function drawProjectile(ctx: CanvasRenderingContext2D, shot: Projectile, cameraX: number, groundY: number, color: string) {
  ctx.save();
  ctx.translate(shot.x - cameraX, groundY - shot.y);
  ctx.scale(shot.vx < 0 ? -1 : 1, 1);
  ctx.globalAlpha = shot.delay > 0 ? 0.45 : 1;
  ctx.fillStyle = color;
  if (shot.beam) {
    ctx.fillRect(-shot.w / 2, -shot.h / 2, shot.w, shot.h);
    ctx.fillStyle = "#f4ffed";
    ctx.fillRect(-shot.w / 2, -shot.h / 8, shot.w, shot.h / 4);
  } else if (shot.returning) {
    const radius = shot.h * 0.5;
    const light = shot.returningLeg ? "#ffd3f1" : "#a0f9fb";
    ctx.strokeStyle = light;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-radius * 3, -radius * 0.6);
    ctx.quadraticCurveTo(-radius, -radius * 0.9, 0, -radius * 0.2);
    ctx.moveTo(-radius * 2.5, radius * 0.6);
    ctx.quadraticCurveTo(-radius, radius * 0.9, 0, radius * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = light;
    ctx.fill();
    ctx.strokeStyle = shot.returningLeg ? "#ad5fbb" : "#4899b0";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(radius * 0.25, -radius * 0.2, radius * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, shot.w / 2, shot.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e0f4ef";
    ctx.stroke();
  }
  ctx.restore();
}

function contactEffect(ctx: CanvasRenderingContext2D, fighter: Fighter, attacker: Fighter, x: number, footY: number, crouched: boolean) {
  if (fighter.blockstun <= 0 && fighter.hitstun <= 0) return;
  const guarded = fighter.blockstun > 0 && fighter.hitstun <= 0;
  const height = getFighterDef(fighter.id).height * (crouched ? 0.65 : 1);
  const move = attacker.hitConnect && attacker.moveId ? findMove(attacker, attacker.moveId) : undefined;
  const impactHeight = move && !move.projectile
    ? Math.max(10, Math.min(height, attacker.y - fighter.y + move.hitbox.y + move.hitbox.h / 2))
    : height * 0.60;
  ctx.save();
  ctx.translate(x + fighter.facing * 25, footY - impactHeight);
  ctx.scale(fighter.facing, 1);
  ctx.globalAlpha = Math.min(1, (guarded ? fighter.blockstun : fighter.hitstun) / 6);
  ctx.beginPath();
  if (guarded) {
    ctx.strokeStyle = "#c3fff5";
    ctx.lineWidth = 3;
    for (const r of [20, 28]) {
      ctx.moveTo(Math.cos(-0.95) * r, Math.sin(-0.95) * r);
      ctx.arc(0, 0, r, -0.95, 0.95);
    }
    ctx.stroke();
  } else {
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const r = i % 2 ? 5 : i % 4 ? 15 : 24;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#ffdfa4";
    ctx.fill();
    ctx.strokeStyle = "#a86136";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSeatLabels(ctx: CanvasRenderingContext2D, state: FightState, cameraX: number, groundY: number, scale: number) {
  const anchors = state.fighters.map((f) => ({
    x: (f.x - cameraX) * scale,
    y: (groundY - f.y - getFighterDef(f.id).height - 11) * scale,
  }));
  const [a, b] = anchors;
  if (!a || !b) return;
  const crowded = Math.abs(a.x - b.x) < 60 && Math.abs(a.y - b.y) < Math.max(32, 100 * scale);
  const middle = (a.x + b.x) / 2;
  for (const side of [0, 1] as const) {
    const anchor = anchors[side]!;
    const left = a.x === b.x ? side === 0 : anchor.x < middle;
    const x = crowded ? middle + (left ? -31 : 31) : anchor.x;
    const y = Math.max(25, anchor.y);
    ctx.strokeStyle = SEAT_COLORS[side];
    ctx.fillStyle = "#10232d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 1);
    ctx.lineTo(anchor.x, y + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 19, y - 20);
    ctx.lineTo(x + 19, y - 20);
    ctx.lineTo(x + 19, y - 1);
    if (side === 0) ctx.lineTo(x - 19, y - 1);
    else ctx.lineTo(x - 13, y - 1);
    if (side === 1) ctx.lineTo(x - 19, y - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SEAT_COLORS[side];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillText(seatLabel(side === 0 ? "p1" : "p2", state.versus), x, y - 10);
  }
}

export function drawMatch(
  ctx: CanvasRenderingContext2D,
  state: FightState,
  art: ArtMap,
  viewW: number,
  viewH: number,
): void {
  if (viewW <= 0 || viewH <= 0) return;
  ctx.save();
  drawStage(ctx, viewW, viewH);
  const [p1, p2] = state.fighters;
  const mid = (p1.x + p2.x) / 2;
  const scale = Math.min(1.35, viewW / Math.max(720, Math.abs(p1.x - p2.x) + 240), viewH / 690);
  const cameraX = mid - viewW / (2 * scale);
  const groundY = viewH * 0.72 / scale;

  ctx.save();
  ctx.scale(scale, scale);
  for (const f of state.fighters) {
    ctx.fillStyle = "#132a30";
    ctx.beginPath();
    ctx.ellipse(f.x - cameraX, groundY + 2, 32, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const layers = p1.y > p2.y ? [1, 0] as const : [0, 1] as const;
  for (const side of layers) {
    drawPuppet(ctx, state.fighters[side], cameraX, groundY, art, side, state.frame, state.prevInputs[side]);
  }
  for (const shot of state.projectiles) {
    if (!shot.hit) drawProjectile(ctx, shot, cameraX, groundY, getFighterDef(state.fighters[shot.owner].id).color);
  }
  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side];
    const attacker = state.fighters[side === 0 ? 1 : 0];
    contactEffect(ctx, fighter, attacker, fighter.x - cameraX, groundY - fighter.y, state.prevInputs[side].down);
  }
  ctx.restore();
  drawSeatLabels(ctx, state, cameraX, groundY, scale);

  if (state.phase === "intro" || state.phase === "ko" || state.phase === "timeout") {
    ctx.font = "bold " + Math.min(54, viewW / 9) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#152733";
    const title = state.phase === "intro"
      ? state.phaseFrame < 50 ? "ROUND " + state.round : "FIGHT"
      : state.phase === "ko" ? "K.O." : "TIME";
    ctx.strokeStyle = "#152733";
    ctx.lineWidth = 7;
    ctx.strokeText(title, viewW / 2, viewH * 0.39);
    ctx.fillStyle = "#f7dc9c";
    ctx.fillText(title, viewW / 2, viewH * 0.39);
  }
  ctx.restore();
}
