import { CARD_NAMES, SUIT_SYMBOL } from "../data/copy";
import type { GameCard } from "../engine/types";
import { SpellCardFace } from "./SpellCardFace";

export function HandDock({ hand, enabledIds, selectedIds, onPlay }: {
  hand: GameCard[];
  enabledIds: Set<string>;
  selectedIds: string[];
  onPlay: (card: GameCard) => void;
}) {
  return (
    <div className="rift-hand" aria-label="手牌">
      {hand.map((card) => (
        <button key={card.id} type="button"
          className={`rift-hand__card ${enabledIds.has(card.id) ? "is-legal" : ""}`}
          disabled={!enabledIds.has(card.id)}
          aria-pressed={selectedIds.includes(card.id)}
          onClick={() => onPlay(card)}
          aria-label={`${CARD_NAMES[card.kind]} ${SUIT_SYMBOL[card.suit]}${card.rank}`}
        >
          <SpellCardFace card={card} compact />
        </button>
      ))}
    </div>
  );
}
