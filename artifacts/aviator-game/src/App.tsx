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

  const prevPhaseRef = useRef<string>(gameState.phase);
  const prevMultRef = useRef<number>(gameState.multiplier);
  const prevCountdownRef = useRef<number>(gameState.countdown);
  const engineRunningRef = useRef(false);

  // React to game phase and multiplier changes for sounds
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const curPhase = gameState.phase;
    prevPhaseRef.current = curPhase;

    if (prevPhase !== curPhase) {
      if (curPhase === "flying") {
        sound.playTakeoff();
        setTimeout(() => {
          sound.startEngine();
          engineRunningRef.current = true;
        }, 300);
      }
      if (curPhase === "crashed") {
        if (engineRunningRef.current) {
          sound.stopEngine();
          engineRunningRef.current = false;
        }
        sound.playCrash();
      }
      if (curPhase === "waiting") {
        if (engineRunningRef.current) {
          sound.stopEngine();
          engineRunningRef.current = false;
        }
      }
    }

    // Update engine pitch while flying
    if (curPhase === "flying" && engineRunningRef.current) {
      const prevMult = prevMultRef.current;
      if (gameState.multiplier !== prevMult) {
        sound.updateEngine(gameState.multiplier);
      }
    }
    prevMultRef.current = gameState.multiplier;
  }, [gameState.phase, gameState.multiplier, sound]);

  // Countdown tick
  useEffect(() => {
    if (gameState.phase !== "waiting") return;
    const prevInt = Math.ceil(prevCountdownRef.current);
    const curInt = Math.ceil(gameState.countdown);
    if (curInt !== prevInt && curInt > 0) {
      sound.playTick();
    }
    prevCountdownRef.current = gameState.countdown;
  }, [gameState.countdown, gameState.phase, sound]);

  const handleBetPlaced = useCallback(() => {
    refreshBalance();
    sound.playBet();
  }, [refreshBalance, sound]);

  const handleCashout = useCallback(() => {
    refreshBalance();
    sound.playCashout();
  }, [refreshBalance, sound]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0d0d0d" }}>
        <div className="flex flex-col items-center gap-3">
          <span className="font-black text-3xl tracking-widest uppercase" style={{ color: "#e03131" }}>
            AVIATOR
          </span>
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#333", borderTopColor: "#e03131" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#0d0d0d" }}>
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
        <div className="shrink-0 overflow-hidden" style={{ width: 220, minWidth: 180 }}>
          <PlayerBetsList
            bets={gameState.bets}
            multiplier={gameState.multiplier}
            phase={gameState.phase}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ background: "#0d0d0d" }}>
            <GameCanvas gameState={gameState} />
          </div>

          <div
            className="grid grid-cols-2 gap-2 p-2 shrink-0"
            style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}
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

      {showAuth && (
        <AuthModal
          onLogin={login}
          onRegister={register}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
