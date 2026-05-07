import { useRef, useEffect, useCallback } from "react";
import type { FullGameState } from "../hooks/useGameState";

interface Props {
  gameState: FullGameState;
}

export function GameCanvas({ gameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const curvePointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastMultRef = useRef(1.0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background with subtle radial gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    bgGrad.addColorStop(0, "#141420");
    bgGrad.addColorStop(1, "#0a0a12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const { phase, multiplier, crashMultiplier, countdown } = gameState;

    const padL = 64, padR = 44, padT = 90, padB = 54;
    const availW = width - padL - padR;
    const availH = height - padT - padB;
    const originX = padL;
    const originY = height - padB;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    for (let i = 1; i <= 4; i++) {
      const y = originY - (availH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const x = padL + (availW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, originY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, originY);
    ctx.lineTo(width - padR, originY);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "right";
    const displayMult = phase === "flying" ? multiplier : (phase === "crashed" && crashMultiplier ? crashMultiplier : 1);
    const maxDisplay = Math.max(displayMult * 1.6 + 0.5, 2);
    for (let i = 0; i <= 4; i++) {
      const val = 1 + ((maxDisplay - 1) * i) / 4;
      const y = originY - (availH * i) / 4;
      ctx.fillText(`${val.toFixed(1)}x`, padL - 8, y + 4);
    }

    if (phase === "waiting") {
      curvePointsRef.current = [];
      lastMultRef.current = 1.0;

      // Waiting state — Spribe-style betting phase UI
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NEXT ROUND IN", width / 2, height / 2 - 30);

      ctx.fillStyle = "#e03131";
      ctx.font = "bold 72px Inter, sans-serif";
      ctx.shadowColor = "#e03131";
      ctx.shadowBlur = 30;
      ctx.fillText(`${countdown.toFixed(1)}s`, width / 2, height / 2 + 48);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.letterSpacing = "0.15em";
      ctx.fillText("PLACING BETS", width / 2, height / 2 + 80);
      ctx.letterSpacing = "0";
      return;
    }

    const mult = phase === "crashed" && crashMultiplier ? crashMultiplier : multiplier;

    if (phase === "flying" && mult > lastMultRef.current) {
      lastMultRef.current = mult;
      const N = 140;
      const maxDisplayMult = mult * 1.6 + 0.5;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const m = Math.pow(mult, t);
        const px = originX + availW * 0.85 * t;
        const py = originY - availH * (m - 1) / (maxDisplayMult - 1);
        points.push({ x: px, y: py });
      }
      curvePointsRef.current = points;
    }

    const points = curvePointsRef.current;

    if (points.length < 2) {
      ctx.fillStyle = "#e03131";
      ctx.shadowColor = "#e03131";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(originX, originY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const lastPt = points[points.length - 1];

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, padT, 0, originY);
      if (phase === "crashed") {
        grad.addColorStop(0, "rgba(180,30,30,0.35)");
        grad.addColorStop(0.6, "rgba(180,30,30,0.12)");
        grad.addColorStop(1, "rgba(180,30,30,0.02)");
      } else {
        grad.addColorStop(0, "rgba(224,49,49,0.28)");
        grad.addColorStop(0.5, "rgba(224,49,49,0.10)");
        grad.addColorStop(1, "rgba(224,49,49,0.01)");
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(lastPt.x, originY);
      ctx.lineTo(points[0].x, originY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.shadowColor = phase === "crashed" ? "transparent" : "#ff4444";
      ctx.shadowBlur = phase === "crashed" ? 0 : 16;
      ctx.strokeStyle = phase === "crashed" ? "#666" : "#e03131";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Plane at curve tip (only flying)
      if (phase === "flying" && points.length >= 2) {
        const p1 = points[points.length - 2];
        const p2 = lastPt;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        ctx.save();
        ctx.translate(lastPt.x, lastPt.y);
        ctx.rotate(angle);

        // Glow halo
        ctx.shadowColor = "#ff3333";
        ctx.shadowBlur = 24;

        // Plane body
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-10, 7);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(-6, -18);
        ctx.lineTo(-14, -16);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(-6, 18);
        ctx.lineTo(-14, 16);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();

        // Tail fin
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-17, -10);
        ctx.lineTo(-19, 0);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Multiplier display
    if (phase === "flying" || phase === "crashed") {
      const displayVal = phase === "crashed" && crashMultiplier ? crashMultiplier : multiplier;
      const isCrashed = phase === "crashed";
      const label = isCrashed ? "FLEW AWAY!" : `${displayVal.toFixed(2)}x`;
      const color = isCrashed ? "#e03131" : "#ffffff";

      ctx.shadowColor = isCrashed ? "rgba(224,49,49,0.8)" : "rgba(255,255,255,0.4)";
      ctx.shadowBlur = isCrashed ? 40 : 20;
      ctx.fillStyle = color;
      ctx.font = `bold ${isCrashed ? 76 : 88}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, width / 2, height / 2 - 10);
      ctx.shadowBlur = 0;

      if (isCrashed && crashMultiplier) {
        ctx.fillStyle = "rgba(224,49,49,0.8)";
        ctx.font = "bold 26px Inter, sans-serif";
        ctx.fillText(`@${crashMultiplier.toFixed(2)}x`, width / 2, height / 2 + 42);
      }

      if (isCrashed) {
        ctx.fillStyle = "rgba(200,30,30,0.07)";
        ctx.fillRect(0, 0, width, height);
      }
    }
  }, [gameState]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
