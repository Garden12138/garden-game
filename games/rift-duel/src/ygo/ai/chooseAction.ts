import { getCardDef } from "../data/cards";
import { computedAtk, computedDef, findOnField, occupiedMonsters, other } from "../engine/helpers";
import { legalActions } from "../engine/legal";
import type { Action, CardInstance, DuelState } from "../engine/types";

function battlePower(state: DuelState, card: CardInstance): number {
  if (card.face === "down" && card.owner !== state.prompt.actor) return 1500;
  return card.position === "atk" ? computedAtk(state, card) : computedDef(card);
}

function valueActions(state: DuelState): (action: Action) => number {
  const me = state.players[state.prompt.actor];
  const foe = state.players[other(me.id)];
  const foes = occupiedMonsters(foe);
  const friends = occupiedMonsters(me);
  const fieldCard = (uid?: string) => uid ? findOnField(state, uid)?.card : undefined;
  const ownCard = (uid: string) => me.hand.find((c) => c.uid === uid) ?? fieldCard(uid);
  const attacker = fieldCard(state.attack?.attackerUid);
  const defender = fieldCard(state.attack?.targetUid);
  const foeAttacks = attacker && attacker.owner === foe.id;
  const attackPower = attacker ? computedAtk(state, attacker) : 0;
  const blocked = state.chain.some((link) => link.effect === "negateAttack" ||
    (link.effect === "returnToHand" && link.targets.includes(defender?.uid ?? "")));
  const incomingDamage = !foeAttacks || blocked ? 0 : !defender ? attackPower
    : defender.position === "atk" ? Math.max(0, attackPower - battlePower(state, defender)) : 0;
  const threat = (target: CardInstance) => {
    if (state.chain.some((link) => link.controller === foe.id && link.targets.includes(target.uid) &&
      (link.effect === "destroyTarget" || link.effect === "detachDestroy"))) return true;
    return foeAttacks && !blocked && defender?.uid === target.uid &&
      attackPower >= battlePower(state, target) && (target.position === "atk" || attackPower > battlePower(state, target));
  };
  const strongestFoe = Math.max(0, ...foes.map((c) => battlePower(state, c)));
  const equipBoost = me.hand.reduce((sum, card) => {
    const def = getCardDef(card.defId);
    return sum + (def.resolve === "equipBuff" ? def.resolveValue ?? 0 : 0);
  }, 0);
  const fourOnField = friends.filter((card) => card.face === "up" && getCardDef(card.defId).level === 4).length;
  const fourInHand = me.hand.filter((card) => getCardDef(card.defId).level === 4).length;
  const deployments = Number(!state.normalSummonUsed) + me.hand.filter((card) => card.defId === "teleport").length;
  const preparingXyz = me.deckId === "noxus" && me.extra.length > 0 &&
    fourOnField < 2 && fourOnField + Math.min(fourInHand, deployments) >= 2;
  const tributeValue = (uids: string[]) => uids.reduce((sum, uid) => {
    const card = fieldCard(uid);
    return sum + (card ? computedAtk(state, card) : 0);
  }, 0);

  function activateValue(action: Extract<Action, { type: "activate" }>): number {
    const card = ownCard(action.uid)!;
    const def = getCardDef(card.defId);
    const targetUid = action.targets[0];
    const target = targetUid ? ownCard(targetUid) : undefined;
    if (action.fusionId) {
      const atk = getCardDef(action.fusionId).atk ?? 0;
      const lostAttack = tributeValue(action.materials ?? []);
      return lostAttack >= atk && !strongestFoe ? -1 : 112 + (atk - lostAttack) / 1000;
    }
    switch (def.resolve) {
      case "damageLp":
      case "detachDamage":
        return (def.resolveValue ?? 0) >= foe.lp ? 300 : 88;
      case "destroyTarget":
      case "detachDestroy": {
        if (def.resolve === "detachDestroy" && card.overlays?.length === 1 && target?.owner === foe.id) {
          const directLethal = foes.length === 1 && state.phase === "main1" &&
            friends.reduce((total, ally) => total + (ally.position === "atk" ? computedAtk(state, ally) : 0), 0) >= foe.lp;
          // Keep the final material for a threat that cannot be cleared in combat.
          if (!directLethal && battlePower(state, target) < computedAtk(state, card)) return -1;
        }
        return target?.owner === foe.id && !target.protectedUntilEnd ? 90 + battlePower(state, target) / 1000 : -1;
      }
      case "destroySpellTrap":
        return target?.owner === foe.id ? (target.face === "down" ? 78 : 82) : -1;
      case "negateAttack":
        return foeAttacks && !blocked && (incomingDamage > 0 || (defender && threat(defender))) ? 108 : -1;
      case "returnToHand":
      case "protectDestroy": {
        if (!target || target.owner !== me.id || target.protectedUntilEnd || !threat(target)) return -1;
        const saved = state.chain.some((link) => link.controller === me.id && link.targets.includes(target.uid) &&
          (link.effect === "returnToHand" || link.effect === "protectDestroy"));
        if (saved) return -1;
        if (def.resolve === "returnToHand") {
          return incomingDamage >= me.lp && defender?.uid === target.uid ? 190 : 72;
        }
        return 85;
      }
      case "atkBuff":
        if (!target) return -1;
        if (target.owner === me.id) return def.monsterType === "xyz" ? 74 : -1;
        // A face-down monster has no public combat stats to judge a debuff by.
        if (target.face === "down" || state.chain.some((link) => link.effect === "atkBuff" && link.targets.includes(target.uid))) return -1;
        if (state.prompt.kind === "respond") {
          if (blocked || !attacker || (attacker.uid !== target.uid && defender?.uid !== target.uid)) return -1;
          if (foeAttacks) return incomingDamage > 0 || (defender && threat(defender)) ? 95 : -1;
          if (!defender || defender.position !== "atk") return -1;
          const margin = attackPower - computedAtk(state, defender);
          return margin <= 0 || (margin < foe.lp && margin + 800 >= foe.lp) ? 95 : -1;
        }
        return friends.some((ally) => ally.position === "atk" && computedAtk(state, ally) <= computedAtk(state, target) &&
          computedAtk(state, ally) + 800 > computedAtk(state, target)) ? 69 : -1;
      case "equipBuff":
        return target?.face === "up" && target.position === "atk" ? 82 + computedAtk(state, target) / 1000 : -1;
      case "addFromGy": {
        const recovered = me.gy.find((c) => c.uid === targetUid);
        if (!recovered) return -1;
        const recoveredDef = getCardDef(recovered.defId);
        if (recoveredDef.monsterType === "fusion" || recoveredDef.monsterType === "synchro" || recoveredDef.monsterType === "xyz") return -1;
        const missingMaterial = me.extra.some((extra) => getCardDef(extra.defId).fusionMaterials?.includes(recovered.defId));
        return 55 + (missingMaterial ? 5 : 0) + (recoveredDef.atk ?? 0) / 1000;
      }
      case "specialSummonHand":
        return target ? (preparingXyz ? 125 : 66) + (getCardDef(target.defId).atk ?? 0) / 1000 : -1;
      default:
        return def.spellType === "field" && !me.field ? 64 : -1;
    }
  }

  return (action) => {
    switch (action.type) {
      case "activate":
        return activateValue(action);
      case "xyzSummon": {
        const def = getCardDef(action.extraId);
        const hits = action.materials.length;
        const burn = (def.resolve === "detachDamage" || def.resolve === "damageLp") ? (def.resolveValue ?? 0) * hits : 0;
        if (burn && (burn >= foe.lp || (!foes.length && (def.atk ?? 0) + burn >= foe.lp))) return 220;
        const clearable = foes.filter((c) => c.face === "up" && !c.protectedUntilEnd &&
          (def.resolve === "detachDestroy" || (def.resolve === "destroyTarget" && computedAtk(state, c) <= (def.resolveValue ?? 0))));
        return 99 + (clearable.length ? 10 : 0) + burn / 1000 + (def.atk ?? 0) / 10000;
      }
      case "synchroSummon":
        return 98 + ((getCardDef(action.extraId).atk ?? 0) - tributeValue(action.materials)) / 1000;
      case "attack": {
        const source = fieldCard(action.attackerUid)!;
        const atk = computedAtk(state, source);
        if (action.targetUid === "direct") return atk >= foe.lp ? 250 : atk > 0 ? 80 + atk / 1000 : -1;
        const target = fieldCard(action.targetUid)!;
        const margin = atk - battlePower(state, target);
        if (target.position === "atk" && margin >= foe.lp) return 250;
        if (margin < 0 || (target.protectedUntilEnd && (margin === 0 || target.position === "def"))) return -1;
        if (margin === 0 && (target.position === "def" || source.overlays?.length)) return -1;
        return 70 + margin / 1000 + (target.face === "up" ? 2 : 0);
      }
      case "normalSummon":
      case "setMonster": {
        const card = ownCard(action.uid)!;
        const def = getCardDef(card.defId);
        const atk = (def.atk ?? 0) + (card.defId === "garen" && friends.every((c) => getCardDef(c.defId).race === "Warrior") ? 400 : 0)
          + (card.defId === "jinx" && !friends.length ? 500 : 0);
        const cost = tributeValue(action.tributes);
        if (cost && atk <= cost) return -1;
        if (preparingXyz && def.level === 4 && action.type === "normalSummon") return 130 + atk / 1000;
        if (action.type === "setMonster") return strongestFoe > atk + equipBoost && (def.def ?? 0) > atk ? 52 + (def.def ?? 0) / 1000 : -1;
        const onSummon = card.defId === "ahri" || (card.defId === "blitzcrank" && foes.some((c) => c.face === "up" && c.position === "atk" && computedDef(c) < computedAtk(state, c)));
        const canChallenge = strongestFoe > 0 && atk + equipBoost >= strongestFoe;
        return 49 + (atk - cost) / 1000 + (onSummon ? 5 : 0) + (canChallenge ? 5 : 0);
      }
      case "setSpellTrap":
        return getCardDef(ownCard(action.uid)!.defId).kind === "trap" ? 20 : -1;
      case "changePosition": {
        const card = fieldCard(action.uid)!;
        const atk = computedAtk(state, card);
        if (card.position === "def") return !foes.length || atk >= strongestFoe ? 35 : -1;
        return atk < strongestFoe && computedDef(card) > atk ? 30 : -1;
      }
      case "nextPhase":
      case "respondPass":
        return 0;
    }
  };
}

export function chooseAiAction(state: DuelState): Action {
  const actions = legalActions(state);
  if (!actions.length) throw new Error("AI has no legal actions");
  const score = valueActions(state);
  let best = actions[0]!;
  let bestValue = score(best);
  for (const action of actions.slice(1)) {
    const value = score(action);
    if (value > bestValue) {
      best = action;
      bestValue = value;
    }
  }
  return best;
}
