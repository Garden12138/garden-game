import { getCardDef } from "../data/cards";
import type { DuelState } from "../engine/types";
import { cardLabel } from "./duelChoices";

export function ChainStack({ state }: { state: DuelState }) {
  if (!state.chain.length && !state.attack) return null;
  return <section className="rd-chain" aria-label="等待结算">
    {state.attack && <p><strong>攻击宣言</strong> {cardLabel(state, state.attack.attackerUid)} → {cardLabel(state, state.attack.targetUid)}</p>}
    {state.chain.length > 0 && <>
      <strong>连锁 · 从上往下结算</strong>
      <ol>{[...state.chain].reverse().map((link, index) =>
        <li key={link.uid + index}>#{state.chain.length - index} {link.controller === 0 ? "我方" : "对方"} · {getCardDef(link.defId).name}
          {link.targets.length > 0 && ` → ${link.targets.map((uid) => cardLabel(state, uid)).join("、")}`}
          {link.fusionId && ` → ${getCardDef(link.fusionId).name}`}
        </li>)}</ol>
    </>}
  </section>;
}
