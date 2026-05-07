import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "aviator_secret_change_me";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SECRET).digest("hex");
}

export function signToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; username: string } {
  const payload = jwt.verify(token, SECRET) as { userId: number; username: string };
  return payload;
}
