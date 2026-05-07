import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { gameEngine } from "./gameEngine.js";
import { logger } from "./logger.js";

const clients = new Set<WebSocket>();

function broadcast(type: string, data: Record<string, unknown>): void {
  const msg = JSON.stringify({ type, ...data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    clients.add(ws);
    logger.info("WS client connected");

    const { phase, multiplier, crashMultiplier, roundId, countdown } = gameEngine.state;
    const bets = Array.from(gameEngine.activeBets.values()).map((b) => ({
      userId: b.userId,
      username: b.username,
      amount: b.amount,
      cashedOut: b.cashedOut,
      cashoutMultiplier: b.cashoutMultiplier,
    }));
    ws.send(JSON.stringify({ type: "init", phase, multiplier, crashMultiplier, roundId, countdown, bets }));

    ws.on("close", () => {
      clients.delete(ws);
      logger.info("WS client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WS error");
      clients.delete(ws);
    });
  });

  gameEngine.on("waiting", (data: Record<string, unknown>) => broadcast("waiting", data));
  gameEngine.on("countdown", (data: Record<string, unknown>) => broadcast("countdown", data));
  gameEngine.on("round_start", (data: Record<string, unknown>) => broadcast("round_start", data));
  gameEngine.on("multiplier", (data: Record<string, unknown>) => broadcast("multiplier", data));
  gameEngine.on("crash", (data: Record<string, unknown>) => broadcast("crash", data));
  gameEngine.on("bet_placed", (data: Record<string, unknown>) => broadcast("bet_placed", data));
  gameEngine.on("cashout", (data: Record<string, unknown>) => broadcast("cashout", data));
}
