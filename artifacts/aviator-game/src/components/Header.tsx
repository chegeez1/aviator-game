import type { User } from "../hooks/useAuth";

interface Props {
  user: User | null;
  connected: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function SoundIcon({ muted }: { muted: boolean }) {
  if (muted) return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

export function Header({ user, connected, onAuthClick, onLogout, muted, onToggleMute }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{ height: 48, background: "#14152a", borderBottom: "1px solid #2a2b42" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        {connected && (
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#e03131" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#e03131" }} />
          </span>
        )}
        <span
          className="font-black text-xl uppercase"
          style={{ color: "#e03131", letterSpacing: "0.18em", textShadow: "0 0 20px rgba(224,49,49,0.4)" }}
        >
          AVIATOR
        </span>
        <span
          className="font-bold uppercase rounded px-1.5 py-0.5"
          style={{ background: "#e03131", color: "#fff", fontSize: 8, letterSpacing: "0.06em" }}
        >
          SPRIBE
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          title={muted ? "Unmute" : "Mute"}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: muted ? "rgba(224,49,49,0.15)" : "rgba(255,255,255,0.06)",
            color: muted ? "#e03131" : "#8888aa",
            border: `1px solid ${muted ? "rgba(224,49,49,0.35)" : "#2a2b42"}`,
          }}
        >
          <SoundIcon muted={muted} />
        </button>

        {user ? (
          <>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Balance</span>
              <span className="font-bold text-sm" style={{ color: "#22c55e" }}>
                ₹{parseFloat(user.balance).toFixed(2)}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: "#6668aa" }}>{user.username}</span>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              style={{ color: "#8888aa", background: "#1e2035", border: "1px solid #2a2b42" }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={onAuthClick}
            className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all"
            style={{
              background: "linear-gradient(135deg, #e03131, #b82020)",
              color: "#fff",
              boxShadow: "0 2px 14px rgba(224,49,49,0.35)",
            }}
          >
            Login / Register
          </button>
        )}
      </div>
    </header>
  );
}
