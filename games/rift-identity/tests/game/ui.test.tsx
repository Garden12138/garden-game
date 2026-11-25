import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { createMatch } from "../../src/game/engine/createMatch";
import { GameApp } from "../../src/game/ui/GameApp";
import { PickScreen } from "../../src/game/ui/PickScreen";
import { pickAll } from "./helpers";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("峡谷身份战入口", () => {
  it("opens the lobby at the project root and returns there after starting a match", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "单机 1v1" }));
    expect(screen.queryByRole("button", { name: "单机 1v1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回大厅" }));
    expect(screen.getByRole("heading", { name: "峡谷身份战" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "单机 1v1" })).toBeInTheDocument();
  });

  it("lets the human play a legal strike from a seeded table", () => {
    const started = pickAll(createMatch(2));
    started.players[0]!.championId = "Garen";
    started.players[1]!.championId = "Lux";
    started.players[1]!.equipment = {};
    started.players[0]!.equipment = {};
    started.players[0]!.hand = [{ id: "s1", kind: "strike", suit: "spade", rank: 1 }];
    started.currentPlayer = 0;
    started.strikeUsedThisTurn = false;
    started.phase = "play";
    started.prompt = {
      kind: "playCard",
      actor: 0,
      legalCardIds: [],
      legalTargetIds: [],
      canCancel: false,
      message: "出牌阶段：打出一张牌、发动技能或结束出牌",
    };
    render(<GameApp onExit={() => undefined} initialState={started} />);
    fireEvent.click(screen.getByLabelText(/普攻/));
    fireEvent.click(screen.getByLabelText(/座位 1/));
    expect(screen.getByText(/等待 光辉女郎/)).toBeInTheDocument();
  });

  it("shows Chinese names on pick cards", () => {
    const state = createMatch(2);
    state.prompt.actor = 0;
    state.players[0]!.candidates = ["Garen", "Ahri", "Lux"];
    render(<PickScreen state={state} mySeat={0} onPick={() => undefined} />);
    expect(screen.getByText(/盖伦/)).toBeInTheDocument();
    expect(screen.getByText(/坚韧/)).toBeInTheDocument();
  });

  it("labels blue and red seats in a 2v2 table", () => {
    const started = pickAll(
      createMatch({
        mode: "team",
        seed: 4,
        seatCount: 4,
        controllers: ["human", "ai", "ai", "ai"],
      }),
    );
    render(<GameApp onExit={() => undefined} initialState={started} />);
    expect(screen.getAllByText(/蓝方/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/红方/).length).toBeGreaterThan(0);
  });
});

describe("朋友身份局", () => {
  it("shows a private goal during pick and on the player's own seat", () => {
    const state = createMatch(22);
    const shadow = state.players.find((p) => p.identity === "shadow")!;
    const { unmount } = render(<PickScreen state={state} mySeat={shadow.id} onPick={() => {}} />);
    expect(screen.getByText("你的身份 · 影刃")).toBeVisible();
    expect(screen.getByText(/男爵过早阵亡/)).toBeVisible();
    unmount();
    const started = pickAll(state);
    [started.players[0]!.identity, started.players[shadow.id]!.identity] =
      [started.players[shadow.id]!.identity, started.players[0]!.identity];
    render(<GameApp initialState={started} onExit={() => {}} />);
    fireEvent.click(screen.getByText("我的身份 · 影刃"));
    expect(screen.getByText(/男爵过早阵亡/)).toBeVisible();
    expect(screen.queryByText("入侵者")).not.toBeInTheDocument();
  });

  it("chooses the skill cost and recipient before committing, including seat zero", () => {
    const state = pickAll(createMatch(2));
    state.players[0]!.championId = "Soraka";
    state.currentPlayer = 0;
    state.prompt.actor = 0;
    state.players[0]!.hp = 1;
    state.players[0]!.hand = [{ id: "pay", kind: "dodge", suit: "heart", rank: 8 }];
    render(<GameApp initialState={state} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "星体恩典" }));
    fireEvent.click(screen.getByLabelText("闪避 ♥8"));
    fireEvent.click(screen.getByLabelText(/^座位 0 /));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("闪避 ♥8")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "确认发动" }));
    expect(screen.queryByLabelText("闪避 ♥8")).not.toBeInTheDocument();
    expect(screen.getByText(/发动星体恩典，回复 1 点体力/)).toBeInTheDocument();
  });

  it("shows both public equipment and a face-down hand option in the target area", () => {
    const state = pickAll(createMatch(4));
    state.currentPlayer = 0;
    state.prompt.actor = 0;
    state.players[0]!.hand = [{ id: "sm", kind: "smite", suit: "heart", rank: 1 }];
    for (const other of state.players.slice(1)) other.hand = [];
    state.players[1]!.hand = [{ id: "secret", kind: "heal", suit: "heart", rank: 9 }];
    state.players[1]!.equipment.weapon = { id: "eq", kind: "doransBlade", suit: "club", rank: 4 };
    render(<GameApp initialState={state} onExit={() => {}} />);
    fireEvent.click(screen.getByLabelText("惩戒 ♥1"));
    expect(screen.getByRole("button", { name: "多兰之刃" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "一张暗手牌" }));
    expect(screen.getByRole("button", { name: "结束出牌" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
