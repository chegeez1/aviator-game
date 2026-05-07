import { Router } from "express";
import { db } from "@workspace/db";
import { roundsTable, betsTable, usersTable } from "@workspace/db";
import { eq, desc, isNotNull } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { gameEngine } from "../lib/gameEngine.js";
import { z } from "zod";

const router = Router();

router.get("/game/state", (_req, res) => {
  const { phase, multiplier, crashMultiplier, roundId, countdown } = gameEngine.state;
  const bets = Array.from(gameEngine.activeBets.values()).map((b) => ({
    userId: b.userId,
    username: b.username,
    amount: b.amount,
    cashedOut: b.cashedOut,
    cashoutMultiplier: b.cashoutMultiplier,
  }));
  res.json({ phase, multiplier, crashMultiplier, roundId, countdown, bets });
});

router.get("/game/history", async (_req, res) => {
  const rounds = await db
    .select()
    .from(roundsTable)
    .where(isNotNull(roundsTable.endedAt))
    .orderBy(desc(roundsTable.id))
    .limit(20);
  res.json(rounds);
});

router.get("/game/bets", requireAuth, async (req: AuthRequest, res) => {
  const userBets = await db
    .select()
    .from(betsTable)
    .where(eq(betsTable.userId, req.userId!))
    .orderBy(desc(betsTable.id))
    .limit(20);
  res.json(userBets);
});

const betSchema = z.object({
  amount: z.number().positive().max(100000),
  autoCashout: z.number().min(1.01).optional().nullable(),
});

router.post("/game/bet", requireAuth, async (req: AuthRequest, res) => {
  const parsed = betSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const bet = await gameEngine.placeBet(
      req.userId!,
      req.username!,
      parsed.data.amount,
      parsed.data.autoCashout ?? null
    );
    res.json({ success: true, betId: bet.betId, amount: bet.amount });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

router.post("/game/cashout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payout = await gameEngine.cashout(req.userId!);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    res.json({ success: true, payout, balance: user?.balance ?? "0" });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

router.get("/game/leaderboard", async (_req, res) => {
  const leaders = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      totalWon: usersTable.totalWon,
      balance: usersTable.balance,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.totalWon))
    .limit(10);
  res.json(leaders);
});

export default router;
