import type { ReactNode } from "react";
import { CARD_NAMES } from "../data/copy";
import { equipmentList } from "../engine/distance";
import type { Action, GameState, PlayerId } from "../engine/types";
import { seatName } from "../engine/win";

export function PromptBar({ state, mySeat, message, children, onAction }: {
  state: GameState;
  mySeat: PlayerId;
  message?: string;
  children: ReactNode;
  onAction: (action: Action) => void;
}) {
  const prompt = state.prompt;
  const mine = prompt.actor === mySeat;
  const equipment = prompt.kind === "chooseCardInArea" && prompt.source !== undefined
    ? equipmentList(state, prompt.source) : [];
  return (
    <div className="rift-prompt">
      <p aria-live="polite">{mine ? message || prompt.message : `等待 ${seatName(state, prompt.actor)}…`}</p>
      {mine && <div className="rift-prompt__actions">
        {children}
        {prompt.kind === "chooseCardInArea" && prompt.legalCardIds.map((cardId) => {
          const card = equipment.find((item) => item.id === cardId);
          return <button key={cardId} onClick={() => onAction({ type: "respond", player: mySeat, cardId })}>
            {card ? CARD_NAMES[card.kind] : "一张暗手牌"}
          </button>;
        })}
        {prompt.canCancel && <button onClick={() => onAction({ type: "respond", player: mySeat })}>
          {prompt.kind === "respondLantern" ? "保留灯笼" : "放弃响应"}
        </button>}
      </div>}
    </div>
  );
}
