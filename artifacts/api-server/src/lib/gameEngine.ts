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
  isBot?: boolean;
  freeBet?: boolean;
}

const WAIT_MS  = 6000;
const TICK_MS  = 50;

// ── Bot name pool ────────────────────────────────────────────────────────────
const BOT_FIRST = [
  "P","J","M","K","W","N","A","F","R","G","S","T","L","B","C","D",
  "E","H","I","O","U","V","Z","Q","Y","X","Ch","Br","St","Kw","Ng","Sh",
];
const BOT_LAST  = [
  "***a","***n","***e","***i","***o","***u","***h","***s",
  "***ki","***ro","***ma","***ne","***li","***la","***mo","***sa",
];

function botName(): string {
  return BOT_FIRST[Math.floor(Math.random() * BOT_FIRST.length)]
       + BOT_LAST [Math.floor(Math.random() * BOT_LAST.length)];
}

const BOT_AMOUNT_TIERS = [
  { weight: 0.40, min:   50, max:   500, step:  10 },
  { weight: 0.30, min:  500, max:  2000, step:  50 },
  { weight: 0.18, min: 2000, max: 10000, step: 100 },
  { weight: 0.08, min:10000, max: 35000, step: 500 },
  { weight: 0.04, min:35000, max:100000, step:1000 },
];

function botAmount(): number {
  const r = Math.random();
  let cum = 0;
  for (const tier of BOT_AMOUNT_TIERS) {
    cum += tier.weight;
    if (r <= cum) {
      const raw = tier.min + Math.random() * (tier.max - tier.min);
      return Math.round(raw / tier.step) * tier.step;
    }
  }
  return 500;
}

function botCashout(): number | null {
  const r = Math.random();
  if (r < 0.12) return null;                                        // ride to crash
  if (r < 0.42) return +(1.10 + Math.random() * 0.90).toFixed(2);  // 1.10–2.00
  if (r < 0.68) return +(2.00 + Math.random() * 3.00).toFixed(2);  // 2.00–5.00
  if (r < 0.84) return +(5.00 + Math.random() * 15.0).toFixed(2);  // 5.00–20.00
  if (r < 0.94) return +(20.0 + Math.random() * 30.0).toFixed(2);  // 20.00–50.00
  return +(50.0 + Math.random() * 50.0).toFixed(2);                 // 50–100
}

// ── Crash point generation ───────────────────────────────────────────────────
function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.0, Math.floor((100 / (1 - r * 0.97)) / 100 * 100) / 100);
}

// ── Engine ───────────────────────────────────────────────────────────────────
class GameEngine extends EventEmitter {
  state: GameState = {
    phase:           "waiting",
    multiplier:       1.0,
    crashMultiplier:  null,
    roundId:          null,
    countdown:        WAIT_MS / 1000,
    startedAt:        null,
  };

  activeBets: Map<number, ActiveBet> = new Map();
  private _crashPoint = 1.0;
  private _ticker: NodeJS.Timeout | null = null;
  private _botIdCounter = -1;
  private _botTimers: NodeJS.Timeout[] = [];

  async start(): Promise<void> {
    await this._waitPhase();
  }

  // ── Waiting ──────────────────────────────────────────────────────────────
  private async _waitPhase(): Promise<void> {
    this._crashPoint = generateCrashPoint();
    this._clearBotTimers();
    this.state = {
      phase: "waiting", multiplier: 1.0, crashMultiplier: null,
      roundId: null, countdown: WAIT_MS / 1000, startedAt: null,
    };
    this.activeBets.clear();
    this.emit("waiting", { countdown: this.state.countdown });

    // Schedule bots to trickle in during the wait window
    this._scheduleBots();

    let elapsed = 0;
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        elapsed += 100;
        this.state.countdown = Math.max(0, (WAIT_MS - elapsed) / 1000);
        this.emit("countdown", { countdown: this.state.countdown });
        if (elapsed >= WAIT_MS) { clearInterval(interval); resolve(); }
      }, 100);
    });

    await this._flyPhase();
  }

  private _scheduleBots(): void {
    const count = 22 + Math.floor(Math.random() * 28); // 22–50 bots
    for (let i = 0; i < count; i++) {
      const delay = 200 + Math.random() * (WAIT_MS - 800);
      const t = setTimeout(() => {
        if (this.state.phase !== "waiting") return;
        const id    = this._botIdCounter--;
        const bet: ActiveBet = {
          userId:           id,
          username:         botName(),
          betId:            id,
          amount:           botAmount(),
          autoCashout:      botCashout(),
          cashedOut:        false,
          cashoutMultiplier:null,
          isBot:            true,
          freeBet:          Math.random() < 0.09,
        };
        this.activeBets.set(id, bet);
        this.emit("bet_placed", {
          userId:     bet.userId,
          username:   bet.username,
          betId:      bet.betId,
          amount:     bet.amount,
          autoCashout:bet.autoCashout,
          freeBet:    bet.freeBet,
        });
      }, delay);
      this._botTimers.push(t);
    }
  }

  private _clearBotTimers(): void {
    for (const t of this._botTimers) clearTimeout(t);
    this._botTimers = [];
  }

  // ── Flying ───────────────────────────────────────────────────────────────
  private async _flyPhase(): Promise<void> {
    const [round] = await db.insert(roundsTable).values({
      crashMultiplier: String(this._crashPoint),
      startedAt:       new Date(),
    }).returning();

    this.state.roundId   = round.id;
    this.state.phase     = "flying";
    this.state.multiplier = 1.0;
    this.state.startedAt  = Date.now();

    for (const [, bet] of this.activeBets) {
      if (!bet.isBot) {
        await db.update(betsTable).set({ roundId: round.id }).where(eq(betsTable.id, bet.betId));
      }
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
            if (bet.isBot) {
              this._doBotCashout(bet, mult);
            } else {
              await this._doCashout(bet, mult);
            }
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

  // ── Crash ────────────────────────────────────────────────────────────────
  private async _crashPhase(): Promise<void> {
    this.state.phase          = "crashed";
    this.state.crashMultiplier = this._crashPoint;

    for (const [, bet] of this.activeBets) {
      if (!bet.cashedOut && !bet.isBot) {
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
    await new Promise((r) => setTimeout(r, 3500));
    await this._waitPhase();
  }

  // ── Bot cashout (no DB) ──────────────────────────────────────────────────
  private _doBotCashout(bet: ActiveBet, multiplier: number): void {
    bet.cashedOut         = true;
    bet.cashoutMultiplier = multiplier;
    this.emit("cashout", {
      userId:            bet.userId,
      username:          bet.username,
      betId:             bet.betId,
      cashoutMultiplier: multiplier,
      profit:            bet.amount * (multiplier - 1),
      payout:            bet.amount * multiplier,
    });
  }

  // ── Real cashout (with DB) ───────────────────────────────────────────────
  async _doCashout(bet: ActiveBet, multiplier: number): Promise<number> {
    bet.cashedOut         = true;
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
      userId:            bet.userId,
      username:          bet.username,
      betId:             bet.betId,
      cashoutMultiplier: multiplier,
      profit,
      payout,
    });

    return payout;
  }

  // ── Public API ───────────────────────────────────────────────────────────
  async placeBet(userId: number, username: string, amount: number, autoCashout: number | null): Promise<ActiveBet> {
    if (this.state.phase !== "waiting") throw new Error("Bets can only be placed during the waiting phase");

    for (const [, b] of this.activeBets) {
      if (b.userId === userId) throw new Error("Already placed a bet this round");
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) throw new Error("User not found");
    if (Number(user.balance) < amount) throw new Error("Insufficient balance");

    await db.update(usersTable)
      .set({ balance: sql`balance - ${String(amount)}` })
      .where(eq(usersTable.id, userId));

    const [bet] = await db.insert(betsTable).values({
      userId, roundId: null, amount: String(amount),
    }).returning();

    const activeBet: ActiveBet = {
      userId, username, betId: bet.id, amount, autoCashout,
      cashedOut: false, cashoutMultiplier: null,
    };

    this.activeBets.set(bet.id, activeBet);
    this.emit("bet_placed", { userId, username, betId: bet.id, amount, autoCashout, freeBet: false });
    return activeBet;
  }

  async cashout(userId: number): Promise<number> {
    if (this.state.phase !== "flying") throw new Error("Not in flying phase");
    let foundBet: ActiveBet | null = null;
    for (const [, bet] of this.activeBets) {
      if (bet.userId === userId && !bet.cashedOut) { foundBet = bet; break; }
    }
    if (!foundBet) throw new Error("No active bet to cashout");
    return this._doCashout(foundBet, this.state.multiplier);
  }
}

export const gameEngine = new GameEngine();
