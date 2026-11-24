import { fighterArt } from "../data/art";
import { getFighterDef } from "../data/roster";
import type { FighterId } from "../engine/types";

export function VersusScreen({ p1, p2 }: { p1: FighterId; p2: FighterId }) {
  const left = getFighterDef(p1);
  const right = getFighterDef(p2);
  return (
    <div className="fight-versus">
      <div className="fight-versus__side" style={{ backgroundImage: `url("${fighterArt(p1).splash}")` }}>
        <strong>{left.name}</strong>
        <span>{left.title}</span>
      </div>
      <div className="fight-versus__mid">VS</div>
      <div className="fight-versus__side is-right" style={{ backgroundImage: `url("${fighterArt(p2).splash}")` }}>
        <strong>{right.name}</strong>
        <span>{right.title}</span>
      </div>
    </div>
  );
}
