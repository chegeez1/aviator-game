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

  const prevPhaseRef    = useRef(gameState.phase);
  const prevMultRef     = useRef(gameState.multiplier);
  const prevCountRef    = useRef(gameState.countdown);
  const engineLiveRef   = useRef(false);

  // Phase & multiplier → sounds
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

  // Countdown tick
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
      <div className="flex items-center justify-center h-screen" style={{ background: "#0d0e1c" }}>
        <div className="flex flex-col items-center gap-3">
          <span className="font-black text-3xl tracking-widest uppercase" style={{ color: "#e03131", textShadow: "0 0 24px rgba(224,49,49,0.5)" }}>
            AVIATOR
          </span>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#2a2b42", borderTopColor: "#e03131" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#12131f" }}>
      <Header
        user={user}
        connected={connected}
        onAuthClick={() => setShowAuth(true)}
        onLogout={logout}
        muted={sound.muted}
        onToggleMute={sound.toggleMute}
      />

      <HistoryBar history={gameState.history} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="shrink-0 overflow-hidden" style={{ width: 220, minWidth: 180 }}>
          <PlayerBetsList bets={gameState.bets} multiplier={gameState.multiplier} phase={gameState.phase} />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ background: "#0d0e1c" }}>
            <GameCanvas gameState={gameState} />
          </div>

          {/* Bet panels */}
          <div
            className="grid grid-cols-2 gap-2 p-2 shrink-0"
            style={{ background: "#12131f", borderTop: "1px solid #2a2b42" }}
          >
            <BetPanel
              gameState={gameState}
              userId={user?.id ?? null}
              onBetPlaced={handleBetPlaced}
              onCashout={handleCashout}
              panelIndex={0}
            />
            <BetPanel
              gameState={gameState}
              userId={user ? -(user.id) : null}
              onBetPlaced={handleBetPlaced}
              onCashout={handleCashout}
              panelIndex={1}
            />
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 28, background: "#0d0e1c", borderTop: "1px solid #1a1b2c" }}
      >
        <span className="text-xs" style={{ color: "#33344a" }}>🔒 Provably Fair Game</span>
        <span className="text-xs font-semibold" style={{ color: "#33344a" }}>Powered by <span style={{ color: "#e03131" }}>SPRIBE</span></span>
      </div>

      {showAuth && (
        <AuthModal onLogin={login} onRegister={register} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}
