import { BUFFER_FRAMES, EMPTY_INPUT, type InputBits } from "./types";

export function cloneInput(input: InputBits): InputBits {
  return { ...input };
}

export function edgePressed(prev: InputBits, next: InputBits, key: keyof InputBits): boolean {
  return next[key] && !prev[key];
}

export function anyPunch(input: InputBits): boolean {
  return input.lp || input.hp;
}

export function anyKick(input: InputBits): boolean {
  return input.lk || input.hk;
}

export function numpadDir(input: InputBits, facing: 1 | -1): number {
  const forward = facing === 1 ? input.right : input.left;
  const back = facing === 1 ? input.left : input.right;
  const x = forward ? 1 : back ? -1 : 0;
  const y = input.up ? 1 : input.down ? -1 : 0;
  if (x === 0 && y === 0) return 5;
  if (x === -1 && y === -1) return 1;
  if (x === 0 && y === -1) return 2;
  if (x === 1 && y === -1) return 3;
  if (x === -1 && y === 0) return 4;
  if (x === 1 && y === 0) return 6;
  if (x === -1 && y === 1) return 7;
  if (x === 0 && y === 1) return 8;
  return 9;
}

export function pushBuffer(buffer: number[], dir: number): number[] {
  const next = buffer.length >= BUFFER_FRAMES ? buffer.slice(buffer.length - BUFFER_FRAMES + 1) : buffer.slice();
  next.push(dir);
  return next;
}

const motions = [
  ["236236", [2, 3, 6, 2, 3, 6]],
  ["623", [6, 2, 3]],
  ["236", [2, 3, 6]],
  ["214", [2, 1, 4]],
] as const;

function lastCompletion(buffer: number[], sequence: readonly number[]): number {
  let step = 0;
  for (const dir of buffer) {
    if (dir !== sequence[step]) continue;
    step += 1;
    if (step === sequence.length) return buffer.lastIndexOf(dir);
  }
  return -1;
}

export function detectMotion(buffer: number[]): "236236" | "623" | "236" | "214" | null {
  let result: (typeof motions)[number][0] | null = null;
  let latest = -1;
  for (const [motion, sequence] of motions) {
    const end = lastCompletion(buffer, sequence);
    // A double quarter-circle and a single can finish on the same frame.
    if (end > latest) {
      result = motion;
      latest = end;
    }
  }
  return result;
}

export function holdingBack(input: InputBits, facing: 1 | -1): boolean {
  return facing === 1 ? input.left : input.right;
}

export function mergePressed(a: InputBits, b: InputBits): InputBits {
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    up: a.up || b.up,
    down: a.down || b.down,
    lp: a.lp || b.lp,
    lk: a.lk || b.lk,
    hp: a.hp || b.hp,
    hk: a.hk || b.hk,
  };
}

export function idleInput(): InputBits {
  return cloneInput(EMPTY_INPUT);
}
