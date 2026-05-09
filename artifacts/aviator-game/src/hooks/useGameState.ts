import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "./useWebSocket";
import { api, type GameState, type ActiveBetInfo, type Round } from "../lib/api";

export interface BetInfo extends ActiveBetInfo {
  freeBet?: boolean;
  avatarId?: number;
}

export interface FullGameState {
  phase: "waiting" | "flying" | "crashed";
  multiplier: number;
  crashMultiplier: number | null;
  roundId: number | null;
  countdown: number;
  bets: BetInfo[];
  history: Round[];
  connected: boolean;
}

const DEFAULT_STATE: FullGameState = {
  phase: "waiting",
  multiplier: 1.0,
  crashMultiplier: null,
  roundId: null,
  countdown: 5,
  bets: [],
  history: [],
  connected: false,
};

export function useGameState() {
  const [gameState, setGameState] = useState<FullGameState>(DEFAULT_STATE);
  const [connected, setConnected] = useState(false);
  const stateRef = useRef<FullGameState>(DEFAULT_STATE);

  useEffect(() => {
    api.history().then((h) => {
      setGameState((s) => ({ ...s, history: h }));
      stateRef.current = { ...stateRef.current, history: h };
    }).catch(() => {});
  }, []);

  const onMessage = useCallback((msg: Record<string, unknown> & { type: string }) => {
    setConnected(true);
    setGameState((prev) => {
      let next = { ...prev, connected: true };

      switch (msg.type) {
        case "init": {
          const m = msg as unknown as GameState & { type: string };
          next = {
            ...next,
            phase: m.phase,
            multiplier: m.multiplier,
            crashMultiplier: m.crashMultiplier,
            roundId: m.roundId,
            countdown: m.countdown,
            bets: (m.bets ?? []) as BetInfo[],
          };
          break;
        }
        case "waiting":
          next = { ...next, phase: "waiting", multiplier: 1.0, crashMultiplier: null, countdown: (msg.countdown as number) ?? 5 };
          break;
        case "countdown":
          next = { ...next, countdown: (msg.countdown as number) ?? 0 };
          break;
        case "round_start":
          next = { ...next, phase: "flying", multiplier: 1.0, bets: prev.bets, roundId: (msg.roundId as number) ?? null };
          break;
        case "multiplier":
          next = { ...next, multiplier: (msg.multiplier as number) ?? 1.0 };
          break;
        case "crash": {
          const cm = (msg.crashMultiplier as number) ?? 1.0;
          next = { ...next, phase: "crashed", crashMultiplier: cm };
          const newRound: Round = {
            id: Date.now(),
            crashMultiplier: String(cm),
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
          };
          next.history = [newRound, ...prev.history].slice(0, 30);
          break;
        }
        case "bet_placed": {
          const b = msg as unknown as {
            userId: number; username: string; amount: number;
            autoCashout: number | null; freeBet?: boolean; avatarId?: number;
          };
          if (!prev.bets.some(x => x.userId === b.userId)) {
            const newBet: BetInfo = {
              userId: b.userId, username: b.username, amount: b.amount,
              cashedOut: false, cashoutMultiplier: null,
              freeBet: b.freeBet, avatarId: b.avatarId,
            };
            next.bets = [...prev.bets, newBet];
          }
          break;
        }
        case "cashout": {
          const c = msg as unknown as { userId: number; cashoutMultiplier: number };
          next.bets = prev.bets.map((b) =>
            b.userId === c.userId ? { ...b, cashedOut: true, cashoutMultiplier: c.cashoutMultiplier } : b
          );
          break;
        }
        default:
          break;
      }

      stateRef.current = next;
      return next;
    });
  }, []);

  const { wsRef } = useWebSocket(onMessage);
  void wsRef;

  return { gameState, connected };
}
