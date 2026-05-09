import { useState } from "react";

interface Props {
  onLogin: (phone: string, password: string) => Promise<void>;
  onRegister: (phone: string, password: string) => Promise<void>;
  onClose: () => void;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export function AuthModal({ onLogin, onRegister, onClose }: Props) {
  const [tab, setTab]         = useState<"login" | "register">("login");
  const [phone, setPhone]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fullPhone = "+254" + phone.replace(/\D/g, "").replace(/^254/, "");
    if (!phone.trim()) { setError("Phone number is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        await onLogin(fullPhone, password);
      } else {
        await onRegister(fullPhone, password);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: "login" | "register") {
    setTab(t); setError(null); setPhone(""); setPassword("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm flex flex-col overflow-hidden"
        style={{
          background: "#141414",
          border: "1px solid #242424",
          borderRadius: 20,
          boxShadow: "0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* ── Top brand strip ── */}
        <div
          className="relative flex flex-col items-center pt-8 pb-6"
          style={{
            background: "linear-gradient(180deg, #1a1010 0%, #141414 100%)",
            borderBottom: "1px solid #222",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            style={{ color: "#444", background: "rgba(255,255,255,0.04)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Plane icon */}
          <div className="mb-3" style={{ color: "#e03131" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 3L3 10.5l6.75 2.25L21 3zm0 0L13.5 21l-3.75-8.25L21 3z"/>
            </svg>
          </div>

          <h1
            className="font-black text-3xl uppercase"
            style={{
              color: "#e03131",
              letterSpacing: "0.22em",
              textShadow: "0 0 40px rgba(224,49,49,0.45)",
              lineHeight: 1,
            }}
          >
            AVIATOR
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
            by SPRIBE
          </p>
        </div>

        {/* ── Tab row ── */}
        <div className="flex" style={{ borderBottom: "1px solid #222" }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all"
              style={{
                color: tab === t ? "#ffffff" : "#404040",
                borderBottom: tab === t ? "2px solid #e03131" : "2px solid transparent",
                background: "transparent",
                letterSpacing: "0.14em",
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-6">

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#505050" }}>
              Phone Number
            </label>
            <div
              className="flex items-center rounded-xl overflow-hidden transition-all"
              style={{ background: "#0e0e0e", border: "1px solid #272727" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#e03131")}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#272727")}
            >
              {/* Country prefix */}
              <div
                className="flex items-center gap-1.5 px-3 shrink-0 border-r select-none"
                style={{ color: "#555", borderColor: "#272727", height: 46 }}
              >
                <PhoneIcon />
                <span className="text-sm font-bold" style={{ color: "#555" }}>+254</span>
              </div>
              <input
                type="tel"
                placeholder="7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="flex-1 px-3 py-3 text-sm bg-transparent text-white outline-none placeholder-gray-600"
                style={{ height: 46 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#505050" }}>
              Password
            </label>
            <div
              className="flex items-center rounded-xl overflow-hidden transition-all"
              style={{ background: "#0e0e0e", border: "1px solid #272727" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#e03131")}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#272727")}
            >
              <div
                className="flex items-center px-3 shrink-0"
                style={{ color: "#555", height: 46 }}
              >
                <LockIcon />
              </div>
              <input
                type={showPass ? "text" : "password"}
                placeholder={tab === "register" ? "Min. 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                className="flex-1 py-3 text-sm bg-transparent text-white outline-none placeholder-gray-600"
                style={{ height: 46, minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                className="px-3 flex items-center shrink-0 transition-colors"
                style={{ color: showPass ? "#e03131" : "#444", height: 46 }}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium"
              style={{ background: "rgba(224,49,49,0.08)", border: "1px solid rgba(224,49,49,0.22)", color: "#e55" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all mt-0.5"
            style={{
              background: loading
                ? "#1a1a1a"
                : "linear-gradient(135deg, #e03131 0%, #b91c1c 100%)",
              color: loading ? "#404040" : "#fff",
              boxShadow: loading ? "none" : "0 4px 28px rgba(224,49,49,0.38)",
              letterSpacing: "0.14em",
              border: loading ? "1px solid #242424" : "none",
            }}
          >
            {loading
              ? "Please wait…"
              : tab === "login"
                ? "Log In"
                : "Create Account"}
          </button>

          {/* Footer hint */}
          <p className="text-xs text-center leading-relaxed" style={{ color: "#2e2e2e" }}>
            {tab === "register"
              ? "New accounts start with KES 10,000 balance"
              : "Use your registered Kenyan phone number"}
          </p>
        </form>
      </div>
    </div>
  );
}
