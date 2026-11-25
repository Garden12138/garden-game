import type { Action, GameMode, GameState, PlayerId } from "../engine/types";
import type { LobbyView } from "./host";

export interface LobbyPayload extends LobbyView {
  type: "lobby";
  lanHost: string;
}

export type NetMessage =
  | { type: "join"; name: string; room?: string; mode?: GameMode; host?: boolean }
  | { type: "start"; seed?: number; openingHand?: 0 | 2 }
  | { type: "action"; action: Action }
  | (Omit<LobbyPayload, "type"> & { type: "hello"; playerId: PlayerId })
  | { type: "state"; state: GameState }
  | LobbyPayload
  | { type: "error"; message: string };

export function createGameSocket(
  url: string,
  handlers: {
    onHello?: (playerId: PlayerId, lobby: Omit<LobbyPayload, "type">) => void;
    onState?: (state: GameState) => void;
    onLobby?: (lobby: LobbyPayload) => void;
    onError?: (message: string) => void;
  },
): WebSocket {
  const socket = new WebSocket(url);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as NetMessage;
    if (message.type === "hello") {
      handlers.onHello?.(message.playerId, {
        room: message.room,
        mode: message.mode,
        seatCount: message.seatCount,
        lanHost: message.lanHost,
        seats: message.seats,
        hostSeat: message.hostSeat,
      });
    }
    if (message.type === "state") handlers.onState?.(message.state);
    if (message.type === "lobby") handlers.onLobby?.(message);
    if (message.type === "error") handlers.onError?.(message.message);
  });
  return socket;
}

export function sendNet(socket: WebSocket, message: NetMessage): void {
  socket.send(JSON.stringify(message));
}
