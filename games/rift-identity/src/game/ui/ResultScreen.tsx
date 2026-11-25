import { OpeningHandSelect } from "./OpeningHandSelect";
import { IDENTITY_NAMES, WINNER_NAMES } from "../data/copy";
import { getChampionById } from "../../data/champions";
import type { GameState } from "../engine/types";

export function ResultScreen({ state, onReplay, openingHand, onOpeningHand }: {
  state: GameState;
  onReplay?: () => void;
  openingHand: 0 | 2;
  onOpeningHand: (value: 0 | 2) => void;
}) {
  const title = state.winner === "duel" ? state.prompt.message
    : state.winner ? `${WINNER_NAMES[state.winner]} 胜利` : "对局结束";
  return (
    <section className="rift-result" aria-labelledby="result-heading">
      <h1 id="result-heading">{title}</h1>
      <ul>
        {state.players.map((seat) => {
          const name = getChampionById(seat.championId)?.name ?? seat.championId;
          const extra =
            state.config.mode === "identity"
              ? ` · ${IDENTITY_NAMES[seat.identity]}`
              : state.config.mode === "team"
                ? ` · ${seat.id % 2 === 0 ? "蓝方" : "红方"}`
                : "";
          return (
            <li key={seat.id}>
              {state.config.playerNames?.[seat.id] || `座位 ${seat.id}`} · {name}
              {extra}
              {seat.alive ? "（存活）" : "（阵亡）"}
            </li>
          );
        })}
      </ul>
      <details className="rift-recap">
        <summary>回看本局行动</summary>
        <ol>{state.log.map((line, index) => <li key={index}>{line}</li>)}</ol>
      </details>
      {state.config.mode === "identity" && <p>哪次出牌让你改变了对某个人身份的判断？</p>}
      {onReplay ? <>
        {state.config.mode === "identity" && <OpeningHandSelect value={openingHand} onChange={onOpeningHand} />}
        <button type="button" onClick={onReplay}>再来一局</button>
      </> : <p>等待房主开启下一局</p>}
    </section>
  );
}
