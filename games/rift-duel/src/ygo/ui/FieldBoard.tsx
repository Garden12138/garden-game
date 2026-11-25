import { getDeck } from "../data/decks";
import type { PlayerId } from "../engine/types";
import { CardView } from "./CardView";
import type { BoardSelection } from "./HandDock";

export type Pile = "extra" | "gy";
type FieldProps = BoardSelection & {
  onPile: (owner: PlayerId, pile: Pile) => void;
};

export function FieldBoard({ state, selectedUid, available, targets, onSelect, onPile }: FieldProps) {
  return <div className="rd-board">
    {([1, 0] as const).map((id) => {
      const player = state.players[id];
      const mine = id === 0;
      const side = mine ? "我方" : "对方";
      const rows = mine ? (["monsters", "spells"] as const) : (["spells", "monsters"] as const);
      const extraReady = player.extra.some((card) => available.has(card.uid));
      return <section key={id} aria-label={`${side}场地`} className={`rd-side ${mine ? "is-mine" : "is-foe"}`}>
        <header className="rd-side-head">
          <div><b>{side} · {getDeck(player.deckId).name}</b><strong className="rd-lp">LP {player.lp}</strong></div>
          <div className="rd-piles">
            <span>牌库 {player.deck.length}</span>
            {!mine && <span>手牌 {player.hand.length}</span>}
            {mine ? <button className={extraReady ? "can-act" : ""} onClick={() => onPile(id, "extra")}>额外卡组 {player.extra.length}</button> : <span>额外 {player.extra.length}</span>}
            <button disabled={!player.gy.length} onClick={() => onPile(id, "gy")}>{side}墓地 {player.gy.length}</button>
          </div>
        </header>
        {rows.map((row) => <div className="rd-field-row" key={row}>
          <span className="rd-row-name">{row === "monsters" ? "怪兽" : "魔陷"}</span>
          {player[row].map((card, index) => card ?
            <CardView key={index} state={state} card={card} selected={card.uid === selectedUid}
              available={available.has(card.uid)} target={targets.has(card.uid)} onSelect={onSelect} /> :
            <span aria-hidden="true" className="rd-empty" key={index} />)}
        </div>)}
        {player.field && <div className="rd-field-spell">场地魔法
          <CardView state={state} card={player.field} selected={player.field.uid === selectedUid}
            available={available.has(player.field.uid)} target={targets.has(player.field.uid)} onSelect={onSelect} />
        </div>}
      </section>;
    })}
  </div>;
}
