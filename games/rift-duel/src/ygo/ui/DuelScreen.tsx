import { useEffect, useState } from "react";
import { getCardDef } from "../data/cards";
import { findAnywhere } from "../engine/helpers";
import { legalActions } from "../engine/reduce";
import type { Action, CardInstance, DuelState, PlayerId } from "../engine/types";
import { CardView, cardStats, cardType } from "./CardView";
import { ChainStack } from "./ChainStack";
import { actionGroups, availableForCard, cardLocation, choiceLabel, targetOf } from "./duelChoices";
import { FieldBoard, type Pile } from "./FieldBoard";
import { HandDock } from "./HandDock";
import { PromptBar } from "./PromptBar";
import "./duel.css";

type Selection =
  | { kind: "pile"; owner: PlayerId; pile: Pile }
  | { kind: "card"; uid: string; group?: string };

type DuelProps = {
  state: DuelState;
  onAct: (action: Action) => void;
  onExit: () => void;
  encounterName?: string;
  objective?: string;
};

export function DuelScreen({ state, onAct, onExit, encounterName, objective }: DuelProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const close = () => setSelection(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelection(null);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  const humanTurn = state.prompt.actor === 0 && state.players[0].controller === "human";
  const actions = humanTurn ? legalActions(state) : [];
  const me = state.players[0];
  const foe = state.players[1];
  const boardCards = [...me.monsters, ...me.spells, me.field, ...me.hand, ...me.extra];
  const available = new Set<string>();
  for (const card of boardCards) {
    if (card && actions.some((action) => availableForCard(action, card, me.extra.includes(card)))) available.add(card.uid);
  }

  const selected = selection?.kind === "card" ? findAnywhere(state, selection.uid) : null;
  const inspectable = selected && !me.deck.includes(selected) && !foe.deck.includes(selected)
    && !foe.hand.includes(selected) && !foe.extra.includes(selected) && !(selected.owner === 1 && selected.face === "down");
  const card = inspectable ? selected : null;
  const def = card && getCardDef(card.defId);
  const inExtra = Boolean(card && me.extra.includes(card));
  const groups = card ? actionGroups(actions, card, inExtra) : new Map<string, Action[]>();
  const group = selection?.kind === "card" ? selection.group : undefined;
  const choices = group ? groups.get(group) : undefined;
  const targets = new Set(choices?.map(targetOf).filter((uid): uid is string => Boolean(uid)));
  const act = (action: Action) => {
    if (!humanTurn) return;
    close();
    onAct(action);
  };
  const inspect = (item: CardInstance) => {
    const target = choices?.find((option) => targetOf(option) === item.uid);
    if (target) act(target);
    else setSelection({ kind: "card", uid: item.uid });
  };
  const openPile = (owner: PlayerId, pile: Pile) => setSelection({ kind: "pile", owner, pile });
  const boardProps = { state, selectedUid: card?.uid, available, targets, onSelect: inspect };
  const pile = selection?.kind === "pile" ? selection : null;
  const pileName = pile?.pile === "extra" ? "额外卡组" : pile?.owner === 0 ? "我方墓地" : "对方墓地";

  return <main className="rd-screen">
    <header className="rd-match-header">
      <h1>{encounterName ?? "自由决斗"}</h1>
      <button type="button" className="rd-link" onClick={onExit}>返回大厅</button>
    </header>
    {objective && <p className="rd-objective"><strong>本关提示</strong> {objective}</p>}
    <div className="rd-layout">
      <div className="rd-table">
        <FieldBoard {...boardProps} onPile={openPile} />
        <PromptBar state={state} actions={actions} onAct={act} />
        <ChainStack state={state} />
        <HandDock {...boardProps} />
      </div>
      <aside className={`rd-inspector ${card || pile ? "is-open" : ""}`} aria-label="卡牌详情与行动">
        {card && def ? <>
          <div className="rd-inspector-head">
            <small>{cardLocation(state, card)} · {cardType(def)}</small>
            <button type="button" className="rd-link" onClick={close}>收起</button>
          </div>
          <h2>{def.name}</h2>
          {def.kind === "monster" && <p className="rd-detail-stats">{cardStats(state, card, true)}{def.monsterType === "xyz" && ` · 素材 ${card.overlays?.length ?? 0}`}</p>}
          <p className="rd-effect">{def.text}</p>
          {choices ? <>
            <div className="rd-inspector-head"><h3>{group}</h3>
              <button type="button" className="rd-link" onClick={() => setSelection({ kind: "card", uid: card.uid })}>返回动作</button>
            </div>
            <p className="rd-muted">{targets.size ? "选择目标以执行" : "选择素材组合以执行"}</p>
            <div className="rd-choices">{choices.map((option) =>
              <button type="button" key={JSON.stringify(option)} onClick={() => act(option)}>{choiceLabel(state, option, inExtra)}</button>)}</div>
          </> : <>
            <div className="rd-actions">
              {[...groups].map(([name, options]) => <button type="button" key={name} onClick={() => {
                const first = options[0]!;
                if (options.length === 1 && !choiceLabel(state, first, inExtra)) act(first);
                else setSelection({ kind: "card", uid: card.uid, group: name });
              }}>{name}</button>)}
            </div>
            {humanTurn && card.owner === 0 && groups.size === 0 && <p className="rd-muted">当前没有可执行的动作</p>}
            {inExtra && <button type="button" className="rd-link" onClick={() => openPile(0, "extra")}>返回额外卡组</button>}
          </>}
        </> : pile ? <>
          <div className="rd-inspector-head"><h2>{pileName}</h2><button type="button" className="rd-link" onClick={close}>收起</button></div>
          <div className="rd-pile-cards">{state.players[pile.owner][pile.pile].map((item) =>
            <CardView key={item.uid} card={item} state={state} available={available.has(item.uid)} onSelect={inspect} />)}</div>
          {!state.players[pile.owner][pile.pile].length && <p className="rd-muted">没有卡牌</p>}
        </> : <div className="rd-idle">
          <h2>卡牌详情</h2>
          <p>点选卡牌查看效果。金色标记的卡牌可以行动。</p>
          {state.prompt.kind === "respond" && humanTurn && <p>选择一张可发动的速攻魔法或陷阱加入连锁。</p>}
        </div>}
      </aside>
    </div>
    <details className="rd-log"><summary>决斗记录</summary>
      <ol>{state.log.map((line, index) => <li key={index}>{line}</li>)}</ol>
    </details>
  </main>;
}
