import { useState } from "react";

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
  onClose: () => void;
}

export function AuthModal({ onLogin, onRegister, onClose }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === "login") {
        await onLogin(username, password);
      } else {
        await onRegister(username, password);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
        style={{ background: "#141420", border: "1px solid #1e1e2e", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Logo */}
        <div className="text-center">
          <h1
            className="font-black text-4xl tracking-widest uppercase mb-1"
            style={{ color: "#e03131", letterSpacing: "0.2em" }}
          >
            AVIATOR
          </h1>
          <p className="text-xs uppercase tracking-wider" style={{ color: "#444" }}>by SPRIBE</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #1e1e2e" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className="flex-1 py-2.5 text-sm font-bold transition-all uppercase tracking-wide"
              style={{
                background: tab === t ? "#e03131" : "transparent",
                color: tab === t ? "#fff" : "#555",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
            style={{
              background: "#0d0d18",
              border: "1px solid #2a2a3a",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#e03131")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a3a")}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
            style={{
              background: "#0d0d18",
              border: "1px solid #2a2a3a",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#e03131")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a3a")}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: "#e03131" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
            style={{
              background: loading
                ? "#2a2a3a"
                : "linear-gradient(135deg, #e03131 0%, #c0392b 100%)",
              color: loading ? "#555" : "#fff",
              boxShadow: loading ? "none" : "0 0 28px rgba(224,49,49,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            {loading ? "..." : tab === "login" ? "LOGIN" : "REGISTER"}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "#3a3a4a" }}>
          New players start with ₹10,000 balance
        </p>
      </div>
    </div>
  );
}
