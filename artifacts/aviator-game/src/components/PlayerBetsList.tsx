import { useMemo, useState } from "react";
import type { BetInfo } from "../hooks/useGameState";

interface Props {
  bets: BetInfo[];
  multiplier: number;
  phase: string;
}

// Fallback letter-avatar colors
const AVATAR_PALETTE = [
  "#e03131","#e67700","#2f9e44","#1971c2","#7048e8",
  "#c2255c","#0c8599","#5c940d","#862e9c","#d6336c",
  "#1864ab","#087f5b","#9c36b5","#e8590c","#364fc7",
];
function avatarColor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function avatarUrl(avatarId: number): string {
  // 1–99 → men, 100–198 → women (1–99)
  if (avatarId <= 99) return `https://randomuser.me/api/portraits/men/${avatarId}.jpg`;
  return `https://randomuser.me/api/portraits/women/${avatarId - 99}.jpg`;
}

function PlayerAvatar({ username, avatarId }: { username: string; avatarId?: number }) {
  const [imgErr, setImgErr] = useState(false);

  if (avatarId && !imgErr) {
    return (
      <img
        src={avatarUrl(avatarId)}
        alt={username}
        width={28}
        height={28}
        className="rounded-full shrink-0 object-cover"
        style={{ width: 28, height: 28, flexShrink: 0, border: "1px solid #2a2a2a" }}
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }

  const color = avatarColor(username);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 font-black text-white uppercase"
      style={{ width: 28, height: 28, background: color, fontSize: 11, flexShrink: 0 }}
    >
      {username[0] ?? "?"}
    </span>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}

export function PlayerBetsList({ bets, multiplier, phase }: Props) {
  const sorted = useMemo(() => {
    return [...bets].sort((a, b) => {
      // Cashed-out first, then by amount desc
      if (a.cashedOut && !b.cashedOut) return -1;
      if (!a.cashedOut && b.cashedOut) return 1;
      return b.amount - a.amount;
    });
  }, [bets]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "#141414", borderRight: "1px solid #1e1e1e" }}
    >
      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid #1e1e1e", background: "#111111" }}>
        {["All Bets", "Previous", "Top"].map((tab, i) => (
          <button
            key={tab}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={{
              color: i === 0 ? "#ffffff" : "#333333",
              borderBottom: i === 0 ? "2px solid #e03131" : "2px solid transparent",
              background: "transparent",
              letterSpacing: "0.03em",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Header row */}
      <div
        className="flex items-center px-2 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #1e1e1e", background: "#111111" }}
      >
        <span className="font-bold text-xs" style={{ color: "#cccccc" }}>ALL BETS</span>
        <span
          className="ml-1.5 text-xs font-black px-1.5 py-0.5 rounded-full"
          style={{ background: "#e03131", color: "#fff", fontSize: 10 }}
        >
          {bets.length}
        </span>
      </div>

      {/* Column labels */}
      <div
        className="grid px-2 py-1 shrink-0 text-xs font-bold uppercase"
        style={{
          gridTemplateColumns: "1fr 56px 44px 52px",
          color: "#2a2a2a",
          borderBottom: "1px solid #1a1a1a",
          letterSpacing: "0.04em",
        }}
      >
        <span>Player</span>
        <span className="text-right">KES</span>
        <span className="text-center">X</span>
        <span className="text-right">Win</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#222 #111" }}>
        {sorted.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <span className="text-xs" style={{ color: "#282828" }}>Waiting for bets…</span>
          </div>
        )}

        {sorted.map((bet, i) => {
          const out    = bet.cashedOut;
          const mult   = out ? bet.cashoutMultiplier : (phase === "flying" ? multiplier : null);
          const winAmt = out && bet.cashoutMultiplier ? bet.amount * bet.cashoutMultiplier : null;

          return (
            <div
              key={bet.userId + "-" + i}
              className="grid items-center px-2 py-1"
              style={{
                gridTemplateColumns: "1fr 56px 44px 52px",
                borderBottom: "1px solid #171717",
                background: out ? "rgba(34,197,94,0.035)" : "transparent",
              }}
            >
              {/* Player */}
              <div className="flex items-center gap-1.5 min-w-0">
                <PlayerAvatar username={bet.username} avatarId={bet.avatarId} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate" style={{ color: "#999999", lineHeight: 1.3 }}>
                    {bet.username}
                  </span>
                  {bet.freeBet && (
                    <span
                      className="font-black uppercase rounded"
                      style={{
                        background: "#14532d",
                        color: "#4ade80",
                        fontSize: 8,
                        letterSpacing: "0.05em",
                        lineHeight: 1.6,
                        padding: "0 3px",
                        width: "fit-content",
                      }}
                    >
                      Free Bet
                    </span>
                  )}
                </div>
              </div>

              {/* Bet amount */}
              <span className="text-xs text-right font-medium" style={{ color: "#555555" }}>
                {fmt(bet.amount)}
              </span>

              {/* Multiplier */}
              <div className="flex justify-center">
                {out && bet.cashoutMultiplier ? (
                  <span
                    className="font-black rounded-full"
                    style={{
                      background: "#052e16",
                      color: "#4ade80",
                      border: "1px solid #166534",
                      fontSize: 9,
                      padding: "1px 4px",
                    }}
                  >
                    {bet.cashoutMultiplier.toFixed(2)}x
                  </span>
                ) : phase === "flying" && !out && mult ? (
                  <span style={{ color: "#333333", fontSize: 10 }}>
                    {mult.toFixed(2)}x
                  </span>
                ) : (
                  <span style={{ color: "#222222", fontSize: 12 }}>—</span>
                )}
              </div>

              {/* Win */}
              <span
                className="text-xs text-right font-bold"
                style={{ color: out ? "#4ade80" : "#222222" }}
              >
                {winAmt ? fmt(winAmt) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
