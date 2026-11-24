import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FightApp } from "../../src/fight/FightApp";

describe("独立游戏入口", () => {
  it("从选人进入对局，暂停后返回原来的选人设置", () => {
    vi.useFakeTimers();
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    try {
      render(<FightApp />);
      fireEvent.click(screen.getByRole("button", { name: "本地双人" }));
      fireEvent.click(screen.getByRole("button", { name: "开始对战" }));
      expect(screen.getByText("VS")).toBeVisible();
      act(() => vi.advanceTimersByTime(1600));

      expect(screen.getByLabelText("格斗场地")).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "暂停" }));
      fireEvent.click(screen.getByRole("button", { name: "返回选人" }));

      expect(screen.getByRole("heading", { name: "P2" })).toBeVisible();
      expect(screen.getByRole("button", { name: "开始对战" })).toBeVisible();
    } finally {
      context.mockRestore();
      vi.useRealTimers();
    }
  });
});
