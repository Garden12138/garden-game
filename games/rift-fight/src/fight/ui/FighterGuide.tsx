import { fighterArt } from "../data/art";
import { fighterGuide, seatLabel, type Seat } from "../data/copy";
import { getFighterDef } from "../data/roster";
import type { FighterId, VersusKind } from "../engine/types";

export function FighterGuide({ id, seat, versus, facing }: {
  id: FighterId;
  seat: Seat;
  versus: VersusKind;
  facing: 1 | -1;
}) {
  const label = seatLabel(seat, versus);
  const guide = fighterGuide(id, seat, facing, versus);
  return (
    <section className={`fight-guide is-${seat}`} data-seat={seat} aria-label={`${label} 招式提示`}>
      <img className="fight-guide__portrait" src={fighterArt(id).icon} alt="" aria-hidden="true" />
      <div className="fight-guide__body">
        <h3 className="fight-guide__title">{label} · {getFighterDef(id).name}</h3>
        <p className="fight-guide__tip">{guide.tip}</p>
        <p className="fight-guide__move">
          <strong>{guide.name}</strong>
          <span>{facing === 1 ? "面朝右" : "面朝左"}{label === "CPU" && " · 电脑操控"}</span>
        </p>
        <kbd className="fight-guide__keys">{guide.keys}</kbd>
      </div>
    </section>
  );
}
