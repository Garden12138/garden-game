import { fighterArt } from "../data/art";
import { seatLabel } from "../data/copy";
import { getFighterDef } from "../data/roster";
import type { FighterId, VersusKind } from "../engine/types";

export function VersusScreen({ p1, p2, versus }: { p1: FighterId; p2: FighterId; versus: VersusKind }) {
  const left = getFighterDef(p1);
  const right = getFighterDef(p2);
  return (
    <div className="fight-versus">
      <div className="fight-versus__side is-p1" data-seat="p1" style={{ backgroundImage: `url("${fighterArt(p1).splash}")` }}>
        <small>P1</small>
        <strong>{left.name}</strong>
        <span>{left.title}</span>
      </div>
      <div className="fight-versus__mid">VS</div>
      <div className="fight-versus__side is-right is-p2" data-seat="p2" style={{ backgroundImage: `url("${fighterArt(p2).splash}")` }}>
        <small>{seatLabel("p2", versus)}</small>
        <strong>{right.name}</strong>
        <span>{right.title}</span>
      </div>
    </div>
  );
}
