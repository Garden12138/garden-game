import { CAMPAIGN_STAGES, type CampaignStage } from "../data/campaign";
import { getDeck } from "../data/decks";
import type { DuelState } from "../engine/types";

export function ResultScreen({
  state,
  onRematch,
  onLobby,
  stage,
  onNext,
}: {
  state: DuelState;
  onRematch: () => void;
  onLobby: () => void;
  stage?: CampaignStage;
  onNext?: () => void;
}) {
  const won = state.winner === 0;
  const lastStage = stage?.id === CAMPAIGN_STAGES[CAMPAIGN_STAGES.length - 1]?.id;
  const clearedCampaign = stage && won && lastStage;
  const showNext = stage && won && !lastStage && onNext;
  const reason = state.winReason === "deckout" ? "卡组抽空" : "生命归零";

  return (
    <main className="ygo-result">
      <section className="ygo-result__panel" aria-labelledby="result-title">
        <p className="ygo-result__mode">{stage ? `皮城战役 / ${stage.name}` : "自由决斗"}</p>
        <h1 id="result-title">{clearedCampaign ? "战役全通关" : won ? "胜利" : "落败"}</h1>
        <p className="ygo-result__reason">第 {state.turn} 回合，{won ? "对手" : "我方"}{reason}。</p>
        <dl className="ygo-result__scores">
          {state.players.map((player) => (
            <div key={player.id}>
              <dt>{player.id === 0 ? "我方" : "对手"} · {getDeck(player.deckId).name}</dt>
              <dd>{Math.max(0, player.lp)} <small>LP</small></dd>
            </div>
          ))}
        </dl>
        <div className="ygo-result__actions">
          {showNext && <button type="button" className="is-primary" onClick={onNext}>挑战下一关</button>}
          <button type="button" className={showNext || clearedCampaign ? undefined : "is-primary"} onClick={onRematch}>
            {stage ? (won ? "再战本关" : "重试本关") : "再来一局"}
          </button>
          <button type="button" className={clearedCampaign ? "is-primary" : undefined} onClick={onLobby}>
            {stage ? "返回大厅" : "更换卡组"}
          </button>
        </div>
      </section>
    </main>
  );
}
