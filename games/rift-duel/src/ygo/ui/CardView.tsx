import { getCardDef } from "../data/cards";
import { computedAtk, computedDef } from "../engine/helpers";
import type { CardDef, CardInstance, DuelState } from "../engine/types";
import { cardLabel } from "./duelChoices";

export function cardArt(defId: string): string | undefined {
  const champ = getCardDef(defId).championId;
  if (!champ) return undefined;
  const base = import.meta.env.DEV ? "/ddragon" : "https://ddragon.leagueoflegends.com";
  return `${base}/cdn/img/champion/loading/${champ}_0.jpg`;
}

export function cardType(def: CardDef): string {
  if (def.kind === "trap") return "陷阱";
  if (def.kind === "spell") {
    const names = { normal: "通常魔法", quick: "速攻魔法", equip: "装备魔法", field: "场地魔法", continuous: "永续魔法" };
    return names[def.spellType ?? "normal"];
  }
  const names = { normal: "通常怪兽", effect: "效果怪兽", fusion: "融合怪兽", synchro: "同调怪兽", xyz: "超量怪兽" };
  return def.tuner ? "调整怪兽" : names[def.monsterType ?? "normal"];
}

export function cardStats(state: DuelState, card: CardInstance, detailed = false): string {
  const def = getCardDef(card.defId);
  if (def.kind !== "monster") return cardType(def);
  const inPlay = state.players[card.owner].monsters.some((item) => item?.uid === card.uid) && card.face === "up";
  const atk = inPlay ? computedAtk(state, card) : def.atk;
  const defense = inPlay ? computedDef(card) : def.def;
  if (detailed) {
    const races = { Warrior: "战士族", Spellcaster: "魔法师族", Beast: "兽族", Dragon: "龙族", Machine: "机械族", Fiend: "恶魔族", Fairy: "天使族", Plant: "植物族" };
    const level = def.rank ? `${def.rank} 阶` : `${def.level} 星`;
    return `${def.race ? races[def.race] + " · " : ""}${level} · 攻击 ${atk} / 守备 ${defense}`;
  }
  return `${def.rank ? `阶 ${def.rank}` : `★${def.level}`} · ${atk}/${defense}`;
}

type CardViewProps = {
  card: CardInstance;
  state: DuelState;
  onSelect: (card: CardInstance) => void;
  selected?: boolean;
  available?: boolean;
  target?: boolean;
};

export function CardView({ card, state, onSelect, selected, available, target }: CardViewProps) {
  const hidden = card.owner === 1 && card.face === "down";
  const def = getCardDef(card.defId);
  const art = hidden ? undefined : cardArt(def.id);
  const fieldMonster = state.players[card.owner].monsters.some((item) => item?.uid === card.uid);
  const classes = ["rd-card", hidden && "rd-card--back", selected && "is-selected", available && "can-act", target && "is-target"].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} disabled={hidden && !target}
      aria-label={cardLabel(state, card.uid)} aria-pressed={Boolean(selected)}
      onClick={() => onSelect(card)}>
      {art && <span className="rd-card-art" aria-hidden="true" style={{ backgroundImage: `url("${art}")` }} />}
      {hidden ? <span className="rd-backed">盖放</span> : <>
        <span className="rd-card-tag">
          {card.face === "down" ? "已盖放" : fieldMonster ? (card.position === "def" ? "守备" : "攻击") : cardType(def)}
          {(card.overlays?.length ?? 0) > 0 && ` · 素材 ${card.overlays?.length}`}
        </span>
        <strong>{def.name}</strong>
        {def.kind === "monster" && <small>{cardStats(state, card)}</small>}
      </>}
    </button>
  );
}
