import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { hashPassword, signToken } from "../lib/auth.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  phone: z.string().min(7).max(20).regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number"),
  password: z.string().min(6),
});

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

function phoneToUsername(phone: string, suffix: number): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `Player${last4}${suffix > 0 ? `_${suffix}` : ""}`;
}

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { phone, password } = parsed.data;
  const normalised = phone.replace(/\s/g, "");
  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, normalised));
  if (existing.length > 0) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }
  let username = phoneToUsername(normalised, 0);
  let attempt = 1;
  while (true) {
    const clash = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (clash.length === 0) break;
    username = phoneToUsername(normalised, attempt++);
  }
  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ phone: normalised, username, passwordHash }).returning();
  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, balance: user.balance } });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { phone, password } = parsed.data;
  const normalised = phone.replace(/\s/g, "");
  const [user] = await db.select().from(usersTable).where(
    or(eq(usersTable.phone, normalised), eq(usersTable.username, normalised))
  );
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Incorrect phone or password" });
    return;
  }
  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, balance: user.balance } });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, username: user.username, balance: user.balance, totalWon: user.totalWon });
});

export default router;
