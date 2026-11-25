import { useState } from "react";
import { CARD_NAMES, IDENTITY_GOALS, IDENTITY_NAMES, SUIT_SYMBOL } from "../data/copy";
import { getGameChampion } from "../data/champions";
import { legalActions } from "../engine/legal";
import type { Action, GameCard, GameState, PlayerId } from "../engine/types";
import { seatName } from "../engine/win";
import { GameLog } from "./GameLog";
import { HandDock } from "./HandDock";
import { PromptBar } from "./PromptBar";
import { Seat } from "./Seat";

type Selection = { type: "playCard"; cardId: string }
  | { type: "useSkill"; cardId?: string; targetId?: PlayerId };

export function TableScreen({ state, mySeat, onAction, onInspect }: {
  state: GameState;
  mySeat: PlayerId;
  onAction: (action: Action) => void;
  onInspect: (id: PlayerId) => void;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [discards, setDiscards] = useState<string[]>([]);
  const me = state.players[mySeat]!;
  const mine = state.prompt.actor === mySeat;
  const options = mine ? legalActions(state) : [];
  const skills = options.filter((a) => a.type === "useSkill");
  const cards = options.filter((a) => a.type === "playCard");
  const skill = selection?.type === "useSkill" ? selection : null;
  const skillName = getGameChampion(me.championId)?.skillName;
  const needsCard = skills.some((a) => a.cardId !== undefined);
  const pickingCost = !!skill && needsCard && !skill.cardId;
  const matches = skill
    ? skills.filter((a) => a.cardId === skill.cardId)
    : cards.filter((a) => a.cardId === selection?.cardId);
  const targets = matches.flatMap((a) => a.targetId === undefined ? [] : [a.targetId]);
  const confirmed = skill && matches.find((a) => a.targetId === skill.targetId);
  const selectedCard = me.hand.find((card) => card.id === selection?.cardId);
  const discarding = mine && state.prompt.kind === "discardToHp";
  const need = me.hand.length - me.hp;
  const enabled = new Set<string>();
  if (mine && state.prompt.kind === "playCard") {
    for (const action of skill ? skills : cards) if (action.cardId) enabled.add(action.cardId);
  } else if (mine && state.prompt.kind !== "chooseCardInArea") {
    for (const id of state.prompt.legalCardIds) enabled.add(id);
  }

  const submit = (action: Action) => {
    setSelection(null);
    setDiscards([]);
    onAction(action);
  };
  const playCard = (card: GameCard) => {
    if (discarding) {
      setDiscards((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id)
        : ids.length < need ? [...ids, card.id] : ids);
    } else if (skill) {
      setSelection({ type: "useSkill", cardId: card.id });
    } else if (state.prompt.kind === "playCard") {
      const plays = cards.filter((a) => a.cardId === card.id);
      if (plays.length === 1) submit(plays[0]!);
      else setSelection({ type: "playCard", cardId: card.id });
    } else {
      submit({ type: "respond", player: mySeat, cardId: card.id });
    }
  };
  const selectSeat = (id: PlayerId) => {
    if (!selection) return onInspect(id);
    if (!targets.includes(id)) return;
    if (skill) setSelection({ ...skill, targetId: id });
    else {
      const action = matches.find((a) => a.targetId === id);
      if (action) submit(action);
    }
  };
  let message: string | undefined;
  if (discarding) message = `选择要弃置的手牌（${discards.length}/${need}）`;
  if (selection) {
    const cardLabel = selectedCard
      ? `${CARD_NAMES[selectedCard.kind]}${SUIT_SYMBOL[selectedCard.suit]}${selectedCard.rank}` : "";
    const title = [skill && skillName, cardLabel].filter(Boolean).join(" · ");
    if (pickingCost) message = `${title} · 请选择手牌`;
    else if (confirmed) message = confirmed.targetId === undefined ? title : `${title} → ${seatName(state, confirmed.targetId)}`;
    else message = `${title} · 请选择目标`;
  }

  const duel = state.config.mode === "duel";
  const renderSeat = (offset: number, area: "bottom" | "top" | "left" | "right") => {
    const id = (mySeat + offset) % state.players.length;
    return <Seat state={state} id={id} mySeat={mySeat} area={area}
      selected={targets.includes(id)} onSelect={selectSeat} />;
  };
  return (
    <section className={`rift-table${duel ? " rift-table--duel" : ""}`} aria-label="对局桌面">
      {renderSeat(duel ? 1 : 2, "top")}
      {!duel && renderSeat(1, "left")}
      <div className="rift-table__center">
        <PromptBar state={state} mySeat={mySeat} message={message} onAction={submit}>
          {selection ? <>
            {confirmed && <button onClick={() => submit(confirmed)}>确认发动</button>}
            <button onClick={() => setSelection(null)}>取消选择</button>
          </> : <>
            {skills.length > 0 && <button onClick={() => setSelection({ type: "useSkill" })}>{skillName}</button>}
            {state.prompt.kind === "playCard" && <button onClick={() => submit({ type: "endPlay", player: mySeat })}>结束出牌</button>}
          </>}
          {discarding && <button disabled={discards.length !== need}
            onClick={() => submit({ type: "discard", player: mySeat, cardIds: discards })}>确认弃牌</button>}
        </PromptBar>
        <GameLog state={state} />
      </div>
      {!duel && renderSeat(3, "right")}
      <div className="rift-table__self">
        {renderSeat(0, "bottom")}
        {state.config.mode === "identity" && <details className="rift-role-card">
          <summary>我的身份 · {IDENTITY_NAMES[me.identity]}</summary>
          <p>{IDENTITY_GOALS[me.identity]}</p>
        </details>}
        <HandDock hand={me.hand} enabledIds={enabled}
          selectedIds={selection?.cardId ? [selection.cardId] : discards} onPlay={playCard} />
      </div>
    </section>
  );
}
