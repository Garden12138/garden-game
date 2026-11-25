import { networkInterfaces } from "node:os";
import type { Plugin } from "vite";
import type { WebSocket } from "ws";

function lanAddress(): string {
  const nets = networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const item of list ?? []) {
      if (item.family === "IPv4" && !item.internal) return item.address;
    }
  }
  return "127.0.0.1";
}

async function startLanWsServer() {
  const [{ WebSocketServer }, { GameRoom }] = await Promise.all([
    import("ws"),
    import("../src/game/net/host"),
  ]);
  const rooms = new Map<string, InstanceType<typeof GameRoom>>();
  const sockets = new Map<string, WebSocket>();
  const lanHost = lanAddress();
  const wss = new WebSocketServer({ port: 8788 });
  wss.once("listening", () => console.log(`[峡谷身份战] 局域网主机 ws://${lanHost}:8788`));
  wss.on("error", (error) => console.error("[峡谷身份战] 联机服务", error.message));

  const lobbyPayload = (room: InstanceType<typeof GameRoom>) => ({
    type: "lobby" as const,
    lanHost,
    ...room.lobbyView(),
  });

  const pushLobby = (room: InstanceType<typeof GameRoom>) => {
    const payload = JSON.stringify(lobbyPayload(room));
    for (const member of room.clients) {
      const socket = sockets.get(member.id);
      if (socket?.readyState === 1) socket.send(payload);
    }
  };

  const pushState = (room: InstanceType<typeof GameRoom>) => {
    for (const member of room.clients) {
      const socket = sockets.get(member.id);
      if (socket?.readyState !== 1 || !room.state) continue;
      socket.send(JSON.stringify({ type: "state", state: room.view(member.id) }));
    }
  };

  const runAi = (room: InstanceType<typeof GameRoom>) => {
    if (!room.clients.length || rooms.get(room.id) !== room) return;
    for (let i = 0; i < 48; i++) {
      if (!room.tickAi()) {
        pushState(room);
        return;
      }
    }
    pushState(room);
    setImmediate(() => runAi(room));
  };

  wss.on("connection", (socket) => {
    const clientId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sockets.set(clientId, socket);
    let roomId = "";
    const send = (message: object) => socket.send(JSON.stringify(message));

    socket.on("close", () => {
      sockets.delete(clientId);
      const room = rooms.get(roomId);
      if (!room?.leave(clientId)) return;
      if (room.clients.length === 0) rooms.delete(roomId);
      else {
        pushLobby(room);
        if (room.state) runAi(room);
      }
    });
    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(String(raw)) as {
          type: string;
          name?: string;
          room?: string;
          mode?: "identity" | "duel" | "team";
          host?: boolean;
          seed?: number;
          openingHand?: 0 | 2;
          action?: import("../src/game/engine/types").Action;
        };
        if (message.type === "join") {
          roomId = message.room || "rift";
          let room = rooms.get(roomId);
          if (message.host && room) throw new Error("房间已存在，请加入已有房间");
          if (!room) {
            if (!message.host) throw new Error("房间不存在，请先由房主开房");
            room = new GameRoom(roomId, message.mode ?? "identity");
            rooms.set(roomId, room);
          }
          const seat = room.join(clientId, message.name || "召唤师");
          send({ type: "hello", playerId: seat, lanHost, ...room.lobbyView() });
          pushLobby(room);
          return;
        }
        const room = rooms.get(roomId);
        if (!room) throw new Error("房间不存在");
        if (message.type === "start") {
          if (room.clients[0]?.id !== clientId) throw new Error("请等待房主开始");
          room.start(message.seed, message.openingHand);
          pushState(room);
          runAi(room);
          return;
        }
        if (message.type === "action" && "action" in message && message.action) {
          room.apply(clientId, message.action);
          pushState(room);
          runAi(room);
        }
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "联机错误" });
      }
    });
  });
  return wss;
}

export function riftLanPlugin(): Plugin {
  return {
    name: "rift-lan",
    configureServer(server) {
      const http = server.httpServer;
      // Vite prepares its replacement server before closing the original listener.
      http?.once("listening", () => {
        const ready = startLanWsServer();
        http.once("close", () => {
          void ready.then((sockets) => {
            for (const socket of sockets.clients) socket.terminate();
            sockets.close();
          });
        });
      });
    },
  };
}
