import { getFighterDef } from "../data/roster";
import { seatLabel } from "../data/copy";
import type { FightState } from "../engine/types";

export function ResultScreen({
  state,
  onRematch,
  onSwap,
  onSelect,
}: {
  state: FightState;
  onRematch: () => void;
  onSwap: () => void;
  onSelect: () => void;
}) {
  const index = state.wins[0] > state.wins[1] ? 0 : 1;
  const winner = state.fighters[index];
  const seat = index === 0 ? "p1" : "p2";
  const label = seatLabel(seat, state.versus);
  const def = getFighterDef(winner.id);
  return (
    <div className={`fight-result is-${seat}`} data-seat={seat}>
      <h1><span className="fight-result__seat">{label}</span> · {def.name} 获胜</h1>
      <p className="fight-result__score">
        P1 {state.wins[0]} - {state.wins[1]} {seatLabel("p2", state.versus)}
      </p>
      <div className="fight-result__actions">
        <button type="button" autoFocus onClick={onRematch}>
          再来一局
        </button>
        <button type="button" onClick={onSwap}>交换英雄再战</button>
        <button type="button" onClick={onSelect}>
          重新选人
        </button>
      </div>
    </div>
  );
}
