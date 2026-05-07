import { useState, useCallback } from "react";
import { Header } from "./components/Header";
import { HistoryBar } from "./components/HistoryBar";
import { GameCanvas } from "./components/GameCanvas";
import { BetPanel } from "./components/BetPanel";
import { PlayerBetsList } from "./components/PlayerBetsList";
import { AuthModal } from "./components/AuthModal";
import { useGameState } from "./hooks/useGameState";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { gameState, connected } = useGameState();
  const { user, loading, login, register, logout, refreshBalance } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleBetPlaced = useCallback(() => {
    refreshBalance();
  }, [refreshBalance]);

  const handleCashout = useCallback(() => {
    refreshBalance();
  }, [refreshBalance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0d0d0d" }}>
        <div className="flex flex-col items-center gap-3">
          <span
            className="font-black text-3xl tracking-widest uppercase"
            style={{ color: "#e03131" }}
          >
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
