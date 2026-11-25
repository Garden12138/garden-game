import type { CardInstance, DuelState } from "../engine/types";
import { CardView } from "./CardView";

export type BoardSelection = {
  state: DuelState;
  selectedUid?: string;
  available: Set<string>;
  targets: Set<string>;
  onSelect: (card: CardInstance) => void;
};

export function HandDock({ state, selectedUid, available, targets, onSelect }: BoardSelection) {
  const hand = state.players[0].hand;
  return (
    <section aria-label="我的手牌" className="rd-hand-zone">
      <h2>我的手牌 <small>{hand.length}</small></h2>
      <div className="rd-hand">
        {hand.map((card) => <CardView key={card.uid} card={card} state={state} selected={card.uid === selectedUid}
          available={available.has(card.uid)} target={targets.has(card.uid)} onSelect={onSelect} />)}
        {!hand.length && <p className="rd-muted">手牌已空</p>}
      </div>
    </section>
  );
}
