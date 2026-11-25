import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FightApp } from "../../src/fight/FightApp";
import { fighterGuide } from "../../src/fight/data/copy";
import { ROSTER, getFighterDef } from "../../src/fight/data/roster";
import { SelectScreen } from "../../src/fight/ui/SelectScreen";

describe("格斗选人", () => {
  it("可选英雄、对战对象并开始", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onP2 = vi.fn();
    const onVersus = vi.fn();
    const { unmount } = render(
      <SelectScreen p1="Ahri" p2="Garen" versus="ai" difficulty="normal"
        onP1={vi.fn()} onP2={onP2} onVersus={onVersus} onDifficulty={vi.fn()} onStart={onStart} />,
    );
    const cpu = screen.getByRole("region", { name: "CPU" });
    await user.click(within(cpu).getByRole("button", { name: "亚索" }));
    expect(onP2).toHaveBeenCalledWith("Yasuo");
    await user.click(screen.getByRole("button", { name: "本地双人" }));
    expect(onVersus).toHaveBeenCalledWith("local");
    await user.click(screen.getByRole("button", { name: "开始对战" }));
    expect(onStart).toHaveBeenCalled();
    unmount();
  });

  it("同英雄可各自选择，换人立即更新本席位的招式及实际按键", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FightApp />);
    const p1 = within(screen.getByRole("region", { name: "P1" }));
    const p2 = within(screen.getByRole("region", { name: "P2" }));
    await user.click(p2.getByRole("button", { name: "阿狸" }));
    expect(p1.getByText("欺诈宝珠")).toBeVisible();
    expect(p2.getByText("欺诈宝珠")).toBeVisible();
    expect(p1.getByText("S › S+D › D+J")).toBeVisible();
    expect(p2.getByText("↓ › ↓+← › ←+[")).toBeVisible();
    const katarina = p2.getByRole("button", { name: "卡特琳娜" });
    katarina.focus();
    await user.keyboard("{Enter}");
    expect(katarina).toHaveAttribute("aria-pressed", "true");
    expect(p2.getByText("瞬步")).toBeVisible();
    expect(p2.getByText("↓ › ↓+→ › →+]")).toBeVisible();
    unmount();
  });

  it("八名英雄的招牌技都来自可用招式数据", () => {
    for (const id of ROSTER) {
      const guide = fighterGuide(id, "p1", 1, "local");
      expect(getFighterDef(id).specials.map((special) => special.name)).toContain(guide.name);
      expect(guide.keys).not.toContain("undefined");
      expect(guide.tip).not.toBe("");
    }
  });
});
