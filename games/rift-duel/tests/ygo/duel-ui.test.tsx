import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CardInstance, DuelState, PlayerId } from "../../src/ygo/engine/types";
import { DuelScreen } from "../../src/ygo/ui/DuelScreen";
import { duel } from "./helpers";

afterEach(cleanup);

function take(state: DuelState, id: PlayerId, defId: string): CardInstance {
  const player = state.players[id];
  for (const pile of [player.hand, player.deck]) {
    const index = pile.findIndex((item) => item.defId === defId);
    if (index >= 0) return pile.splice(index, 1)[0]!;
  }
  throw new Error(`Missing fixture card ${defId}`);
}

function show(state: DuelState) {
  const onAct = vi.fn();
  render(<DuelScreen state={state} onAct={onAct} onExit={() => {}} encounterName="试炼" objective="留意屏障" />);
  return { user: userEvent.setup(), onAct };
}

function inspector() {
  return within(screen.getByRole("complementary", { name: "卡牌详情与行动" }));
}

describe("决斗中的选择", () => {
  it("inspects a hand card and lets the player choose face-down defense", async () => {
    const state = duel();
    const poppy = state.players[0].hand.find((card) => card.defId === "poppy")!;
    const { user, onAct } = show(state);
    await user.click(screen.getAllByRole("button", { name: /我方手牌 .*圣锤之毅/ })[0]!);
    expect(onAct).not.toHaveBeenCalled();
    expect(inspector().getByText("矮小却极难被击破。")).toBeVisible();
    expect(inspector().getByRole("button", { name: "通常召唤" })).toBeEnabled();
    expect(screen.getByText("留意屏障", { exact: false })).toBeVisible();
    await user.click(inspector().getByRole("button", { name: "盖放守备" }));
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: "setMonster", uid: poppy.uid, tributes: [] }));
  });

  it("chooses an extra monster then one of several pairs of materials", async () => {
    const state = duel("noxus");
    const [a, b, c] = ["draven", "katarina", "leblanc"].map((id) => take(state, 0, id));
    state.players[0].monsters = [a!, b!, c!, null, null];
    const { user, onAct } = show(state);
    await user.click(screen.getByRole("button", { name: /额外卡组/ }));
    await user.click(inspector().getByRole("button", { name: /帝国双刃/ }));
    await user.click(inspector().getByRole("button", { name: "超量召唤" }));
    expect(onAct).not.toHaveBeenCalled();
    await user.click(inspector().getByRole("button", { name: /素材 .*不祥之刃.*诡术妖姬/ }));
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: "xyzSummon", extraId: "noxusBlades", materials: [b!.uid, c!.uid] }));
  });

  it("preserves distinct fusion materials chosen from hand or field", async () => {
    const state = duel("piltover");
    const fist = take(state, 0, "vi");
    state.players[0].monsters[3] = fist;
    state.players[0].hand.push(take(state, 0, "hextechFusion"));
    const { user, onAct } = show(state);
    await user.click(screen.getByRole("button", { name: /我方手牌 .*海克斯融合/ }));
    await user.click(inspector().getByRole("button", { name: "融合召唤 · 皮城双杰" }));
    await user.click(inspector().getAllByRole("button", { name: /素材 我方怪兽区 4 · 皮城执法官/ })[0]!);
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: "activate", fusionId: "piltoverDuo", materials: [fist.uid, expect.any(String)] }));
  });

  it("selects which monster to tribute and can back out before committing", async () => {
    const state = duel("shadow");
    const first = take(state, 0, "zed");
    const second = take(state, 0, "shen");
    state.players[0].monsters = [first, second, null, null, null];
    const { user, onAct } = show(state);
    await user.click(screen.getAllByRole("button", { name: /我方手牌 .*暗黑元首/ })[0]!);
    await user.click(inspector().getByRole("button", { name: "上级召唤" }));
    await user.click(inspector().getByRole("button", { name: "返回动作" }));
    expect(onAct).not.toHaveBeenCalled();
    await user.click(inspector().getByRole("button", { name: "上级召唤" }));
    await user.click(inspector().getByRole("button", { name: /解放 .*暮光之眼/ }));
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: "normalSummon", tributes: [second.uid] }));
  });

  it("lets a player choose which ally to protect rather than using the first target", async () => {
    const state = duel();
    const trap = take(state, 0, "barrier");
    trap.face = "down";
    state.players[0].spells[0] = trap;
    const first = take(state, 0, "garen");
    const second = take(state, 0, "poppy");
    state.players[0].monsters = [first, second, null, null, null];
    state.prompt = { kind: "respond", actor: 0 };
    const { user, onAct } = show(state);
    await user.click(screen.getByRole("button", { name: /我方魔陷区 .*屏障/ }));
    await user.click(inspector().getByRole("button", { name: "发动效果" }));
    await user.click(inspector().getByRole("button", { name: /我方怪兽区 2 · 圣锤之毅/ }));
    expect(onAct).toHaveBeenCalledWith({ type: "activate", uid: trap.uid, targets: [second.uid] });
  });

  it("chooses a specific target on the board and conceals face-down enemy identities", async () => {
    const state = duel();
    state.phase = "battle";
    const attacker = take(state, 0, "garen");
    const other = take(state, 0, "poppy");
    const hidden = take(state, 1, "syndra");
    hidden.face = "down";
    hidden.position = "def";
    state.players[0].monsters = [other, attacker, null, null, null];
    state.players[1].monsters = [take(state, 1, "ahri"), hidden, null, null, null];
    const { user, onAct } = show(state);
    expect(screen.queryByText("暗黑元首")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /我方怪兽区 2 · 德玛西亚之力/ }));
    await user.click(inspector().getByRole("button", { name: "宣言攻击" }));
    await user.click(within(screen.getByRole("region", { name: "对方场地" })).getByRole("button", { name: /对方怪兽区 2 · 盖放的卡/ }));
    expect(onAct).toHaveBeenCalledWith({ type: "attack", attackerUid: attacker.uid, targetUid: hidden.uid });
  });

  it("shows a set card to its owner and lets them activate it during an attack", async () => {
    const state = duel();
    const trap = take(state, 0, "zhonya");
    trap.face = "down";
    state.players[0].spells[1] = trap;
    state.players[1].monsters[0] = take(state, 1, "ahri");
    state.turnPlayer = 1;
    state.phase = "battle";
    state.prompt = { kind: "respond", actor: 0 };
    state.attack = { attackerUid: state.players[1].monsters[0].uid, targetUid: "direct", negated: false };
    const { user, onAct } = show(state);
    expect(screen.getByRole("button", { name: "通过" })).toBeEnabled();
    expect(screen.getByRole("region", { name: "等待结算" })).toHaveTextContent("九尾妖狐");
    await user.click(screen.getByRole("button", { name: /我方魔陷区 2 · 金身/ }));
    await user.click(inspector().getByRole("button", { name: "发动效果" }));
    expect(onAct).toHaveBeenCalledWith({ type: "activate", uid: trap.uid, targets: [] });
  });

  it("permits inspection but blocks all commands during AI priority", async () => {
    const state = duel();
    state.turnPlayer = 1;
    state.prompt = { kind: "free", actor: 1 };
    state.players[1].controller = "ai";
    const { user, onAct } = show(state);
    await user.click(screen.getAllByRole("button", { name: /我方手牌 .*圣锤之毅/ })[0]!);
    expect(inspector().getByText("矮小却极难被击破。")).toBeVisible();
    expect(screen.queryByRole("button", { name: /召唤|进入战斗阶段|^通过$/ })).not.toBeInTheDocument();
    expect(onAct).not.toHaveBeenCalled();
  });
});
