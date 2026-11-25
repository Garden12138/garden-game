import { getCardDef } from "../data/cards";
import { findAnywhere } from "../engine/helpers";
import type { Action, CardInstance, DuelState } from "../engine/types";

export function cardLocation(state: DuelState, card: CardInstance): string {
  const player = state.players[card.owner];
  const side = card.owner === 0 ? "我方" : "对方";
  const groups = [
    ["怪兽区", player.monsters],
    ["魔陷区", player.spells],
    ["手牌", player.hand],
    ["墓地", player.gy],
    ["额外", player.extra],
  ] as const;
  for (const [name, pile] of groups) {
    const index = pile.findIndex((item) => item?.uid === card.uid);
    if (index >= 0) return `${side}${name} ${index + 1}`;
  }
  return `${side}场地`;
}

export function cardLabel(state: DuelState, uid: string): string {
  if (uid === "direct") return "直接攻击";
  const card = findAnywhere(state, uid);
  if (!card) return "已离场的卡";
  if (card.owner === 1) {
    const foe = state.players[1];
    if (foe.hand.includes(card)) return "对方手牌";
    if (foe.deck.includes(card)) return "对方牌库";
    if (foe.extra.includes(card)) return "对方额外卡组";
    if (card.face === "down") return `${cardLocation(state, card)} · 盖放的卡`;
  }
  return `${cardLocation(state, card)} · ${getCardDef(card.defId).name}`;
}

export function availableForCard(action: Action, card: CardInstance, inExtra: boolean): boolean {
  if (inExtra) {
    if (action.type === "synchroSummon" || action.type === "xyzSummon") return action.extraId === card.defId;
    return action.type === "activate" && action.fusionId === card.defId;
  }
  if (action.type === "attack") return action.attackerUid === card.uid;
  return "uid" in action && action.uid === card.uid;
}

export function actionName(action: Action, card: CardInstance): string {
  switch (action.type) {
    case "normalSummon": return action.tributes.length ? "上级召唤" : "通常召唤";
    case "setMonster": return "盖放守备";
    case "setSpellTrap": return "盖放魔陷";
    case "changePosition":
      if (card.face === "down") return "反转召唤";
      return card.position === "atk" ? "转为守备" : "转为攻击";
    case "attack": return "宣言攻击";
    case "activate": return action.fusionId ? `融合召唤 · ${getCardDef(action.fusionId).name}` : "发动效果";
    case "synchroSummon": return "同调召唤";
    case "xyzSummon": return "超量召唤";
    case "nextPhase": return "下一阶段";
    case "respondPass": return "通过";
  }
}

// Zone order has no game effect. Keep distinct copies, targets, tributes and material choices.
export function actionGroups(actions: Action[], card: CardInstance, inExtra: boolean): Map<string, Action[]> {
  const groups = new Map<string, Action[]>();
  const seen = new Set<string>();
  for (const action of actions) {
    if (!availableForCard(action, card, inExtra)) continue;
    const key = JSON.stringify({ ...action, zone: undefined });
    if (seen.has(key)) continue;
    seen.add(key);
    const name = actionName(action, card);
    const group = groups.get(name) ?? [];
    group.push(action);
    groups.set(name, group);
  }
  return groups;
}

export function targetOf(action: Action): string | undefined {
  if (action.type === "attack") return action.targetUid;
  if (action.type === "activate" && action.targets.length === 1) return action.targets[0];
}

export function choiceLabel(state: DuelState, action: Action, inExtra: boolean): string {
  if (action.type === "attack") return cardLabel(state, action.targetUid);
  if ("tributes" in action && action.tributes.length) {
    return `解放 ${action.tributes.map((uid) => cardLabel(state, uid)).join(" ＋ ")}`;
  }
  if ("materials" in action && action.materials?.length) {
    const source = inExtra && action.type === "activate" ? `${cardLabel(state, action.uid)} · ` : "";
    return `${source}素材 ${action.materials.map((uid) => cardLabel(state, uid)).join(" ＋ ")}`;
  }
  if (action.type === "activate" && action.targets.length) {
    return action.targets.map((uid) => cardLabel(state, uid)).join(" ＋ ");
  }
  return "";
}
