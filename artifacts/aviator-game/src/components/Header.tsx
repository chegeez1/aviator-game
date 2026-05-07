import type { User } from "../hooks/useAuth";

interface Props {
  user: User | null;
  connected: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function IconVolume({ muted }: { muted: boolean }) {
  return muted ? (
    // Muted icon
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    // Sound on icon
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function Header({ user, connected, onAuthClick, onLogout, muted, onToggleMute }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{ height: 50, background: "#111118", borderBottom: "1px solid #1e1e2e" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          {connected && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          <span
            className="font-black text-xl tracking-widest uppercase"
            style={{ color: "#e03131", letterSpacing: "0.18em" }}
          >
            AVIATOR
          </span>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
          style={{ background: "#e03131", color: "#fff", fontSize: 9 }}
        >
          SPRIBE
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Mute/Unmute button */}
        <button
          onClick={onToggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: muted ? "rgba(224,49,49,0.12)" : "rgba(255,255,255,0.06)",
            color: muted ? "#e03131" : "#aaa",
            border: `1px solid ${muted ? "rgba(224,49,49,0.3)" : "#2a2a3a"}`,
          }}
        >
          <IconVolume muted={muted} />
        </button>

        {user ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "#555" }}>Balance</span>
              <span
                className="font-bold text-sm px-2.5 py-0.5 rounded-full"
                style={{
                  color: "#22c55e",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.18)",
                }}
              >
                ₹{parseFloat(user.balance).toFixed(2)}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: "#777" }}>{user.username}</span>
            <button
              onClick={onLogout}
              className="text-xs px-2.5 py-1 rounded-md transition-colors"
              style={{ color: "#666", background: "#1a1a28", border: "1px solid #2a2a3a" }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={onAuthClick}
            className="text-sm font-bold px-4 py-1.5 rounded-md transition-all"
            style={{
              background: "linear-gradient(135deg, #e03131, #c0392b)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(224,49,49,0.3)",
            }}
          >
            Login / Register
          </button>
        )}
      </div>
    </header>
  );
}
