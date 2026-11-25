import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CAMPAIGN_STAGES } from "../../src/ygo/data/campaign";
import { LobbyScreen } from "../../src/ygo/ui/LobbyScreen";
import { ResultScreen } from "../../src/ygo/ui/ResultScreen";
import { duel } from "./helpers";

describe("峡谷决斗大厅", () => {
  it("lists the precons and starts a duel", async () => {
    const user = userEvent.setup();
    const onDeck = vi.fn();
    const onStart = vi.fn();
    render(
      <LobbyScreen deckId="piltover" onDeck={onDeck} onStart={onStart} />,
    );

    expect(screen.getByRole("button", { name: /德玛西亚军势/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /皮城工坊/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /暗影虚空/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /艾欧尼亚同调/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /诺克萨斯超量/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /符文叠层/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /德玛西亚军势/ }));
    expect(onDeck).toHaveBeenCalledWith("demacia");

    await user.click(screen.getByRole("button", { name: "开始决斗" }));
    expect(onStart).toHaveBeenCalled();
  });

  it("unlocks the next campaign challenge and keeps earlier stages playable", async () => {
    const user = userEvent.setup();
    const onChallenge = vi.fn();
    render(<LobbyScreen deckId="piltover" onDeck={vi.fn()} onStart={vi.fn()} campaignProgress={1} onChallenge={onChallenge} />);

    await user.click(screen.getByRole("button", { name: "德玛西亚军势，再次挑战" }));
    await user.click(screen.getByRole("button", { name: "诺克萨斯超量，开始挑战" }));
    expect(onChallenge.mock.calls).toEqual([["demacia"], ["noxus"]]);
    expect(screen.getByRole("button", { name: "暗影虚空，尚未解锁" })).toBeDisabled();
  });
});

describe("战役结算", () => {
  it("offers a retry after a loss, the next stage after a win and the lobby after the finale", async () => {
    const user = userEvent.setup();
    const state = duel("piltover", "demacia");
    const actions = { onRematch: vi.fn(), onLobby: vi.fn(), onNext: vi.fn() };
    const first = CAMPAIGN_STAGES[0]!;
    const final = CAMPAIGN_STAGES[CAMPAIGN_STAGES.length - 1]!;
    const { rerender } = render(<ResultScreen state={{ ...state, winner: 1 }} stage={first} {...actions} />);

    await user.click(screen.getByRole("button", { name: "重试本关" }));
    expect(actions.onRematch).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "挑战下一关" })).toBeNull();

    rerender(<ResultScreen state={{ ...state, winner: 0 }} stage={first} {...actions} />);
    await user.click(screen.getByRole("button", { name: "挑战下一关" }));
    expect(actions.onNext).toHaveBeenCalledOnce();

    rerender(<ResultScreen state={{ ...state, winner: 0 }} stage={final} {...actions} />);
    expect(screen.getByRole("heading", { name: "战役全通关" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "挑战下一关" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "返回大厅" }));
    expect(actions.onLobby).toHaveBeenCalledOnce();
  });
});
