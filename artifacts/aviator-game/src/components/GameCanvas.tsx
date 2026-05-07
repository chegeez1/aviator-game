import { useRef, useEffect, useCallback } from "react";
import type { FullGameState } from "../hooks/useGameState";

interface Props {
  gameState: FullGameState;
}

function drawBiplane(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, scale: number,
  crashed: boolean, tick: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const base  = crashed ? "#b82020" : "#e03131";
  const wing  = crashed ? "#8f1515" : "#b82828";
  const dark  = crashed ? "#6a0f0f" : "#8b0000";
  const light = crashed ? "#cc2222" : "#ff5555";

  // Spinning propeller
  const pAngle = (tick * 0.45) % (Math.PI * 2);
  ctx.save();
  ctx.translate(54, 0);
  ctx.rotate(pAngle);
  ctx.fillStyle = crashed ? "#444" : "#ddd";
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -13, 3.5, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Engine nacelle
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(46, 0, 11, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lower wing
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(12, 7); ctx.lineTo(-28, 7); ctx.lineTo(-38, 24); ctx.lineTo(-8, 24);
  ctx.closePath();
  ctx.fill();

  // Upper wing
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(20, -9); ctx.lineTo(-24, -9); ctx.lineTo(-38, -30); ctx.lineTo(-4, -30);
  ctx.closePath();
  ctx.fill();

  // Wing struts
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  for (const xo of [-6, -18]) {
    ctx.beginPath(); ctx.moveTo(xo, -9); ctx.lineTo(xo - 4, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xo - 14, -30); ctx.lineTo(xo - 4, 7); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-30, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(-8, 7); ctx.stroke();

  // Fuselage
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(54, 0);
  ctx.bezierCurveTo(42, -9, 22, -11, -8, -9);
  ctx.lineTo(-50, 0);
  ctx.bezierCurveTo(-32, 7, 12, 9, 32, 7);
  ctx.bezierCurveTo(44, 4, 54, 2, 54, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(46, -2);
  ctx.bezierCurveTo(32, -7, 12, -8, -8, -6);
  ctx.lineTo(-10, -3);
  ctx.bezierCurveTo(12, -5, 32, -4, 46, 0);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "rgba(160,220,255,0.32)";
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(10, -7, 13, 7.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(-36, -2); ctx.lineTo(-50, -20); ctx.lineTo(-54, -15); ctx.lineTo(-50, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(-38, 2); ctx.lineTo(-48, 14); ctx.lineTo(-52, 9); ctx.lineTo(-44, 2);
  ctx.closePath();
  ctx.fill();

  // Landing gear (taxi only)
  if (!crashed && angle === 0) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    for (const gx of [16, -2]) {
      ctx.beginPath(); ctx.moveTo(gx, 9); ctx.lineTo(gx, 20); ctx.stroke();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath(); ctx.arc(gx + 1, 22, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
    }
  }

  // Exhaust puffs
  if (!crashed && angle < -0.02) {
    const p = (Math.sin(tick * 0.25) + 1) * 0.5;
    ctx.fillStyle = `rgba(200,200,200,${0.05 + p * 0.07})`;
    ctx.beginPath(); ctx.arc(-62, 0, 9 + p * 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-76, -4, 7 + p * 3, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, W: number, H: number, intensity: number = 1
) {
  const numRays = 30;
  const maxR = Math.sqrt(W * W + H * H);
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < numRays; i++) {
    const a0 = (i / numRays) * Math.PI * 2;
    const a1 = ((i + 0.40) / numRays) * Math.PI * 2;
    const gx = Math.cos(a0) * maxR * 0.75;
    const gy = Math.sin(a0) * maxR * 0.75;
    const g = ctx.createLinearGradient(0, 0, gx, gy);
    g.addColorStop(0,    "rgba(255,255,255,0)");
    g.addColorStop(0.06, `rgba(255,255,255,${0.032 * intensity})`);
    g.addColorStop(0.3,  `rgba(255,255,255,${0.018 * intensity})`);
    g.addColorStop(1,    "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxR, a0, a1);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

export function GameCanvas({ gameState }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef      = useRef<number>(0);
  const tickRef      = useRef(0);
  const ptsRef       = useRef<{ x: number; y: number }[]>([]);
  const lastMultRef  = useRef(1.0);
  const taxiXRef     = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    tickRef.current++;
    const tick = tickRef.current;

    ctx.clearRect(0, 0, W, H);
    // Very dark charcoal matching Spribe reference (less blue-tinted than before)
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, W, H);

    const { phase, multiplier, crashMultiplier, countdown } = gameState;
    const padL = 56, padR = 36, padT = 68, padB = 50;
    const aW = W - padL - padR;
    const aH = H - padT - padB;
    const oX = padL;
    const oY = H - padB;

    // ── WAITING ───────────────────────────────────────────────────────────────
    if (phase === "waiting") {
      ptsRef.current = [];
      lastMultRef.current = 1.0;

      drawSunburst(ctx, W * 0.36, H * 0.60, W, H, 1.6);

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.9);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,15,0.6)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // Axis
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, oY); ctx.lineTo(W - padR, oY);
      ctx.stroke();

      // Taxi
      taxiXRef.current += 0.65;
      if (taxiXRef.current > aW * 0.5) taxiXRef.current = 0;
      const tx = padL + 60 + taxiXRef.current;
      const ty = oY - 28;
      const bob = Math.sin(tick * 0.1) * 1.5;

      const pg = ctx.createRadialGradient(tx, oY, 0, tx, oY, 75);
      pg.addColorStop(0, "rgba(224,49,49,0.18)");
      pg.addColorStop(1, "rgba(224,49,49,0)");
      ctx.fillStyle = pg; ctx.fillRect(tx - 90, oY - 10, 180, 55);

      drawBiplane(ctx, tx, ty + bob, 0, 0.62, false, tick);

      // Countdown
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText("NEXT ROUND IN", W / 2, H / 2 - 30);
      ctx.letterSpacing = "0";

      const cSize = Math.round(Math.max(H * 0.115, 42));
      ctx.shadowColor = "#e03131";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#e03131";
      ctx.font = `bold ${cSize}px Inter, sans-serif`;
      ctx.fillText(`${countdown.toFixed(1)}s`, W / 2, H / 2 + 38);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.font = "600 10px Inter, sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("PLACING BETS", W / 2, H / 2 + 66);
      ctx.letterSpacing = "0";
      return;
    }

    // ── FLYING / CRASHED ──────────────────────────────────────────────────────
    const mult = phase === "crashed" && crashMultiplier ? crashMultiplier : multiplier;
    const maxD = Math.max(mult * 1.55 + 0.4, 2.5);

    if (phase === "flying" && mult > lastMultRef.current) {
      lastMultRef.current = mult;
      const N = 180;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const m = Math.pow(mult, t);
        pts.push({
          x: oX + aW * 0.88 * t,
          y: oY - aH * (m - 1) / (maxD - 1),
        });
      }
      ptsRef.current = pts;
    }

    const pts   = ptsRef.current;
    const lastP = pts.length > 0 ? pts[pts.length - 1] : { x: oX, y: oY };

    // Sunburst from plane tip
    drawSunburst(ctx, lastP.x, lastP.y, W, H, phase === "crashed" ? 0.7 : 1.4);

    // Purple inner bloom
    if (phase === "flying") {
      const ig = ctx.createRadialGradient(lastP.x, lastP.y, 0, lastP.x, lastP.y, H * 0.6);
      ig.addColorStop(0, "rgba(50,15,80,0.26)");
      ig.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ig; ctx.fillRect(0, 0, W, H);
    }

    // Vignette
    const vg2 = ctx.createRadialGradient(W / 2, H / 2, H * 0.12, W / 2, H / 2, H * 0.85);
    vg2.addColorStop(0, "rgba(0,0,0,0)");
    vg2.addColorStop(1, "rgba(0,0,15,0.65)");
    ctx.fillStyle = vg2; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    for (let i = 1; i <= 4; i++) {
      const y = oY - (aH * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const x = padL + (aW * i) / 5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, oY); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, oY); ctx.lineTo(W - padR, oY);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = 1 + ((maxD - 1) * i) / 4;
      const y   = oY - (aH * i) / 4;
      ctx.fillText(`${val.toFixed(1)}x`, padL - 5, y + 4);
    }

    if (pts.length >= 2) {
      // SOLID red mountain fill — matches Spribe's dramatic red hill shape
      // Fill from curve down to baseline, using the curve shape as top edge
      const topY = pts[pts.length - 1].y; // highest point reached
      const grad = ctx.createLinearGradient(0, topY, 0, oY);
      if (phase === "crashed") {
        grad.addColorStop(0,    "rgba(160,10,10,0.80)");
        grad.addColorStop(0.35, "rgba(130,5,5,0.55)");
        grad.addColorStop(0.7,  "rgba(90,0,0,0.22)");
        grad.addColorStop(1,    "rgba(50,0,0,0.04)");
      } else {
        grad.addColorStop(0,    "rgba(220,40,40,0.88)");
        grad.addColorStop(0.25, "rgba(200,25,25,0.65)");
        grad.addColorStop(0.6,  "rgba(160,10,10,0.28)");
        grad.addColorStop(0.85, "rgba(100,5,5,0.08)");
        grad.addColorStop(1,    "rgba(60,0,0,0.01)");
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(lastP.x, oY);
      ctx.lineTo(pts[0].x, oY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright red curve line on top
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.shadowColor = phase === "crashed" ? "transparent" : "#ff2020";
      ctx.shadowBlur  = phase === "crashed" ? 0 : 18;
      ctx.strokeStyle = phase === "crashed" ? "#4a1818" : "#e03131";
      ctx.lineWidth   = 3.5;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    // Biplane at tip
    if (phase === "flying" && pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const angle = Math.atan2(lastP.y - p1.y, lastP.x - p1.x);

      const halo = ctx.createRadialGradient(lastP.x, lastP.y, 0, lastP.x, lastP.y, 95);
      halo.addColorStop(0, "rgba(224,49,49,0.28)");
      halo.addColorStop(1, "rgba(224,49,49,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(lastP.x, lastP.y, 95, 0, Math.PI * 2); ctx.fill();

      drawBiplane(ctx, lastP.x, lastP.y, angle, 0.68, false, tick);
    }

    // ── CRASH ─────────────────────────────────────────────────────────────────
    if (phase === "crashed") {
      ctx.fillStyle = "rgba(100,0,0,0.1)";
      ctx.fillRect(0, 0, W, H);

      const fs = Math.round(Math.max(H * 0.088, 32));
      const ms = Math.round(Math.max(H * 0.11, 42));
      const mid = H * 0.45;

      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(224,49,49,0.95)";
      ctx.shadowBlur  = 38;
      ctx.fillStyle   = "#e03131";
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      ctx.fillText("FLEW AWAY!", W / 2, mid);
      ctx.font = `bold ${ms}px Inter, sans-serif`;
      ctx.fillText(`${(crashMultiplier ?? 1).toFixed(2)}x`, W / 2, mid + ms * 0.95);
      ctx.shadowBlur  = 0;
    }

    // ── LIVE MULTIPLIER — large, centered above the curve, matching Spribe ──────
    if (phase === "flying") {
      const ms = Math.round(Math.max(H * 0.13, 50));
      // Place at horizontal center of canvas, vertically in upper 40% of canvas
      const textX = W / 2;
      const textY = Math.max(lastP.y - 30, padT + ms + 10);

      ctx.textAlign   = "center";
      ctx.shadowColor = "rgba(255,255,255,0.45)";
      ctx.shadowBlur  = 28;
      ctx.fillStyle   = "#ffffff";
      ctx.font        = `bold ${ms}px Inter, sans-serif`;
      ctx.fillText(`${multiplier.toFixed(2)}x`, textX, Math.min(textY, H / 2));
      ctx.shadowBlur  = 0;
    }
  }, [gameState]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
      const c = canvas.getContext("2d");
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
