import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { HistoryBar } from "./components/HistoryBar";
import { GameCanvas } from "./components/GameCanvas";
import { BetPanel } from "./components/BetPanel";
import { PlayerBetsList } from "./components/PlayerBetsList";
import { AuthModal } from "./components/AuthModal";
import { useGameState } from "./hooks/useGameState";
import { useAuth } from "./hooks/useAuth";
import { useSound } from "./hooks/useSound";

export default function App() {
  const { gameState, connected } = useGameState();
  const { user, loading, login, register, logout, refreshBalance } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const sound = useSound();

  const prevPhaseRef  = useRef(gameState.phase);
  const prevMultRef   = useRef(gameState.multiplier);
  const prevCountRef  = useRef(gameState.countdown);
  const engineLiveRef = useRef(false);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const cur  = gameState.phase;
    prevPhaseRef.current = cur;
    if (prev !== cur) {
      if (cur === "flying") {
        sound.playTakeoff();
        setTimeout(() => { sound.startEngine(); engineLiveRef.current = true; }, 320);
      }
      if (cur === "crashed") {
        if (engineLiveRef.current) { sound.stopEngine(); engineLiveRef.current = false; }
        sound.playCrash();
      }
      if (cur === "waiting") {
        if (engineLiveRef.current) { sound.stopEngine(); engineLiveRef.current = false; }
      }
    }
    if (cur === "flying" && engineLiveRef.current && gameState.multiplier !== prevMultRef.current) {
      sound.updateEngine(gameState.multiplier);
    }
    prevMultRef.current = gameState.multiplier;
  }, [gameState.phase, gameState.multiplier, sound]);

  useEffect(() => {
    if (gameState.phase !== "waiting") return;
    const prevInt = Math.ceil(prevCountRef.current);
    const curInt  = Math.ceil(gameState.countdown);
    if (curInt !== prevInt && curInt > 0) sound.playTick(gameState.countdown);
    prevCountRef.current = gameState.countdown;
  }, [gameState.countdown, gameState.phase, sound]);

  const handleBetPlaced = useCallback(() => { refreshBalance(); sound.playBet(); }, [refreshBalance, sound]);
  const handleCashout   = useCallback(() => { refreshBalance(); sound.playCashout(); }, [refreshBalance, sound]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0d0d0d" }}>
        <div className="flex flex-col items-center gap-4">
          <span className="font-black text-4xl tracking-widest uppercase" style={{ color: "#e03131", textShadow: "0 0 32px rgba(224,49,49,0.55)", letterSpacing: "0.2em" }}>
            AVIATOR
          </span>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#222222", borderTopColor: "#e03131" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#0d0d0d" }}>
      {/* Header */}
      <Header
        user={user}
        connected={connected}
        onAuthClick={() => setShowAuth(true)}
        onLogout={logout}
        muted={sound.muted}
        onToggleMute={sound.toggleMute}
        onDeposit={() => setShowAuth(true)}
      />

      {/* History bar */}
      <HistoryBar history={gameState.history} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 overflow-hidden" style={{ width: 224, minWidth: 180 }}>
          <PlayerBetsList
            bets={gameState.bets}
            multiplier={gameState.multiplier}
            phase={gameState.phase}
          />
        </div>

        {/* Canvas + bet panels */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Game canvas */}
          <div className="flex-1 overflow-hidden" style={{ background: "#0d0d0d" }}>
            <GameCanvas gameState={gameState} />
          </div>

          {/* Bet panels */}
          <div
            className="grid grid-cols-2 gap-2 p-2 shrink-0"
            style={{ background: "#111111", borderTop: "1px solid #1e1e1e" }}
          >
            <BetPanel
              gameState={gameState}
              userId={user?.id ?? null}
              onBetPlaced={handleBetPlaced}
              onCashout={handleCashout}
              onAuthClick={() => setShowAuth(true)}
              panelIndex={0}
            />
            <BetPanel
              gameState={gameState}
              userId={user?.id ?? null}
              onBetPlaced={handleBetPlaced}
              onCashout={handleCashout}
              onAuthClick={() => setShowAuth(true)}
              panelIndex={1}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 26, background: "#0a0a0a", borderTop: "1px solid #161616" }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="text-xs" style={{ color: "#333333" }}>Provably Fair Game</span>
        </div>
        <span className="text-xs" style={{ color: "#333333" }}>
          Powered by <span style={{ color: "#e03131", fontWeight: 700 }}>SPRIBE</span>
        </span>
      </div>

      {showAuth && (
        <AuthModal onLogin={login} onRegister={register} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}
