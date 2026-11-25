import { seatLabel } from "../data/copy";
import { getFighterDef } from "../data/roster";
import { MAX_HEALTH, MAX_METER, TICK_HZ, WINS_NEEDED, type FightState } from "../engine/types";

export function FightHud({ state, paused, onPause }: { state: FightState; paused: boolean; onPause: () => void }) {
  const [a, b] = state.fighters;
  const seconds = Math.ceil(state.timer / TICK_HZ);
  return (
    <div className="fight-hud" inert={paused}>
      <Bar side="left" label="P1" name={getFighterDef(a.id).name} health={a.health} meter={a.meter} wins={state.wins[0]} />
      <div className="fight-hud__clock">
        <strong aria-label={`剩余 ${seconds} 秒`}>{String(seconds).padStart(2, "0")}</strong>
        <span aria-label="回合比分">
          {state.wins[0]} - {state.wins[1]}
        </span>
        <button type="button" onClick={onPause}>
          暂停
        </button>
      </div>
      <Bar side="right" label={seatLabel("p2", state.versus)} name={getFighterDef(b.id).name} health={b.health} meter={b.meter} wins={state.wins[1]} />
    </div>
  );
}

function Bar({
  side,
  label,
  name,
  health,
  meter,
  wins,
}: {
  side: "left" | "right";
  label: string;
  name: string;
  health: number;
  meter: number;
  wins: number;
}) {
  return (
    <div className={`fight-hud__bar is-${side}`} data-seat={side === "left" ? "p1" : "p2"}>
      <div className="fight-hud__name">
        <b className="fight-hud__seat">{label}</b>
        <span>{name}</span>
        <small aria-label={`已赢 ${wins} 回合`}>{"●".repeat(wins)}{"○".repeat(Math.max(0, WINS_NEEDED - wins))}</small>
      </div>
      <div className="fight-hud__hp" role="meter" aria-label={`${label} 体力`} aria-valuemin={0} aria-valuemax={MAX_HEALTH} aria-valuenow={health}>
        <i style={{ width: `${100 * health / MAX_HEALTH}%` }} />
      </div>
      <div className="fight-hud__meter" role="meter" aria-label={`${label} 能量`} aria-valuemin={0} aria-valuemax={MAX_METER} aria-valuenow={meter}>
        <i style={{ width: `${100 * meter / MAX_METER}%` }} />
      </div>
    </div>
  );
}
