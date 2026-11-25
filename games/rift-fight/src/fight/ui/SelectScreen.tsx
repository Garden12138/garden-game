import { fighterArt } from "../data/art";
import { FIGHT_SUBTITLE, FIGHT_TITLE, SEAT_CONTROLS, seatLabel, type Seat } from "../data/copy";
import { ROSTER, getFighterDef } from "../data/roster";
import type { AiDifficulty, FighterId, VersusKind } from "../engine/types";
import { FighterGuide } from "./FighterGuide";

export function SelectScreen({
  p1,
  p2,
  versus,
  difficulty,
  onP1,
  onP2,
  onVersus,
  onDifficulty,
  onStart,
}: {
  p1: FighterId;
  p2: FighterId;
  versus: VersusKind;
  difficulty: AiDifficulty;
  onP1: (id: FighterId) => void;
  onP2: (id: FighterId) => void;
  onVersus: (kind: VersusKind) => void;
  onDifficulty: (level: AiDifficulty) => void;
  onStart: () => void;
}) {
  return (
    <div className="fight-select">
      <header className="fight-header">
        <div>
          <h1>{FIGHT_TITLE}</h1>
          <small>{FIGHT_SUBTITLE}</small>
        </div>
      </header>
      <p className="fight-lead">同一块键盘，先赢两回合的一方获胜。</p>
      <div className="fight-versus-toggle" role="group" aria-label="对战模式">
        <button type="button" aria-pressed={versus === "local"} className={versus === "local" ? "is-on" : ""} onClick={() => onVersus("local")}>
          本地双人
        </button>
        <button type="button" aria-pressed={versus === "ai"} className={versus === "ai" ? "is-on" : ""} onClick={() => onVersus("ai")}>
          打电脑
        </button>
        {versus === "ai" &&
          (["easy", "normal", "hard"] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={difficulty === level}
              className={difficulty === level ? "is-on" : ""}
              onClick={() => onDifficulty(level)}
            >
              {level === "easy" ? "易" : level === "normal" ? "中" : "难"}
            </button>
          ))}
      </div>
      <div className="fight-picks">
        <RosterColumn seat="p1" versus={versus} selected={p1} onSelect={onP1} />
        <div className="fight-vs-mark">VS</div>
        <RosterColumn seat="p2" versus={versus} selected={p2} onSelect={onP2} />
      </div>
      <p className="fight-help">按顺序输入招式，+ 表示同时按。跳到对手另一侧后，左右方向互换。</p>
      <button type="button" className="fight-start" onClick={onStart}>
        开始对战
      </button>
      <details className="fight-help">
        <summary>键盘操作</summary>
        <p>P1 · {SEAT_CONTROLS.p1}</p>
        {versus === "local" && <p>P2 · {SEAT_CONTROLS.p2}</p>}
        <p>在地面按住后方向可站防，同时按住下可蹲防。贴身同时按轻拳和轻脚可投技。Esc 暂停或继续。</p>
        <p>面朝右时，↓↘→ + 拳、↓↙← + 拳或脚、→↓↘ + 拳分别使出三种必杀。攒满一格能量后，↓↘→↓↘→ + 拳使出超必。</p>
      </details>
    </div>
  );
}

function RosterColumn({
  seat,
  versus,
  selected,
  onSelect,
}: {
  seat: Seat;
  versus: VersusKind;
  selected: FighterId;
  onSelect: (id: FighterId) => void;
}) {
  const label = seatLabel(seat, versus);
  return (
    <section className={`fight-roster is-${seat}`} data-seat={seat} aria-labelledby={`roster-${seat}`}>
      <h2 id={`roster-${seat}`}>{label}</h2>
      <div className="fight-roster__grid">
        {ROSTER.map((id) => {
          const def = getFighterDef(id);
          return (
            <button
              key={id}
              type="button"
              className={selected === id ? "is-on" : ""}
              aria-pressed={selected === id}
              onClick={() => onSelect(id)}
            >
              <img src={fighterArt(id).icon} alt="" />
              <span>{def.name}</span>
            </button>
          );
        })}
      </div>
      <FighterGuide id={selected} seat={seat} versus={versus} facing={seat === "p1" ? 1 : -1} />
    </section>
  );
}
