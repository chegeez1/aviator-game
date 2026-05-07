import { useMemo } from "react";
import type { ActiveBetInfo } from "../lib/api";

interface Props {
  bets: ActiveBetInfo[];
  multiplier: number;
  phase: string;
}

const AVATAR_COLORS = [
  "#e03131","#e67700","#2f9e44","#1971c2","#7048e8",
  "#c2255c","#0c8599","#5c940d","#862e9c","#d6336c",
];

function avatarColor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function maskName(username: string): string {
  if (username.length <= 2) return username + "***";
  return username[0] + "***" + username[username.length - 1];
}

function Avatar({ username }: { username: string }) {
  const color = useMemo(() => avatarColor(username), [username]);
  const letter = username[0]?.toUpperCase() ?? "?";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 font-bold text-white"
      style={{ width: 26, height: 26, background: color, fontSize: 11 }}
    >
      {letter}
    </span>
  );
}

export function PlayerBetsList({ bets, multiplier, phase }: Props) {
  const [activeTab, setActiveTab] = [0, () => {}]; void activeTab; void setActiveTab;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "#1a1b2c", borderRight: "1px solid #2a2b42" }}
    >
      {/* Tabs */}
      <div className="flex items-center shrink-0" style={{ borderBottom: "1px solid #2a2b42" }}>
        {["All Bets", "Previous", "Top"].map((tab, i) => (
          <button
            key={tab}
            className="flex-1 py-2 text-xs font-bold transition-all"
            style={{
              color:        i === 0 ? "#e03131" : "#44445a",
              borderBottom: i === 0 ? "2px solid #e03131" : "2px solid transparent",
              background:   "transparent",
              letterSpacing: "0.02em",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="px-3 py-1 shrink-0" style={{ borderBottom: "1px solid #22233a" }}>
        <p className="text-xs font-bold" style={{ color: "#ccc" }}>ALL BETS</p>
        <p className="text-xs" style={{ color: "#e03131" }}>{bets.length}</p>
      </div>

      {/* Column labels */}
      <div
        className="grid px-2 py-1 shrink-0 text-xs"
        style={{
          gridTemplateColumns: "1fr 72px 52px 64px",
          borderBottom: "1px solid #22233a",
          color: "#33344a",
        }}
      >
        <span>PLAYER</span>
        <span className="text-right">BET KES</span>
        <span className="text-center">X</span>
        <span className="text-right">WIN KES</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {bets.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs" style={{ color: "#2a2b40" }}>No active bets</span>
          </div>
        )}
        {bets.map((bet, i) => {
          const out     = bet.cashedOut;
          const xMult   = out ? bet.cashoutMultiplier : phase === "flying" ? multiplier : null;
          const winAmt  = out && bet.cashoutMultiplier ? (bet.amount * bet.cashoutMultiplier) : null;

          return (
            <div
              key={bet.userId + "-" + i}
              className="grid items-center px-2 py-1.5 transition-all"
              style={{
                gridTemplateColumns: "1fr 72px 52px 64px",
                borderBottom: "1px solid #18192e",
                background: out ? "rgba(34,197,94,0.04)" : "transparent",
              }}
            >
              {/* Player */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar username={bet.username} />
                <span className="text-xs font-medium truncate" style={{ color: "#bbb" }}>
                  {maskName(bet.username)}
                </span>
              </div>

              {/* Bet */}
              <span className="text-xs text-right font-medium" style={{ color: "#888" }}>
                {bet.amount.toFixed(2)}
              </span>

              {/* X multiplier */}
              <div className="flex justify-center">
                {out && bet.cashoutMultiplier ? (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#0891b2", color: "#fff", fontSize: 10, boxShadow: "0 0 6px rgba(8,145,178,0.5)" }}
                  >
                    {bet.cashoutMultiplier.toFixed(2)}x
                  </span>
                ) : phase === "flying" && !out ? (
                  <span className="text-xs font-bold" style={{ color: "#555" }}>
                    {multiplier.toFixed(2)}x
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "#333" }}>—</span>
                )}
              </div>

              {/* Win */}
              <span
                className="text-xs text-right font-bold"
                style={{ color: out ? "#22c55e" : "#333344" }}
              >
                {winAmt ? winAmt.toFixed(2) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
