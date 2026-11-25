import type { Action, DuelState } from "../engine/types";

const PHASE_LABEL: Record<DuelState["phase"], string> = {
  draw: "抽卡阶段", standby: "准备阶段", main1: "主要阶段 1", battle: "战斗阶段",
  main2: "主要阶段 2", end: "结束阶段", gameOver: "决斗结束",
};

export function PromptBar({ state, actions, onAct }: { state: DuelState; actions: Action[]; onAct: (action: Action) => void }) {
  const next = actions.find((action) => action.type === "nextPhase");
  const pass = actions.find((action) => action.type === "respondPass");
  const responding = state.prompt.kind === "respond";
  const yours = state.prompt.actor === 0;
  const nextName = state.phase === "main1" ? "进入战斗阶段" : state.phase === "battle" ? "进入主要阶段 2" : "结束回合";
  return <div className="rd-prompt">
    <div role="status">
      <small>回合 {state.turn} · {PHASE_LABEL[state.phase]}</small>
      <strong>{responding ? (yours ? "选择响应卡，或通过" : "对方正在响应") : (yours ? "轮到你行动" : "对方行动中")}</strong>
    </div>
    {pass && <button type="button" onClick={() => onAct(pass)}>通过</button>}
    {next && <button type="button" onClick={() => onAct(next)}>{nextName} →</button>}
  </div>;
}
