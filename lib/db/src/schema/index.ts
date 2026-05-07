import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("10000.00"),
  totalWon: numeric("total_won", { precision: 18, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const roundsTable = pgTable("rounds", {
  id: serial("id").primaryKey(),
  crashMultiplier: numeric("crash_multiplier", { precision: 10, scale: 2 }).notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  roundId: integer("round_id").references(() => roundsTable.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  cashoutMultiplier: numeric("cashout_multiplier", { precision: 10, scale: 2 }),
  profit: numeric("profit", { precision: 18, scale: 2 }),
  won: boolean("won"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, totalWon: true });
export const insertRoundSchema = createInsertSchema(roundsTable).omit({ id: true });
export const insertBetSchema = createInsertSchema(betsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type Round = typeof roundsTable.$inferSelect;
export type Bet = typeof betsTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertBet = z.infer<typeof insertBetSchema>;
