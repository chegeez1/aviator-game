import { useState, useEffect, useRef } from "react";
import type { FullGameState } from "../hooks/useGameState";
import { api } from "../lib/api";

interface Props {
  gameState: FullGameState;
  userId: number | null;
  onBetPlaced: () => void;
  onCashout: () => void;
  panelIndex?: number;
}

export function BetPanel({ gameState, userId, onBetPlaced, onCashout, panelIndex = 0 }: Props) {
  const [amount, setAmount] = useState("10");
  const [autoCashout, setAutoCashout] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [betActive, setBetActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashoutAvailable, setCashoutAvailable] = useState(false);
  const prevPhaseRef = useRef<string>(gameState.phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const cur = gameState.phase;
    prevPhaseRef.current = cur;

    if (cur === "flying" && betActive) {
      setCashoutAvailable(true);
    }
    if (cur === "waiting") {
      setCashoutAvailable(false);
      setBetActive(false);
    }
    if (cur === "crashed") {
      setCashoutAvailable(false);
    }
  }, [gameState.phase, betActive]);

  useEffect(() => {
    if (!userId) return;
    const myBet = gameState.bets.find((b) => b.userId === userId);
    if (myBet?.cashedOut) {
      setCashoutAvailable(false);
    }
  }, [gameState.bets, userId]);

  const quickAmounts = [10, 50, 100, 500];

  async function handleBet() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Invalid amount"); return; }
    setLoading(true);
    setError(null);
    try {
      await api.placeBet(amt, autoEnabled && autoCashout ? parseFloat(autoCashout) : null);
      setBetActive(true);
      onBetPlaced();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setBetActive(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    setLoading(true);
    setError(null);
    try {
      await api.cashout();
      setCashoutAvailable(false);
      onCashout();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const isWaiting = gameState.phase === "waiting";
  const myBetAmount = gameState.bets.find((b) => b.userId === userId)?.amount;

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "#151520", border: "1px solid #1e1e2e" }}
    >
      {/* Tabs: Bet / Auto */}
      <div className="flex gap-1">
        <button
          className="flex-1 py-1 text-xs font-bold rounded-md transition-all"
          style={{
            background: !autoEnabled ? "rgba(224,49,49,0.15)" : "transparent",
            color: !autoEnabled ? "#e03131" : "#555",
            border: `1px solid ${!autoEnabled ? "rgba(224,49,49,0.3)" : "#222230"}`,
          }}
          onClick={() => setAutoEnabled(false)}
        >
          Bet
        </button>
        <button
          className="flex-1 py-1 text-xs font-bold rounded-md transition-all"
          style={{
            background: autoEnabled ? "rgba(224,49,49,0.15)" : "transparent",
            color: autoEnabled ? "#e03131" : "#555",
            border: `1px solid ${autoEnabled ? "rgba(224,49,49,0.3)" : "#222230"}`,
          }}
          onClick={() => setAutoEnabled(true)}
        >
          Auto
        </button>
      </div>

      {/* Amount input */}
      <div
        className="flex items-center rounded-lg overflow-hidden"
        style={{ background: "#0d0d18", border: "1px solid #2a2a3a" }}
      >
        <button
          onClick={() => setAmount((v) => String(Math.max(1, parseFloat(v || "0") - 1)))}
          className="px-3 py-2 text-lg font-bold transition-colors"
          style={{ color: "#555" }}
        >
          −
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 text-center bg-transparent text-white font-bold text-sm outline-none"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={() => setAmount((v) => String(parseFloat(v || "0") + 1))}
          className="px-3 py-2 text-lg font-bold transition-colors"
          style={{ color: "#555" }}
        >
          +
        </button>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-1">
        {quickAmounts.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className="text-xs font-semibold rounded-md py-1 transition-colors"
            style={{ background: "#1a1a28", color: "#888", border: "1px solid #2a2a3a" }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Auto cashout */}
      {autoEnabled && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: "#0d0d18", border: "1px solid #2a2a3a" }}
        >
          <span className="text-xs" style={{ color: "#555", whiteSpace: "nowrap" }}>Auto @</span>
          <input
            type="number"
            placeholder="2.00"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            className="flex-1 text-center text-sm font-bold bg-transparent text-white outline-none"
          />
          <span className="text-xs" style={{ color: "#555" }}>x</span>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-center" style={{ color: "#e03131" }}>{error}</p>}

      {/* Action button */}
      {!userId ? (
        <button
          className="w-full py-2.5 rounded-lg font-bold text-sm"
          style={{ background: "#1a1a28", color: "#555", border: "1px solid #2a2a3a" }}
          disabled
        >
          Login to Play
        </button>
      ) : cashoutAvailable ? (
        <button
          onClick={handleCashout}
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-black text-sm transition-all uppercase tracking-wide"
          style={{
            background: loading ? "#555" : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 0 24px rgba(224,49,49,0.5)",
          }}
        >
          {loading ? "..." : `CASH OUT @ ${gameState.multiplier.toFixed(2)}x`}
        </button>
      ) : betActive && !isWaiting ? (
        <button
          disabled
          className="w-full py-2.5 rounded-lg font-bold text-sm"
          style={{ background: "#1a1a28", color: "#666", border: "1px solid #2a2a3a" }}
        >
          BET PLACED {myBetAmount ? `(₹${myBetAmount})` : ""}
        </button>
      ) : isWaiting ? (
        <button
          onClick={handleBet}
          disabled={loading || betActive}
          className="w-full py-2.5 rounded-lg font-black text-sm transition-all uppercase tracking-wide"
          style={{
            background: betActive
              ? "#1a1a28"
              : loading
              ? "#555"
              : "linear-gradient(135deg, #1a7a3a 0%, #22c55e 100%)",
            color: betActive ? "#555" : "#fff",
            boxShadow: betActive ? "none" : loading ? "none" : "0 0 24px rgba(34,197,94,0.35)",
            border: betActive ? "1px solid #2a2a3a" : "none",
          }}
        >
          {loading ? "..." : betActive ? "BET PLACED" : "BET"}
        </button>
      ) : (
        <button
          disabled
          className="w-full py-2.5 rounded-lg font-bold text-sm"
          style={{ background: "#111118", color: "#3a3a4a", border: "1px solid #1e1e2e" }}
        >
          WAIT FOR NEXT ROUND
        </button>
      )}
    </div>
  );
}
