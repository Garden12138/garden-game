import type { CardKind, Identity, Winner } from "../engine/types";

export const GAME_TITLE = "峡谷身份战";

export const IDENTITY_NAMES: Record<Identity, string> = {
  baron: "男爵",
  vanguard: "先锋",
  invader: "入侵者",
  shadow: "影刃",
};

export const IDENTITY_GOALS: Record<Identity, string> = {
  baron: "你的身份公开。与先锋一起消灭入侵者和影刃。误杀先锋会失去全部手牌。",
  vanguard: "保护公开的男爵，协助消灭入侵者和影刃。即使你阵亡，也能随男爵阵营获胜。",
  invader: "让男爵阵亡。若届时场上只剩影刃，胜利属于影刃。",
  shadow: "先让先锋和入侵者出局，再击败男爵并独自存活。男爵过早阵亡会让入侵者获胜。",
};

export const CARD_NAMES: Record<CardKind, string> = {
  strike: "普攻",
  dodge: "闪避",
  heal: "治疗",
  barrier: "屏障",
  supply: "补给",
  smite: "惩戒",
  plunder: "掠夺",
  duel: "单挑",
  stun: "晕眩",
  minionWave: "小兵潮",
  volley: "齐射",
  doransBlade: "多兰之刃",
  infinityEdge: "无尽之刃",
  adaptiveHelm: "自适应头盔",
  thornmail: "荆棘之甲",
  boots: "疾行之靴",
  gargoyle: "石像鬼板甲",
};

export const CARD_RULES: Record<CardKind, string> = {
  strike: "对范围内一人造成 1 点伤害，每回合限一次。",
  dodge: "响应普攻或齐射，抵消一次攻击。",
  heal: "回复 1 点体力，也可在濒死时救人。",
  barrier: "响应一张计谋牌，抵消其效果。",
  supply: "立即摸两张牌。",
  smite: "弃置目标的一张装备或暗手牌。",
  plunder: "从距离 1 的目标取得一张装备或暗手牌。",
  duel: "目标先出普攻，双方轮流出。先放弃者受 1 点伤害。",
  stun: "目标下回合判定，非红桃则跳过出牌。",
  minionWave: "其他目标各出一张普攻，否则受 1 点伤害。",
  volley: "其他目标各出一张闪避，否则受 1 点伤害。",
  doransBlade: "武器。攻击范围变为 2。",
  infinityEdge: "武器。攻击范围变为 3。",
  adaptiveHelm: "护甲。普攻可闪避时，红色判定可挡下此次普攻。",
  thornmail: "护甲。受到普攻伤害时，对攻击者造成 1 点伤害。",
  boots: "你到其他人的距离减 1。",
  gargoyle: "其他人到你的距离加 1。",
};

export const WINNER_NAMES: Record<NonNullable<Winner>, string> = {
  baronSide: "男爵阵营",
  invaders: "入侵者",
  shadow: "影刃",
  duel: "单挑胜者",
  blue: "蓝方",
  red: "红方",
};

export const SUIT_SYMBOL = {
  spade: "♠",
  heart: "♥",
  club: "♣",
  diamond: "♦",
} as const;
