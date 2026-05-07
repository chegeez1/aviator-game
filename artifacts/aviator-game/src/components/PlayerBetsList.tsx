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
      style={{ background: "#111118", borderRight: "1px solid #1e1e2e" }}
    >
      {/* Tabs */}
      <div
        className="flex items-center shrink-0"
        style={{ borderBottom: "1px solid #1e1e2e" }}
      >
        <button
          className="flex-1 py-2 text-xs font-bold uppercase tracking-wide"
          style={{ color: "#e03131", borderBottom: "2px solid #e03131", background: "transparent" }}
        >
          All Bets
        </button>
        <button
          className="flex-1 py-2 text-xs font-bold uppercase tracking-wide"
          style={{ color: "#444", borderBottom: "2px solid transparent", background: "transparent" }}
        >
          My Bets
        </button>
        <button
          className="flex-1 py-2 text-xs font-bold uppercase tracking-wide"
          style={{ color: "#444", borderBottom: "2px solid transparent", background: "transparent" }}
        >
          Top
        </button>
      </div>

      {/* Count */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #1a1a28" }}
      >
        <span className="text-xs" style={{ color: "#555" }}>Total bets: <span style={{ color: "#e03131" }}>{bets.length}</span></span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 shrink-0" style={{ borderBottom: "1px solid #1a1a28" }}>
        <span className="text-xs" style={{ color: "#3a3a4a" }}>Player</span>
        <span className="text-xs text-center" style={{ color: "#3a3a4a" }}>Bet</span>
        <span className="text-xs text-right" style={{ color: "#3a3a4a" }}>x/Profit</span>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-y-auto">
        {bets.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs" style={{ color: "#2a2a3a" }}>No active bets</span>
          </div>
        )}
        {bets.map((bet, i) => {
          const cashedOut = bet.cashedOut;
          const currentMult = cashedOut ? bet.cashoutMultiplier : (phase === "flying" ? multiplier : null);
          const payout = currentMult ? (bet.amount * currentMult).toFixed(2) : null;

          return (
            <div
              key={bet.userId + "-" + i}
              className="grid grid-cols-3 px-3 py-1.5 transition-all"
              style={{
                borderBottom: "1px solid #141420",
                background: cashedOut ? "rgba(34,197,94,0.04)" : "transparent",
              }}
            >
              <span className="text-xs font-medium truncate" style={{ color: "#ccc" }}>
                {bet.username}
              </span>
              <span className="text-xs text-center" style={{ color: "#888" }}>
                ₹{bet.amount.toFixed(2)}
              </span>
              <span
                className="text-xs text-right font-bold"
                style={{ color: cashedOut ? "#22c55e" : "#555" }}
              >
                {cashedOut && currentMult
                  ? `${currentMult.toFixed(2)}x`
                  : phase === "flying"
                  ? `${multiplier.toFixed(2)}x`
                  : "-"}
                {cashedOut && payout ? (
                  <span style={{ display: "block", color: "#22c55e", fontSize: 10 }}>
                    ₹{payout}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
