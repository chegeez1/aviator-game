const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("aviator_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    req<{ token: string; user: { id: number; username: string; balance: string } }>("POST", "/auth/register", { username, password }),
  login: (username: string, password: string) =>
    req<{ token: string; user: { id: number; username: string; balance: string } }>("POST", "/auth/login", { username, password }),
  me: () =>
    req<{ id: number; username: string; balance: string; totalWon: string }>("GET", "/auth/me"),
  gameState: () =>
    req<GameState>("GET", "/game/state"),
  history: () =>
    req<Round[]>("GET", "/game/history"),
  bets: () =>
    req<Bet[]>("GET", "/game/bets"),
  placeBet: (amount: number, autoCashout?: number | null) =>
    req<{ success: boolean; betId: number; amount: number }>("POST", "/game/bet", { amount, autoCashout }),
  cashout: () =>
    req<{ success: boolean; payout: number; balance: string }>("POST", "/game/cashout"),
  leaderboard: () =>
    req<LeaderboardEntry[]>("GET", "/game/leaderboard"),
};

export interface GameState {
  phase: "waiting" | "flying" | "crashed";
  multiplier: number;
  crashMultiplier: number | null;
  roundId: number | null;
  countdown: number;
  bets: ActiveBetInfo[];
}

export interface ActiveBetInfo {
  userId: number;
  username: string;
  amount: number;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

export interface Round {
  id: number;
  crashMultiplier: string;
  startedAt: string;
  endedAt: string | null;
}

export interface Bet {
  id: number;
  userId: number;
  roundId: number | null;
  amount: string;
  cashoutMultiplier: string | null;
  profit: string | null;
  won: boolean | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  totalWon: string;
  balance: string;
}
