import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FightApp } from "../../src/fight/FightApp";
import { createFight } from "../../src/fight/engine/createFight";
import * as engine from "../../src/fight/engine/tick";
import * as renderer from "../../src/fight/render/drawMatch";
import { MatchScreen } from "../../src/fight/ui/MatchScreen";
import { ResultScreen } from "../../src/fight/ui/ResultScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("独立游戏入口", () => {
  it("默认同键盘双人，比赛中可以用 Esc 查双方按键并保留选人设置", () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<FightApp />);
    expect(screen.getByRole("button", { name: "本地双人", pressed: true })).toBeVisible();
    const right = screen.getByRole("region", { name: "P2" });
    fireEvent.click(within(right).getByRole("button", { name: "锤石" }));
    fireEvent.click(screen.getByRole("button", { name: "开始对战" }));
    expect(screen.getByText("VS")).toBeVisible();
    act(() => vi.advanceTimersByTime(1600));

    expect(screen.getByRole("meter", { name: "P2 体力" })).toBeVisible();
    fireEvent.keyDown(window, { code: "Escape" });
    const dialog = screen.getByRole("dialog", { name: "暂停" });
    expect(within(dialog).getByText("欺诈宝珠")).toBeVisible();
    expect(within(dialog).getByText("死亡宣判")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "继续" })).toHaveFocus();
    fireEvent.keyDown(window, { code: "Escape", repeat: true });
    expect(dialog).toBeVisible();
    fireEvent.keyDown(window, { code: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText("格斗场地")).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    fireEvent.click(screen.getByRole("button", { name: "返回选人" }));
    expect(within(screen.getByRole("region", { name: "P2" })).getByRole("button", { name: "锤石", pressed: true })).toBeVisible();
  });

  it("换边后，暂停按当前朝向显示 P1 并区分 CPU 的输入", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const state = createFight({ p1: "Katarina", p2: "Ahri", versus: "ai", aiDifficulty: "easy" });
    state.fighters[0].facing = -1;
    state.fighters[1].facing = 1;
    render(<MatchScreen initial={state} onDone={vi.fn()} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    const player = within(screen.getByRole("region", { name: "P1 招式提示" }));
    const cpu = within(screen.getByRole("region", { name: "CPU 招式提示" }));
    expect(player.getByText("面朝左")).toBeVisible();
    expect(player.getByText("S › S+D › D+K")).toBeVisible();
    expect(cpu.getByText("面朝右 · 电脑操控")).toBeVisible();
    expect(cpu.getByText("↓ › ↓+→ › →+拳")).toBeVisible();
  });

  it("人机结算可以交换英雄再战，或用相同设置一键重赛", () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
    vi.spyOn(renderer, "drawMatch").mockImplementation(() => {});
    const step = vi.spyOn(engine, "tick").mockImplementation((state) => ({ ...state, wins: [0, 2], phase: "matchOver" }));
    render(<FightApp />);
    fireEvent.click(screen.getByRole("button", { name: "打电脑" }));
    fireEvent.click(screen.getByRole("button", { name: "难" }));
    fireEvent.click(screen.getByRole("button", { name: "开始对战" }));
    function finishMatch() {
      act(() => vi.advanceTimersByTime(1600));
      act(() => vi.advanceTimersByTime(40));
    }
    finishMatch();
    expect(screen.getByRole("heading", { name: "CPU · 盖伦 获胜" })).toBeVisible();
    expect(screen.getByText("P1 0 - 2 CPU")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "交换英雄再战" }));
    finishMatch();
    expect(screen.getByRole("heading", { name: "CPU · 阿狸 获胜" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "再来一局" }));
    finishMatch();
    const last = step.mock.calls.at(-1)![0];
    expect(last).toMatchObject({ versus: "ai", aiDifficulty: "hard", wins: [0, 0] });
    expect(last.fighters.map((fighter) => fighter.id)).toEqual(["Garen", "Ahri"]);
    fireEvent.click(screen.getByRole("button", { name: "重新选人" }));
    expect(screen.getByRole("button", { name: "难", pressed: true })).toBeVisible();
    expect(within(screen.getByRole("region", { name: "P1" })).getByRole("button", { name: "盖伦", pressed: true })).toBeVisible();
  });

  it("镜像对局结算按席位区分同名英雄", () => {
    const state = createFight({ p1: "Ahri", p2: "Ahri", versus: "local", aiDifficulty: "normal" });
    state.wins = [1, 2];
    render(<ResultScreen state={state} onRematch={vi.fn()} onSwap={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "P2 · 阿狸 获胜" })).toBeVisible();
  });
});
