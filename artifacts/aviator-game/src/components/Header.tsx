import type { User } from "../hooks/useAuth";

interface Props {
  user: User | null;
  connected: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
}

export function Header({ user, connected, onAuthClick, onLogout }: Props) {
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
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
          style={{ background: "#e03131", color: "#fff", fontSize: 9, letterSpacing: "0.05em" }}
        >
          SPRIBE
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
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
