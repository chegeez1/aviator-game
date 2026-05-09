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
  const [amount, setAmount]           = useState("20");
  const [autoCashout, setAutoCashout] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [betActive, setBetActive]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
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

  function adjustAmount(delta: number) {
    const cur = parseFloat(amount) || 0;
    const next = Math.max(1, Math.round((cur + delta) * 100) / 100);
    setAmount(String(next));
  }

  const isWaiting = gameState.phase === "waiting";
  const isFlying  = gameState.phase === "flying";
  const amt       = parseFloat(amount) || 0;
  const fmtAmt    = amt.toFixed(2);

  return (
    <div
      className="rounded-xl flex flex-col gap-2 p-2.5"
      style={{ background: "#1a1a1a", border: "1px solid #252525" }}
    >
      {/* ── Bet / Auto tabs ── */}
      <div
        className="flex rounded-lg overflow-hidden shrink-0"
        style={{ background: "#111111", border: "1px solid #222222" }}
      >
        {["Bet", "Auto"].map(label => {
          const active = label === "Bet" ? !autoEnabled : autoEnabled;
          return (
            <button
              key={label}
              onClick={() => setAutoEnabled(label === "Auto")}
              className="flex-1 py-1.5 text-xs font-bold transition-all"
              style={{
                background: active ? "#252525" : "transparent",
                color: active ? "#e0e0e0" : "#404040",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Amount stepper ── */}
      <div className="flex items-center gap-2">
        {/* − button */}
        <button
          onClick={() => adjustAmount(-1)}
          className="flex items-center justify-center rounded-full shrink-0 font-black text-lg transition-all active:scale-95"
          style={{
            width: 34, height: 34,
            background: "#111111",
            color: "#888888",
            border: "1px solid #2a2a2a",
          }}
        >
          −
        </button>

        {/* Amount input box */}
        <div
          className="flex-1 flex items-center justify-center rounded-xl"
          style={{ background: "#111111", border: "1px solid #2a2a2a", height: 42 }}
        >
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-center bg-transparent text-white font-black text-lg outline-none"
            style={{ minWidth: 0 }}
          />
        </div>

        {/* + button */}
        <button
          onClick={() => adjustAmount(1)}
          className="flex items-center justify-center rounded-full shrink-0 font-black text-lg transition-all active:scale-95"
          style={{
            width: 34, height: 34,
            background: "#111111",
            color: "#888888",
            border: "1px solid #2a2a2a",
          }}
        >
          +
        </button>
      </div>

      {/* ── Quick preset amounts ── */}
      <div className="grid grid-cols-4 gap-1">
        {quickAmounts.map(q => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className="text-xs font-semibold rounded-lg py-1 transition-all active:scale-95"
            style={{
              background: parseFloat(amount) === q ? "#2a2a2a" : "#141414",
              color: parseFloat(amount) === q ? "#aaaaaa" : "#505050",
              border: `1px solid ${parseFloat(amount) === q ? "#333" : "#222"}`,
            }}
          >
            {q >= 1000 ? `${q / 1000},000` : `${q}.00`}
          </button>
        ))}
      </div>

      {/* ── Auto-cashout row ── */}
      {autoEnabled && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "#111111", border: "1px solid #252525" }}
        >
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#404040" }}>Auto @</span>
          <input
            type="number" placeholder="2.00" value={autoCashout}
            onChange={e => setAutoCashout(e.target.value)}
            className="flex-1 text-center text-sm font-black bg-transparent text-white outline-none"
          />
          <span className="text-xs" style={{ color: "#404040" }}>x</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-xs text-center font-medium" style={{ color: "#e03131" }}>{error}</p>
      )}

      {/* ── Action button ── */}
      {!userId ? (
        <button
          onClick={onAuthClick}
          className="w-full py-3 rounded-xl font-black text-sm transition-all"
          style={{
            background: "rgba(224,49,49,0.08)",
            color: "#e03131",
            border: "1px solid rgba(224,49,49,0.20)",
            letterSpacing: "0.06em",
          }}
        >
          Login to Play
        </button>

      ) : cashoutAvail ? (
        <button
          onClick={handleCashout} disabled={loading}
          className="w-full rounded-xl font-black text-sm transition-all active:scale-[0.98]"
          style={{
            padding: "10px 8px",
            background: loading
              ? "rgba(34,197,94,0.12)"
              : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 4px 24px rgba(34,197,94,0.42)",
            letterSpacing: "0.06em",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="font-black" style={{ fontSize: 13 }}>CASH OUT</span>
              <span className="font-bold opacity-90" style={{ fontSize: 11 }}>
                {(amt * gameState.multiplier).toFixed(2)} KES
              </span>
            </span>
          )}
        </button>

      ) : betActive && isFlying ? (
        <button
          disabled
          className="w-full rounded-xl font-black text-sm"
          style={{
            padding: "10px 8px",
            background: "rgba(34,197,94,0.06)",
            color: "#22c55e",
            border: "1px solid rgba(34,197,94,0.16)",
          }}
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="font-black" style={{ fontSize: 13 }}>IN FLIGHT</span>
            <span className="font-bold opacity-75" style={{ fontSize: 11 }}>{gameState.multiplier.toFixed(2)}x</span>
          </span>
        </button>

      ) : isWaiting ? (
        <button
          onClick={handleBet} disabled={loading || betActive}
          className="w-full rounded-xl font-black text-sm transition-all active:scale-[0.98]"
          style={{
            padding: "10px 8px",
            background: betActive
              ? "rgba(34,197,94,0.06)"
              : loading
                ? "rgba(34,197,94,0.12)"
                : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            color: betActive ? "#22c55e" : "#fff",
            boxShadow: betActive || loading ? "none" : "0 4px 24px rgba(34,197,94,0.42)",
            border: betActive ? "1px solid rgba(34,197,94,0.18)" : "none",
          }}
        >
          {loading ? "..." : betActive ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="font-black" style={{ fontSize: 13 }}>BET PLACED</span>
              <span className="font-bold opacity-75" style={{ fontSize: 11 }}>{fmtAmt} KES</span>
            </span>
          ) : (
            <span className="flex flex-col items-center leading-tight">
              <span className="font-black" style={{ fontSize: 13 }}>BET</span>
              <span className="font-bold opacity-90" style={{ fontSize: 11 }}>{fmtAmt} KES</span>
            </span>
          )}
        </button>

      ) : isFlying ? (
        <button
          onClick={handleBet} disabled={loading}
          className="w-full rounded-xl font-black text-sm transition-all active:scale-[0.98]"
          style={{
            padding: "10px 8px",
            background: loading
              ? "rgba(34,197,94,0.12)"
              : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            color: "#fff",
            boxShadow: loading ? "none" : "0 4px 24px rgba(34,197,94,0.42)",
          }}
        >
          {loading ? "..." : (
            <span className="flex flex-col items-center leading-tight">
              <span className="font-black" style={{ fontSize: 13 }}>BET NEXT</span>
              <span className="font-bold opacity-90" style={{ fontSize: 11 }}>{fmtAmt} KES</span>
            </span>
          )}
        </button>

      ) : (
        <button
          disabled
          className="w-full rounded-xl font-bold text-xs"
          style={{ padding: "12px 8px", background: "#111111", color: "#2a2a2a", border: "1px solid #1c1c1c" }}
        >
          WAIT FOR NEXT ROUND
        </button>
      )}
    </div>
  );
}
