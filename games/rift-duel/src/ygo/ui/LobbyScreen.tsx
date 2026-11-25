import { CAMPAIGN_DECK_ID, CAMPAIGN_STAGES } from "../data/campaign";
import { YGO_CREDIT, YGO_SUBTITLE, YGO_TITLE } from "../data/copy";
import { DECKS, getDeck } from "../data/decks";
import { cardArt } from "./CardView";

export function LobbyScreen({
  deckId,
  onDeck,
  onStart,
  campaignProgress = 0,
  onChallenge,
}: {
  deckId: string;
  onDeck: (id: string) => void;
  onStart: () => void;
  campaignProgress?: number;
  onChallenge?: (stageId: string) => void;
}) {
  return (
    <main className="ygo-lobby">
      <header className="ygo-lobby__masthead">
        <h1>{YGO_TITLE}</h1>
        <span lang="en">{YGO_SUBTITLE}</span>
        {onChallenge && <a className="ygo-lobby__free-link" href="#free-title">自由决斗 ↓</a>}
      </header>

      {onChallenge && (
        <section className="ygo-lobby__section" aria-labelledby="campaign-title">
          <div className="ygo-lobby__heading">
            <div>
              <h2 id="campaign-title">皮城战役</h2>
              <p>使用{getDeck(CAMPAIGN_DECK_ID).name}依次挑战三个对手，获胜即可通关。</p>
            </div>
            <span className="ygo-campaign-progress">已通关 {campaignProgress} / {CAMPAIGN_STAGES.length}</span>
          </div>
          <ol className="ygo-stages">
            {CAMPAIGN_STAGES.map((stage, index) => {
              const locked = index > campaignProgress;
              const completed = index < campaignProgress;
              const art = cardArt(stage.featuredCard);
              return (
                <li key={stage.id} className={`ygo-stage${index === campaignProgress ? " is-current" : ""}`}>
                  <div className="ygo-stage__banner">
                    {art && <span className="ygo-stage__art" aria-hidden="true" style={{ backgroundImage: `url("${art}")` }} />}
                    <span className="ygo-stage__order">第 {index + 1} 关 · {stage.firstPlayer === 0 ? "我方先攻" : "对手先攻"}</span>
                    <h3>{stage.name}</h3>
                  </div>
                  <div className="ygo-stage__body">
                    <p>{stage.briefing}</p>
                    <p className="ygo-stage__objective"><strong>战术提示</strong> {stage.objective}</p>
                    <button
                      type="button"
                      disabled={locked}
                      aria-label={`${stage.name}，${locked ? "尚未解锁" : completed ? "再次挑战" : "开始挑战"}`}
                      onClick={() => onChallenge(stage.id)}
                    >
                      {locked ? "通关上一关后解锁" : completed ? "已通关 · 再次挑战" : "开始挑战"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="ygo-lobby__section" aria-labelledby="free-title">
        <div className="ygo-lobby__heading">
          <div>
            <h2 id="free-title">自由决斗</h2>
            <p>自选一套预组，与电脑进行单局对决。</p>
          </div>
        </div>
        <div className="ygo-decks">
          {DECKS.map((deck) => (
            <button
              key={deck.id}
              type="button"
              aria-pressed={deckId === deck.id}
              className={deckId === deck.id ? "is-on" : ""}
              onClick={() => onDeck(deck.id)}
            >
              <strong>{deck.name}</strong>
              <span>{deck.blurb}</span>
            </button>
          ))}
        </div>
        <div className="ygo-free-actions">
          <span>当前预组<strong>{getDeck(deckId).name}</strong></span>
          <button type="button" className="ygo-start" onClick={onStart}>
            开始决斗
          </button>
        </div>
      </section>
      <footer className="ygo-lobby__credit">{YGO_CREDIT}</footer>
    </main>
  );
}
