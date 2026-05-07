import { useState } from "react";

interface Props {
  onLogin: (phone: string, password: string) => Promise<void>;
  onRegister: (phone: string, password: string) => Promise<void>;
  onClose: () => void;
}

export function AuthModal({ onLogin, onRegister, onClose }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) { setError("Phone number is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        await onLogin(phone.trim(), password);
      } else {
        await onRegister(phone.trim(), password);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#111111",
    border: "1px solid #282828",
    color: "#fff",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.90)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#161616", border: "1px solid #282828", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center justify-center py-8"
          style={{ background: "#111111", borderBottom: "1px solid #282828" }}
        >
          <h1
            className="font-black text-4xl uppercase tracking-widest mb-1"
            style={{ color: "#e03131", textShadow: "0 0 32px rgba(224,49,49,0.5)", letterSpacing: "0.2em" }}
          >
            AVIATOR
          </h1>
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#444444" }}>
            by SPRIBE
          </p>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid #282828" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setPhone(""); setPassword(""); }}
              className="flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all"
              style={{
                background: tab === t ? "#1c1c1c" : "transparent",
                color: tab === t ? "#ffffff" : "#444444",
                borderBottom: tab === t ? "2px solid #e03131" : "2px solid transparent",
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Phone field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#666666" }}>
              Phone Number
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#555555" }}
              >
                📱
              </span>
              <input
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e03131")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#282828")}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#666666" }}>
              Password
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#555555" }}
              >
                🔒
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder={tab === "register" ? "Min. 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                className="w-full pl-9 pr-10 py-3.5 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e03131")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#282828")}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors"
                style={{ color: showPass ? "#e03131" : "#444444" }}
                tabIndex={-1}
              >
                {showPass ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-2.5 text-xs text-center font-medium"
              style={{ background: "rgba(224,49,49,0.10)", border: "1px solid rgba(224,49,49,0.25)", color: "#e03131" }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all mt-1"
            style={{
              background: loading
                ? "#222222"
                : "linear-gradient(135deg, #e03131 0%, #c0392b 100%)",
              color: loading ? "#444444" : "#fff",
              boxShadow: loading ? "none" : "0 0 32px rgba(224,49,49,0.40)",
              letterSpacing: "0.12em",
            }}
          >
            {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
          </button>

          {/* Footer note */}
          <p className="text-xs text-center" style={{ color: "#333333" }}>
            {tab === "register"
              ? "New accounts start with 10,000 KES balance"
              : "Enter your registered phone number to log in"}
          </p>
        </form>
      </div>
    </div>
  );
}
