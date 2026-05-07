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
  const [amount, setAmount] = useState("20");
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

    if (cur === "flying" && betActive) setCashoutAvailable(true);
    if (cur === "waiting") {
      setCashoutAvailable(false);
      setBetActive(false);
    }
    if (cur === "crashed") setCashoutAvailable(false);
    void prev;
  }, [gameState.phase, betActive]);

  useEffect(() => {
    if (!userId) return;
    const myBet = gameState.bets.find((b) => b.userId === userId);
    if (myBet?.cashedOut) setCashoutAvailable(false);
  }, [gameState.bets, userId]);

  const quickAmounts = [20, 50, 100, 1000];

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
  const isFlying = gameState.phase === "flying";
  const amt = parseFloat(amount) || 0;

  const tabBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "#fff" : "#555",
        border: `1px solid ${active ? "rgba(255,255,255,0.15)" : "#1e1e2e"}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "#151520", border: "1px solid #1e1e2e" }}
    >
      {/* Tabs */}
      <div className="flex gap-1">
        {tabBtn("Bet", !autoEnabled, () => setAutoEnabled(false))}
        {tabBtn("Auto", autoEnabled, () => setAutoEnabled(true))}
      </div>

      {/* Amount row */}
      <div
        className="flex items-center rounded-lg overflow-hidden"
        style={{ background: "#0d0d18", border: "1px solid #2a2a3a" }}
      >
        <button
          onClick={() => setAmount((v) => String(Math.max(1, Math.round((parseFloat(v || "0") - 1) * 100) / 100)))}
          className="px-3 py-2 text-base font-bold select-none"
          style={{ color: "#666" }}
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
          onClick={() => setAmount((v) => String(Math.round((parseFloat(v || "0") + 1) * 100) / 100))}
          className="px-3 py-2 text-base font-bold select-none"
          style={{ color: "#666" }}
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
            {q >= 1000 ? `${q / 1000}K` : q.toFixed(2)}
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

      {error && <p className="text-xs text-center" style={{ color: "#e03131" }}>{error}</p>}

      {/* Action button */}
      {!userId ? (
        <button
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "#1a1a28", color: "#555", border: "1px solid #2a2a3a" }}
          disabled
        >
          Login to Play
        </button>
      ) : cashoutAvailable ? (
        // CASHOUT button — green
        <button
          onClick={handleCashout}
          disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm transition-all uppercase tracking-wide"
          style={{
            background: loading ? "#2a5a3a" : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 0 28px rgba(34,197,94,0.45)",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">CASH OUT</span>
              <span className="text-xs font-bold opacity-80">{gameState.multiplier.toFixed(2)}x</span>
            </span>
          )}
        </button>
      ) : betActive && isFlying ? (
        // Bet placed, waiting for outcome
        <button
          disabled
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "#1a2a20", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs opacity-70">IN FLIGHT</span>
            <span className="text-base font-black">{gameState.multiplier.toFixed(2)}x</span>
          </span>
        </button>
      ) : isWaiting ? (
        // BET button during waiting phase — green
        <button
          onClick={handleBet}
          disabled={loading || betActive}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: betActive
              ? "#1a2a20"
              : loading
              ? "#2a5a3a"
              : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
            color: betActive ? "#22c55e" : "#fff",
            boxShadow: betActive || loading ? "none" : "0 0 28px rgba(34,197,94,0.4)",
            border: betActive ? "1px solid rgba(34,197,94,0.2)" : "none",
          }}
        >
          {loading ? "..." : betActive ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-xs opacity-70">BET PLACED</span>
              <span className="text-base font-black">{amt.toFixed(2)} KES</span>
            </span>
          ) : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">BET</span>
              <span className="text-xs font-bold opacity-85">{amt.toFixed(2)} KES</span>
            </span>
          )}
        </button>
      ) : isFlying && !betActive ? (
        // BET NEXT button during flying (can queue for next round)
        <button
          onClick={handleBet}
          disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: loading ? "#2a5a3a" : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 0 28px rgba(34,197,94,0.4)",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">BET NEXT</span>
              <span className="text-xs font-bold opacity-85">{amt.toFixed(2)} KES</span>
            </span>
          )}
        </button>
      ) : (
        <button
          disabled
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "#111118", color: "#3a3a4a", border: "1px solid #1e1e2e" }}
        >
          WAIT FOR NEXT ROUND
        </button>
      )}
    </div>
  );
}
