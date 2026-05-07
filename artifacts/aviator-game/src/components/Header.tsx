import type { User } from "../hooks/useAuth";

interface Props {
  user: User | null;
  connected: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onDeposit?: () => void;
}

function SoundIcon({ muted }: { muted: boolean }) {
  if (muted) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

export function Header({ user, connected, onAuthClick, onLogout, muted, onToggleMute, onDeposit }: Props) {
  const balance = user ? parseFloat(user.balance).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  return (
    <header
      className="flex items-center justify-between shrink-0 px-3"
      style={{ height: 52, background: "#111111", borderBottom: "1px solid #1e1e1e", zIndex: 10 }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2">
        {connected && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
        <span
          className="font-black text-xl uppercase select-none"
          style={{ color: "#e03131", letterSpacing: "0.16em", textShadow: "0 0 22px rgba(224,49,49,0.45)" }}
        >
          AVIATOR
        </span>
        <span
          className="font-black rounded px-1.5 py-0.5 uppercase"
          style={{ background: "#e03131", color: "#fff", fontSize: 8, letterSpacing: "0.05em" }}
        >
          SPRIBE
        </span>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2">
        {/* Sound */}
        <button
          onClick={onToggleMute}
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: muted ? "rgba(224,49,49,0.12)" : "rgba(255,255,255,0.05)",
            color: muted ? "#e03131" : "#555555",
            border: `1px solid ${muted ? "rgba(224,49,49,0.3)" : "#222222"}`,
          }}
        >
          <SoundIcon muted={muted} />
        </button>

        {user ? (
          <>
            {/* Balance chip */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "#1a1a1a", border: "1px solid #282828" }}
            >
              <span className="text-xs" style={{ color: "#555555" }}>KES</span>
              <span className="font-black text-sm" style={{ color: "#ffffff" }}>{balance}</span>
            </div>

            {/* Deposit */}
            <button
              onClick={onDeposit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all"
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "#fff",
                boxShadow: "0 0 18px rgba(34,197,94,0.35)",
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ fontSize: 14 }}>+</span>
              Deposit
            </button>

            {/* User menu */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "#1a1a1a", color: "#666666", border: "1px solid #222222" }}
            >
              <span style={{ color: "#555555", fontSize: 11 }}>
                {user.username}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            {/* Balance zero */}
            <div
              className="items-center gap-2 px-3 py-1.5 rounded-lg hidden sm:flex"
              style={{ background: "#1a1a1a", border: "1px solid #222222" }}
            >
              <span className="text-xs" style={{ color: "#444444" }}>KES</span>
              <span className="font-black text-sm" style={{ color: "#444444" }}>0.00</span>
            </div>

            {/* Deposit → triggers login */}
            <button
              onClick={onAuthClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all"
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "#fff",
                boxShadow: "0 0 18px rgba(34,197,94,0.35)",
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ fontSize: 14 }}>+</span>
              Deposit
            </button>

            <button
              onClick={onAuthClick}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: "#1a1a1a", color: "#888888", border: "1px solid #222222" }}
            >
              Log In
            </button>
          </>
        )}
      </div>
    </header>
  );
}
