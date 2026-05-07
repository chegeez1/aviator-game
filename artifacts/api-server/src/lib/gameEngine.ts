import { EventEmitter } from "node:events";
import { db } from "@workspace/db";
import { roundsTable, betsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type Phase = "waiting" | "flying" | "crashed";

export interface GameState {
  phase: Phase;
  multiplier: number;
  crashMultiplier: number | null;
  roundId: number | null;
  countdown: number;
  startedAt: number | null;
}

export interface ActiveBet {
  userId: number;
  username: string;
  betId: number;
  amount: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

const WAIT_MS = 5000;
const TICK_MS = 50;

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.0, Math.floor((100 / (1 - r * 0.97)) / 100 * 100) / 100);
}

class GameEngine extends EventEmitter {
  state: GameState = {
    phase: "waiting",
    multiplier: 1.0,
    crashMultiplier: null,
    roundId: null,
    countdown: WAIT_MS / 1000,
    startedAt: null,
  };

  activeBets: Map<number, ActiveBet> = new Map();
  private _crashPoint = 1.0;
  private _ticker: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    await this._waitPhase();
  }

  private async _waitPhase(): Promise<void> {
    this._crashPoint = generateCrashPoint();
    this.state = {
      phase: "waiting",
      multiplier: 1.0,
      crashMultiplier: null,
      roundId: null,
      countdown: WAIT_MS / 1000,
      startedAt: null,
    };
    this.activeBets.clear();

    this.emit("waiting", { countdown: this.state.countdown });

    let elapsed = 0;
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        elapsed += 100;
        this.state.countdown = Math.max(0, (WAIT_MS - elapsed) / 1000);
        this.emit("countdown", { countdown: this.state.countdown });
        if (elapsed >= WAIT_MS) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    await this._flyPhase();
  }

  private async _flyPhase(): Promise<void> {
    const [round] = await db.insert(roundsTable).values({
      crashMultiplier: String(this._crashPoint),
      startedAt: new Date(),
    }).returning();

    this.state.roundId = round.id;
    this.state.phase = "flying";
    this.state.multiplier = 1.0;
    this.state.startedAt = Date.now();

    for (const [, bet] of this.activeBets) {
      await db.update(betsTable)
        .set({ roundId: round.id })
        .where(eq(betsTable.id, bet.betId));
    }

    this.emit("round_start", { roundId: round.id, crashAt: this._crashPoint });

    await new Promise<void>((resolve) => {
      const startTime = Date.now();
      this._ticker = setInterval(async () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const mult = Math.round(Math.exp(0.06 * elapsed) * 100) / 100;
        this.state.multiplier = mult;

        for (const [, bet] of this.activeBets) {
          if (!bet.cashedOut && bet.autoCashout !== null && mult >= bet.autoCashout) {
            await this._doCashout(bet, mult);
          }
        }

        this.emit("multiplier", { multiplier: mult });

        if (mult >= this._crashPoint) {
          if (this._ticker) clearInterval(this._ticker);
          resolve();
        }
      }, TICK_MS);
    });

    await this._crashPhase();
  }

  private async _crashPhase(): Promise<void> {
    this.state.phase = "crashed";
    this.state.crashMultiplier = this._crashPoint;

    for (const [, bet] of this.activeBets) {
      if (!bet.cashedOut) {
        await db.update(betsTable)
          .set({ won: false, profit: String(-Number(bet.amount)), cashoutMultiplier: null })
          .where(eq(betsTable.id, bet.betId));
      }
    }

    if (this.state.roundId !== null) {
      await db.update(roundsTable)
        .set({ endedAt: new Date() })
        .where(eq(roundsTable.id, this.state.roundId));
    }

    this.emit("crash", { crashMultiplier: this._crashPoint });

    await new Promise((r) => setTimeout(r, 3000));
    await this._waitPhase();
  }

  async _doCashout(bet: ActiveBet, multiplier: number): Promise<number> {
    bet.cashedOut = true;
    bet.cashoutMultiplier = multiplier;
    const payout = Number(bet.amount) * multiplier;
    const profit = payout - Number(bet.amount);

    await db.update(betsTable)
      .set({ cashoutMultiplier: String(multiplier), profit: String(profit), won: true })
      .where(eq(betsTable.id, bet.betId));

    await db.update(usersTable)
      .set({ balance: sql`balance + ${String(payout)}`, totalWon: sql`total_won + ${String(profit)}` })
      .where(eq(usersTable.id, bet.userId));

    this.emit("cashout", {
      userId: bet.userId,
      username: bet.username,
      betId: bet.betId,
      cashoutMultiplier: multiplier,
      profit,
      payout,
    });

    return payout;
  }

  async placeBet(userId: number, username: string, amount: number, autoCashout: number | null): Promise<ActiveBet> {
    if (this.state.phase !== "waiting") {
      throw new Error("Bets can only be placed during the waiting phase");
    }

    for (const [, b] of this.activeBets) {
      if (b.userId === userId) throw new Error("Already placed a bet this round");
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) throw new Error("User not found");
    const balance = Number(user.balance);
    if (balance < amount) throw new Error("Insufficient balance");

    await db.update(usersTable)
      .set({ balance: sql`balance - ${String(amount)}` })
      .where(eq(usersTable.id, userId));

    const [bet] = await db.insert(betsTable).values({
      userId,
      roundId: null,
      amount: String(amount),
    }).returning();

    const activeBet: ActiveBet = {
      userId,
      username,
      betId: bet.id,
      amount,
      autoCashout,
      cashedOut: false,
      cashoutMultiplier: null,
    };

    this.activeBets.set(bet.id, activeBet);

    this.emit("bet_placed", {
      userId,
      username,
      betId: bet.id,
      amount,
      autoCashout,
    });

    return activeBet;
  }

  async cashout(userId: number): Promise<number> {
    if (this.state.phase !== "flying") throw new Error("Not in flying phase");

    let foundBet: ActiveBet | null = null;
    for (const [, bet] of this.activeBets) {
      if (bet.userId === userId && !bet.cashedOut) {
        foundBet = bet;
        break;
      }
    }

    if (!foundBet) throw new Error("No active bet to cashout");

    const payout = await this._doCashout(foundBet, this.state.multiplier);
    return payout;
  }
}

export const gameEngine = new GameEngine();
