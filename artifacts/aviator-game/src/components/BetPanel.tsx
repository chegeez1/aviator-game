import { useState, useEffect, useRef } from "react";
import type { FullGameState } from "../hooks/useGameState";
import { api } from "../lib/api";

interface Props {
  gameState: FullGameState;
  userId: number | null;
  onBetPlaced: () => void;
  onCashout: () => void;
  onAuthClick?: () => void;
  panelIndex?: number;
}

export function BetPanel({ gameState, userId, onBetPlaced, onCashout, onAuthClick }: Props) {
  const [amount, setAmount]             = useState("20");
  const [autoCashout, setAutoCashout]   = useState("");
  const [autoEnabled, setAutoEnabled]   = useState(false);
  const [betActive, setBetActive]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [cashoutAvail, setCashoutAvail] = useState(false);
  const prevPhaseRef = useRef(gameState.phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const cur  = gameState.phase;
    prevPhaseRef.current = cur;
    if (cur === "flying"  && betActive) setCashoutAvail(true);
    if (cur === "waiting") { setCashoutAvail(false); setBetActive(false); }
    if (cur === "crashed") setCashoutAvail(false);
    void prev;
  }, [gameState.phase, betActive]);

  useEffect(() => {
    if (!userId) return;
    const myBet = gameState.bets.find(b => b.userId === userId);
    if (myBet?.cashedOut) setCashoutAvail(false);
  }, [gameState.bets, userId]);

  const quickAmounts = [20, 50, 100, 1000];

  async function handleBet() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Invalid amount"); return; }
    setLoading(true); setError(null);
    try {
      await api.placeBet(amt, autoEnabled && autoCashout ? parseFloat(autoCashout) : null);
      setBetActive(true); onBetPlaced();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed"); setBetActive(false);
    } finally { setLoading(false); }
  }

  async function handleCashout() {
    setLoading(true); setError(null);
    try { await api.cashout(); setCashoutAvail(false); onCashout(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  const isWaiting = gameState.phase === "waiting";
  const isFlying  = gameState.phase === "flying";
  const amt       = parseFloat(amount) || 0;

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "#1c1c1c", border: "1px solid #282828" }}
    >
      {/* Tabs */}
      <div className="flex gap-1">
        {["Bet", "Auto"].map(label => {
          const active = label === "Bet" ? !autoEnabled : autoEnabled;
          return (
            <button
              key={label}
              onClick={() => setAutoEnabled(label === "Auto")}
              className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
              style={{
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
                color: active ? "#cccccc" : "#444444",
                border: `1px solid ${active ? "#333333" : "transparent"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Amount row */}
      <div
        className="flex items-center rounded-xl overflow-hidden"
        style={{ background: "#0d0d0d", border: "1px solid #282828" }}
      >
        <button
          onClick={() => setAmount(v => String(Math.max(1, Math.round((parseFloat(v||"0") - 1)*100)/100)))}
          className="px-3 py-2 text-lg font-bold select-none"
          style={{ color: "#444444" }}
        >−</button>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 text-center bg-transparent text-white font-bold text-base outline-none"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={() => setAmount(v => String(Math.round((parseFloat(v||"0") + 1)*100)/100))}
          className="px-3 py-2 text-lg font-bold select-none"
          style={{ color: "#444444" }}
        >+</button>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-1">
        {quickAmounts.map(q => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className="text-xs font-semibold rounded-lg py-1 transition-all"
            style={{ background: "#222222", color: "#606060", border: "1px solid #282828" }}
          >
            {q >= 1000 ? `${q/1000},000.00` : `${q}.00`}
          </button>
        ))}
      </div>

      {/* Auto cashout input */}
      {autoEnabled && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-1.5"
          style={{ background: "#0d0d0d", border: "1px solid #282828" }}
        >
          <span className="text-xs whitespace-nowrap" style={{ color: "#444444" }}>Auto @</span>
          <input
            type="number" placeholder="2.00" value={autoCashout}
            onChange={e => setAutoCashout(e.target.value)}
            className="flex-1 text-center text-sm font-bold bg-transparent text-white outline-none"
          />
          <span className="text-xs" style={{ color: "#444444" }}>x</span>
        </div>
      )}

  {error && <p className="text-xs text-center" style={{ color: "#e03131" }}>{error}</p>}

      {/* Action button */}
      {!userId ? (
        <button
          onClick={onAuthClick}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: "rgba(224,49,49,0.10)",
            color: "#e03131",
            border: "1px solid rgba(224,49,49,0.22)",
          }}
        >
          Login to Play
        </button>

      ) : cashoutAvail ? (
        <button
          onClick={handleCashout} disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: loading ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 0 28px rgba(34,197,94,0.45)",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">CASH OUT</span>
              <span className="text-xs opacity-85 font-bold">{gameState.multiplier.toFixed(2)}x</span>
            </span>
          )}
        </button>

      ) : betActive && isFlying ? (
        <button disabled className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "rgba(34,197,94,0.07)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.18)" }}>
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs opacity-60 font-medium">IN FLIGHT</span>
            <span className="text-base font-black">{gameState.multiplier.toFixed(2)}x</span>
          </span>
        </button>

      ) : isWaiting ? (
        <button
          onClick={handleBet} disabled={loading || betActive}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: betActive ? "rgba(34,197,94,0.08)" : loading ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            color: betActive ? "#22c55e" : "#fff",
            boxShadow: betActive || loading ? "none" : "0 0 24px rgba(34,197,94,0.38)",
            border: betActive ? "1px solid rgba(34,197,94,0.18)" : "none",
          }}
        >
          {loading ? "..." : betActive ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-xs opacity-60 font-medium">BET PLACED</span>
              <span className="text-base font-black">{amt.toFixed(2)} KES</span>
            </span>
          ) : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">BET</span>
              <span className="text-xs opacity-85 font-bold">{amt.toFixed(2)} KES</span>
            </span>
          )}
        </button>

      ) : isFlying ? (
        <button
          onClick={handleBet} disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: loading ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 0 24px rgba(34,197,94,0.38)",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-black">BET NEXT</span>
              <span className="text-xs opacity-85 font-bold">{amt.toFixed(2)} KES</span>
            </span>
          )}
        </button>

      ) : (
        <button disabled className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "#111111", color: "#333333", border: "1px solid #1c1c1c" }}>
          WAIT FOR NEXT ROUND
        </button>
      )}
    </div>
  );
}
