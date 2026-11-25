import { useEffect, useRef, useState } from "react";
import { fighterArt } from "../data/art";
import { SEAT_CONTROLS } from "../data/copy";
import { EMPTY_INPUT, type FightState, type InputBits } from "../engine/types";
import { tick } from "../engine/tick";
import { drawMatch } from "../render/drawMatch";
import type { ArtMap } from "../puppet/renderPuppet";
import { FightHud } from "./FightHud";
import { FighterGuide } from "./FighterGuide";

const P1: Record<string, keyof InputBits> = {
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  KeyJ: "lp",
  KeyK: "lk",
  KeyU: "hp",
  KeyI: "hk",
};

const P2: Record<string, keyof InputBits> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  BracketLeft: "lp",
  BracketRight: "lk",
  Semicolon: "hp",
  Quote: "hk",
  Numpad4: "lp",
  Numpad5: "lk",
  Numpad1: "hp",
  Numpad2: "hk",
};

function blank(): InputBits {
  return { ...EMPTY_INPUT };
}

export function MatchScreen({
  initial,
  onDone,
  onSelect,
}: {
  initial: FightState;
  onDone: (state: FightState) => void;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(initial);
  const inputsRef = useRef<[InputBits, InputBits]>([blank(), blank()]);
  const artRef = useRef<ArtMap>(new Map());
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    for (const fighter of initial.fighters) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (!cancelled) artRef.current.set(fighter.id, image);
      };
      image.src = fighterArt(fighter.id).icon;
    }
    return () => {
      cancelled = true;
    };
  }, [initial]);

  useEffect(() => {
    const releaseKeys = () => {
      inputsRef.current = [blank(), blank()];
    };
    const down = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        if (!event.repeat) {
          releaseKeys();
          if (paused) canvasRef.current?.focus();
          setPaused(!paused);
        }
        return;
      }
      if (paused || event.metaKey || event.ctrlKey || event.altKey) return;
      const p1 = P1[event.code];
      const p2 = initial.versus === "local" && P2[event.code];
      if (p1) {
        event.preventDefault();
        inputsRef.current[0][p1] = true;
      }
      if (p2) {
        event.preventDefault();
        inputsRef.current[1][p2] = true;
      }
    };
    const up = (event: KeyboardEvent) => {
      const p1 = P1[event.code];
      const p2 = P2[event.code];
      if (p1) inputsRef.current[0][p1] = false;
      if (p2) inputsRef.current[1][p2] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseKeys);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseKeys);
    };
  }, [paused, initial.versus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (!paused) {
        acc += dt;
        while (acc >= 1000 / 60) {
          acc -= 1000 / 60;
          const next = tick(stateRef.current, inputsRef.current[0], inputsRef.current[1]);
          stateRef.current = next;
          if (next.phase === "matchOver") {
            onDone(next);
            return;
          }
        }
        setHud(stateRef.current);
      }
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      drawMatch(ctx, stateRef.current, artRef.current, canvas.width, canvas.height);
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [paused, onDone]);

  return (
    <div className="fight-match">
      <FightHud state={hud} paused={paused} onPause={() => {
        inputsRef.current = [blank(), blank()];
        setPaused(true);
      }} />
      <canvas ref={canvasRef} className="fight-canvas" aria-label="格斗场地" tabIndex={-1} />
      {paused && (
        <div
          className="fight-pause"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const buttons = event.currentTarget.querySelectorAll("button");
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            const end = event.shiftKey ? first : last;
            if (event.target === end) {
              event.preventDefault();
              (event.shiftKey ? last : first)?.focus();
            }
          }}
        >
          <h2 id="pause-title">暂停</h2>
          <div className="fight-pause__guides">
            {hud.fighters.map((fighter, index) => (
              <FighterGuide key={index} id={fighter.id} seat={index === 0 ? "p1" : "p2"} versus={hud.versus} facing={fighter.facing} />
            ))}
          </div>
          <div className="fight-pause__controls">
            <p>P1 · {SEAT_CONTROLS.p1}</p>
            {hud.versus === "local" && <p>P2 · {SEAT_CONTROLS.p2}</p>}
            <p>按顺序输入招式，+ 表示同时按。按住后方向防御，近身同时按轻拳和轻脚可投技。</p>
          </div>
          <div className="fight-pause__actions">
            <button type="button" autoFocus onClick={() => {
              setPaused(false);
              canvasRef.current?.focus();
            }}>
              继续
            </button>
            <button type="button" onClick={onSelect}>返回选人</button>
          </div>
        </div>
      )}
    </div>
  );
}
