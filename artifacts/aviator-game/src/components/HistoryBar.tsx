import type { Round } from "../lib/api";

interface Props {
  history: Round[];
}

function pillStyle(mult: number): { bg: string; shadow: string } {
  if (mult < 2)   return { bg: "#1565c0", shadow: "rgba(21,101,192,0.55)" };   // blue   — low
  if (mult < 10)  return { bg: "#c2255c", shadow: "rgba(194,37,92,0.55)" };    // pink   — medium
  return                 { bg: "#7048e8", shadow: "rgba(112,72,232,0.55)" };    // purple — high
}

export function HistoryBar({ history }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 overflow-x-auto shrink-0"
      style={{
        height: 36,
        background: "#14152a",
        borderBottom: "1px solid #2a2b42",
        scrollbarWidth: "none",
      }}
    >
      {history.length === 0 && (
        <span className="text-xs" style={{ color: "#3a3b55" }}>No history yet</span>
      )}
      {history.map((r, i) => {
        const mult = parseFloat(r.crashMultiplier);
        const { bg, shadow } = pillStyle(mult);
        return (
          <span
            key={r.id + "-" + i}
            className="shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full select-none cursor-default"
            style={{
              background: bg,
              color: "#fff",
              minWidth: 44,
              textAlign: "center",
              boxShadow: `0 0 8px ${shadow}`,
              fontSize: 11,
            }}
          >
            {mult.toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
}
