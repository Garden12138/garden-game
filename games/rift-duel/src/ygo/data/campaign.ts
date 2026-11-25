import type { PlayerId } from "../engine/types";

export interface CampaignStage {
  id: string;
  name: string;
  opponentDeckId: string;
  featuredCard: string;
  firstPlayer: PlayerId;
  seed: number;
  briefing: string;
  objective: string;
}

export const CAMPAIGN_DECK_ID = "piltover";

export const CAMPAIGN_STAGES: readonly CampaignStage[] = [
  {
    id: "demacia",
    name: "德玛西亚军势",
    opponentDeckId: "demacia",
    featuredCard: "garen",
    firstPlayer: 0,
    seed: 1649,
    briefing: "盖伦带着无尽之刃上阵。你先攻，蔚、金克丝和海克斯融合都在手里。",
    objective: "用海克斯融合召出皮城双杰。留意盖伦装备后的攻击力，提前盖好屏障。",
  },
  {
    id: "noxus",
    name: "诺克萨斯超量",
    opponentDeckId: "noxus",
    featuredCard: "noxusReign",
    firstPlayer: 0,
    seed: 226,
    briefing: "诺克萨斯用传送凑齐两只四星怪兽，既能拆掉你的主力，也能直接削减生命。",
    objective: "注意对面的第二只四星怪兽。霸权发动破坏时，可以用盖好的屏障保护目标。",
  },
  {
    id: "shadow",
    name: "暗影虚空",
    opponentDeckId: "shadow",
    featuredCard: "shadowTwin",
    firstPlayer: 1,
    seed: 16844,
    briefing: "暗影先攻。影流双生有 2800 攻，但守备只有 2000。",
    objective: "通常召唤蒸汽机器人可以把对手转为守备。看看双杰能否攻破这道防线。",
  },
];

export const CAMPAIGN_PROGRESS_KEY = "rift-duel.campaign.completed.v1";

export function readCampaignProgress(): number {
  try {
    const count = Number(window.localStorage.getItem(CAMPAIGN_PROGRESS_KEY));
    return Number.isInteger(count) && count >= 0 ? Math.min(count, CAMPAIGN_STAGES.length) : 0;
  } catch {
    return 0;
  }
}

export function recordCampaignWin(completed: number): number {
  const highest = Math.max(readCampaignProgress(), completed);
  try {
    window.localStorage.setItem(CAMPAIGN_PROGRESS_KEY, String(highest));
  } catch {
    // Progress still applies to this session when browser storage is unavailable.
  }
  return highest;
}
