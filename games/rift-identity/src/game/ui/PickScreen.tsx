import { getChampionById, getSkinByNum } from "../../data/champions";
import { IDENTITY_GOALS, IDENTITY_NAMES } from "../data/copy";
import { getGameChampion } from "../data/champions";
import type { Action, GameState, PlayerId } from "../engine/types";

export function PickScreen({
  state,
  mySeat,
  onPick,
}: {
  state: GameState;
  mySeat: PlayerId;
  onPick: (action: Action) => void;
}) {
  const actor = state.prompt.actor;
  const human = actor === mySeat;
  const seat = state.players[mySeat]!;
  const title =
    state.config.mode === "duel" ? "1v1 单挑" : state.config.mode === "team" ? "2v2 团队战" : "峡谷身份战";
  return (
    <section className="rift-pick" aria-labelledby="pick-heading">
      <h1 id="pick-heading">{title} · 选将</h1>
      <p>{human ? "轮到你选择英雄。每人三选一。" : "等待其他召唤师选将…"}</p>
      {state.config.mode === "identity" && (
        <div className="rift-role-card">
          <strong>你的身份 · {IDENTITY_NAMES[seat.identity]}</strong>
          <p>{IDENTITY_GOALS[seat.identity]}</p>
          <small>本局起手 {state.config.openingHand ?? 0} 张，每回合开始摸两张。</small>
        </div>
      )}
      {state.config.mode === "team" && (
        <p className="rift-pick__role">你是{mySeat % 2 === 0 ? "蓝方" : "红方"}</p>
      )}
      {human ? (
        <div className="rift-pick__grid">
          {seat.candidates.map((championId) => {
            const champion = getChampionById(championId);
            const skin = champion ? getSkinByNum(champion, 0) : undefined;
            const def = getGameChampion(championId);
            const art = skin?.splashUrl || skin?.loadingUrl;
            return (
              <button
                key={championId}
                type="button"
                className="rift-pick__card"
                onClick={() => onPick({ type: "pickChampion", player: mySeat, championId })}
              >
                {art && <img src={art} alt="" />}
                <strong>
                  {champion?.name ?? championId}
                  {champion?.title ? ` · ${champion.title}` : ""}
                </strong>
                <span>
                  {def?.skillName}：{def?.skillText}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="rift-pick__wait">
          {state.players.map((item) => (
            <li key={item.id}>
              {state.config.playerNames?.[item.id] || `座位 ${item.id}`}
              {item.id === mySeat ? "（你）" : ""}：
              {item.championId
                ? `${getChampionById(item.championId)?.name ?? item.championId} 已选`
                : item.id === actor
                  ? "选将中"
                  : "等待"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
