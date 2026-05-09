import { useMemo, useState } from "react";
import type { BetInfo } from "../hooks/useGameState";

interface Props {
  bets: BetInfo[];
  multiplier: number;
  phase: string;
}

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
        width={28} height={28}
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

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1_000)     return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function MultBadge({ mult }: { mult: number }) {
  let bg: string, color: string, border: string;
  if (mult >= 10) {
    bg = "rgba(106,27,154,0.25)"; color = "#ce93d8"; border = "rgba(106,27,154,0.5)";
  } else if (mult >= 2) {
    bg = "rgba(198,40,40,0.22)"; color = "#ff8a80"; border = "rgba(198,40,40,0.45)";
  } else {
    bg = "rgba(21,101,192,0.22)"; color = "#82b1ff"; border = "rgba(21,101,192,0.45)";
  }
  return (
    <span
      className="font-black rounded-full"
      style={{ background: bg, color, border: `1px solid ${border}`, fontSize: 9, padding: "2px 5px" }}
    >
      {mult.toFixed(2)}x
    </span>
  );
}

export function PlayerBetsList({ bets, multiplier, phase }: Props) {
  const sorted = useMemo(() => {
    return [...bets].sort((a, b) => {
      if (a.cashedOut && !b.cashedOut) return -1;
      if (!a.cashedOut && b.cashedOut) return 1;
      return b.amount - a.amount;
    });
  }, [bets]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#141414", borderRight: "1px solid #1e1e1e" }}>

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
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ALL BETS count */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #1e1e1e", background: "#111111" }}
      >
        <span className="font-bold text-xs" style={{ color: "#cccccc" }}>ALL BETS</span>
        <span
          className="text-xs font-black px-1.5 py-0.5 rounded-full"
          style={{ background: "#e03131", color: "#fff", fontSize: 10 }}
        >
          {bets.length}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid px-2 py-1 shrink-0 text-xs font-bold uppercase"
        style={{
          gridTemplateColumns: "1fr 60px 46px 58px",
          color: "#303030",
          borderBottom: "1px solid #1a1a1a",
          letterSpacing: "0.04em",
        }}
      >
        <span>Player</span>
        <span className="text-right">Bet KES</span>
        <span className="text-center">X</span>
        <span className="text-right">Win KES</span>
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
          const winAmt = out && bet.cashoutMultiplier ? bet.amount * bet.cashoutMultiplier : null;
          const liveMult = phase === "flying" && !out ? multiplier : null;

          return (
            <div
              key={bet.userId + "-" + i}
              className="grid items-center px-2 py-1"
              style={{
                gridTemplateColumns: "1fr 60px 46px 58px",
                borderBottom: "1px solid #161616",
                background: out ? "rgba(34,197,94,0.03)" : "transparent",
              }}
            >
              {/* Player */}
              <div className="flex items-center gap-1.5 min-w-0">
                <PlayerAvatar username={bet.username} avatarId={bet.avatarId} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate" style={{ color: "#888888", lineHeight: 1.3 }}>
                    {bet.username}
                  </span>
                  {bet.freeBet && (
                    <span
                      className="font-black uppercase rounded"
                      style={{ background: "#14532d", color: "#4ade80", fontSize: 8, letterSpacing: "0.05em", lineHeight: 1.6, padding: "0 3px", width: "fit-content" }}
                    >
                      Free Bet
                    </span>
                  )}
                </div>
              </div>

              {/* Bet amount */}
              <span className="text-right font-medium truncate" style={{ color: "#555555", fontSize: 10 }}>
                {fmtAmount(bet.amount)}
              </span>

              {/* Multiplier badge */}
              <div className="flex justify-center">
                {out && bet.cashoutMultiplier ? (
                  <MultBadge mult={bet.cashoutMultiplier} />
                ) : liveMult ? (
                  <span style={{ color: "#2a2a2a", fontSize: 10 }}>{liveMult.toFixed(2)}x</span>
                ) : (
                  <span style={{ color: "#1e1e1e", fontSize: 12 }}>—</span>
                )}
              </div>

              {/* Win */}
              <span
                className="text-right font-bold truncate"
                style={{ color: out ? "#4ade80" : "#1e1e1e", fontSize: 10 }}
              >
                {winAmt ? fmtAmount(winAmt) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
