import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YgoApp } from "../../src/ygo/YgoApp";
import { chooseAiAction } from "../../src/ygo/ai/chooseAction";
import { CAMPAIGN_PROGRESS_KEY, readCampaignProgress } from "../../src/ygo/data/campaign";
import { legalActions } from "../../src/ygo/engine/legal";
import type { Action, DuelState } from "../../src/ygo/engine/types";
import type { DuelScreen } from "../../src/ygo/ui/DuelScreen";

let turn: ComponentProps<typeof DuelScreen>;

// Drive the application's normal action callback; lobby, result, AI, rules and storage run together.
vi.mock("../../src/ygo/ui/DuelScreen", () => ({
  DuelScreen: (props: ComponentProps<typeof DuelScreen>) => {
    turn = props;
    return <button data-testid="duel" onClick={props.onExit}>返回大厅</button>;
  },
}));

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function finish(choose: (state: DuelState) => Action) {
  for (let step = 0; step < 300 && screen.queryByTestId("duel"); step++) {
    const { state, onAct } = turn;
    if (state.players[state.prompt.actor].controller === "ai") {
      act(() => vi.advanceTimersToNextTimer());
    } else {
      const actions = legalActions(state);
      expect(actions.length === 1 && actions[0]?.type === "respondPass").toBe(false);
      act(() => onAct(choose(state)));
    }
  }
  expect(screen.queryByTestId("duel")).not.toBeInTheDocument();
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("战役进度", () => {
  it("retries a loss with the same opening and leaves free duel selection independent", () => {
    render(<YgoApp />);
    fireEvent.click(screen.getByRole("button", { name: /艾欧尼亚同调/ }));
    click("德玛西亚军势，开始挑战");
    const initial = turn.state;
    expect(initial.players[0].deckId).toBe("piltover");
    finish((state) => legalActions(state).find((a) => a.type === "nextPhase" || a.type === "respondPass")!);
    expect(screen.getByRole("heading", { name: "落败" })).toBeVisible();
    click("重试本关");
    expect(turn.state).toEqual(initial);
    click("返回大厅");
    expect(screen.getByRole("button", { name: "诺克萨斯超量，尚未解锁" })).toBeDisabled();
    click("开始决斗");
    expect(turn.state.players[0].deckId).toBe("ionia");
    expect(turn.encounterName).toBeUndefined();
    expect(localStorage.getItem(CAMPAIGN_PROGRESS_KEY)).toBeNull();
  });

  it("clears all three challenges, resumes after reload and preserves the highest win on replay", () => {
    render(<YgoApp />);
    click("德玛西亚军势，开始挑战");
    finish(chooseAiAction);
    expect(screen.getByRole("heading", { name: "胜利" })).toBeVisible();
    expect(readCampaignProgress()).toBe(1);
    click("挑战下一关");
    expect(turn.state.players[1].deckId).toBe("noxus");
    expect(turn.state.players.map((p) => p.lp)).toEqual([4000, 4000]);
    expect(turn.state.players.map((p) => p.hand.length)).toEqual([5, 5]);
    cleanup();
    render(<YgoApp />);
    expect(screen.getByRole("button", { name: "诺克萨斯超量，开始挑战" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "暗影虚空，尚未解锁" })).toBeDisabled();
    click("诺克萨斯超量，开始挑战");
    finish((state) => {
      const action = chooseAiAction(state);
      const shield = state.players[0].spells.find((card) => card?.defId === "barrier");
      if (state.prompt.kind === "respond" && action.type === "activate" && action.uid === shield?.uid) {
        return { type: "respondPass" };
      }
      return action;
    });
    expect(screen.getByRole("heading", { name: "落败" })).toBeVisible();
    expect(readCampaignProgress()).toBe(1);
    click("重试本关");
    let counteredRemoval = false;
    finish((state) => {
      const action = chooseAiAction(state);
      if (action.type === "activate" && state.players[0].spells.some((c) => c?.uid === action.uid && c.defId === "barrier")) {
        counteredRemoval ||= state.chain.some((link) => link.effect === "detachDestroy" && link.targets[0] === action.targets[0]);
      }
      return action;
    });
    expect(counteredRemoval).toBe(true);
    expect(readCampaignProgress()).toBe(2);
    click("挑战下一关");
    expect(turn.state.turnPlayer).toBe(1);
    finish(chooseAiAction);
    expect(screen.getByRole("heading", { name: "战役全通关" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "挑战下一关" })).toBeNull();
    expect(readCampaignProgress()).toBe(3);
    click("返回大厅");
    click("德玛西亚军势，再次挑战");
    finish(chooseAiAction);
    expect(readCampaignProgress()).toBe(3);
  });
});
