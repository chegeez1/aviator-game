import type { ActiveBetInfo } from "../lib/api";

interface Props {
  bets: ActiveBetInfo[];
  multiplier: number;
  phase: string;
}

export function PlayerBetsList({ bets, multiplier, phase }: Props) {
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "#1a1b2c", borderRight: "1px solid #2a2b42" }}
    >
      {/* Tabs */}
      <div className="flex items-center shrink-0" style={{ borderBottom: "1px solid #2a2b42" }}>
        {["All Bets", "My Bets", "Top"].map((tab, i) => (
          <button
            key={tab}
            className="flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-all"
            style={{
              color:        i === 0 ? "#e03131" : "#44445a",
              borderBottom: i === 0 ? "2px solid #e03131" : "2px solid transparent",
              background:   "transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Count */}
      <div
        className="flex items-center px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #22233a" }}
      >
        <span className="text-xs" style={{ color: "#44445a" }}>
          Total bets: <span style={{ color: "#e03131" }}>{bets.length}</span>
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-3 px-3 py-1 shrink-0 text-xs"
        style={{ borderBottom: "1px solid #22233a", color: "#33344a" }}
      >
        <span>Player</span>
        <span className="text-center">Bet</span>
        <span className="text-right">x / Win</span>
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
          const curMult = out ? bet.cashoutMultiplier : phase === "flying" ? multiplier : null;
          const payout  = curMult ? (bet.amount * curMult).toFixed(2) : null;

          return (
            <div
              key={bet.userId + "-" + i}
              className="grid grid-cols-3 px-3 py-1.5 transition-all"
              style={{
                borderBottom: "1px solid #18192e",
                background: out ? "rgba(34,197,94,0.05)" : "transparent",
              }}
            >
              <span className="text-xs font-medium truncate" style={{ color: out ? "#aaa" : "#ccc" }}>
                {bet.username}
              </span>
              <span className="text-xs text-center" style={{ color: "#666680" }}>
                ₹{bet.amount.toFixed(2)}
              </span>
              <span className="text-xs text-right font-bold" style={{ color: out ? "#22c55e" : "#44445a" }}>
                {out && curMult ? `${curMult.toFixed(2)}x` : phase === "flying" ? `${multiplier.toFixed(2)}x` : "—"}
                {out && payout && (
                  <span className="block" style={{ color: "#22c55e", fontSize: 10 }}>₹{payout}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
