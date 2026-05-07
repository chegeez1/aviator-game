import type { Round } from "../lib/api";

interface Props {
  history: Round[];
}

function pillStyle(mult: number): { bg: string; color: string; border: string } {
  if (mult < 2) return { bg: "rgba(224,49,49,0.12)", color: "#e03131", border: "rgba(224,49,49,0.25)" };
  if (mult < 10) return { bg: "rgba(218,160,0,0.12)", color: "#daa000", border: "rgba(218,160,0,0.25)" };
  return { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" };
}

export function HistoryBar({ history }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 overflow-x-auto shrink-0"
      style={{ height: 38, background: "#111118", borderBottom: "1px solid #1e1e2e" }}
    >
      {history.length === 0 && (
        <span className="text-xs" style={{ color: "#333" }}>No history yet</span>
      )}
      {history.map((r, i) => {
        const mult = parseFloat(r.crashMultiplier);
        const { bg, color, border } = pillStyle(mult);
        return (
          <span
            key={r.id + "-" + i}
            className="shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full cursor-default"
            style={{ background: bg, color, border: `1px solid ${border}` }}
          >
            {mult.toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
}
