import type { Round } from "../lib/api";

interface Props {
  history: Round[];
}

function pillStyle(mult: number): { bg: string; color: string } {
  if (mult < 2) return { bg: "#c0181e", color: "#fff" };
  if (mult < 10) return { bg: "#7c3aed", color: "#fff" };
  return { bg: "#1d4ed8", color: "#fff" };
}

export function HistoryBar({ history }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 overflow-x-auto shrink-0 scrollbar-none"
      style={{ height: 38, background: "#111118", borderBottom: "1px solid #1e1e2e" }}
    >
      {history.length === 0 && (
        <span className="text-xs" style={{ color: "#444" }}>No history yet</span>
      )}
      {history.map((r, i) => {
        const mult = parseFloat(r.crashMultiplier);
        const { bg, color } = pillStyle(mult);
        return (
          <span
            key={r.id + "-" + i}
            className="shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full cursor-default select-none"
            style={{ background: bg, color, minWidth: 46, textAlign: "center", letterSpacing: "0.02em" }}
          >
            {mult.toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
}
