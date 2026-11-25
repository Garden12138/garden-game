import { describe, expect, it } from "vitest";
import { GameRoom } from "../../src/game/net/host";

describe("GameRoom", () => {
  it("fills empty seats with AI and hides guest hands", () => {
    const room = new GameRoom("rift", "duel");
    expect(room.join("host", "房主")).toBe(0);
    room.start(8);
    expect(room.state?.players).toHaveLength(2);
    expect(room.state?.players[1]!.controller).toBe("ai");
    room.state!.players[1]!.hand = [{ id: "secret", kind: "heal", suit: "heart", rank: 9 }];
    expect(room.view("host").players[1]!.hand[0]!.kind).toBe("strike");
  });

  it("lists empty lobby seats as AI until a player joins", () => {
    const room = new GameRoom("rift", "team");
    room.join("host", "房主");
    expect(room.lobbyView().seats).toEqual([
      { seat: 0, name: "房主", kind: "human" },
      { seat: 1, name: "AI", kind: "ai" },
      { seat: 2, name: "AI", kind: "ai" },
      { seat: 3, name: "AI", kind: "ai" },
    ]);
    room.join("guest", "客机");
    expect(room.lobbyView().seats[1]).toEqual({ seat: 1, name: "客机", kind: "human" });
  });

  it("frees a seat before the match starts", () => {
    const room = new GameRoom("rift", "duel");
    room.join("host", "房主");
    room.join("guest", "客机");
    expect(room.leave("guest")).toBe(true);
    expect(room.lobbyView().seats[1]!.kind).toBe("ai");
    expect(room.join("next", "后来")).toBe(1);
  });
});

it("keeps four friends seated through a rematch and switches the opening deal", () => {
  const room = new GameRoom("rift", "identity");
  for (let i = 0; i < 4; i++) room.join(String(i), `朋友 ${i}`);
  room.start(4, 0);
  expect(() => room.start(5, 2)).toThrow("本局尚未结束");
  const pick = () => {
    while (room.state?.phase === "pick") {
      const actor = room.state.prompt.actor;
      const view = room.view(String(actor));
      expect(view.players[actor]!.identity).toBe(room.state.players[actor]!.identity);
      room.apply(String(actor), { type: "pickChampion", player: actor, championId: view.players[actor]!.candidates[0]! });
    }
  };
  pick();
  expect(room.state!.players.map((p) => p.hand.length).sort()).toEqual([0, 0, 0, 2]);
  room.state!.phase = "gameOver";
  room.start(9, 2);
  pick();
  expect(room.state!.players.map((p) => p.hand.length).sort()).toEqual([2, 2, 2, 4]);
  expect(room.state!.config.playerNames).toEqual(["朋友 0", "朋友 1", "朋友 2", "朋友 3"]);
  expect(room.state!.turnCount).toBe(1);
});

it("lets AI take over a disconnected seat and hands hosting to the next friend", () => {
  const room = new GameRoom("rift", "identity");
  room.join("first", "甲");
  room.join("second", "乙");
  room.start(1);
  room.leave("first");
  expect(room.state!.players[0]!.controller).toBe("ai");
  expect(room.lobbyView().hostSeat).toBe(1);
});
