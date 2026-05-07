import { useRef, useEffect, useCallback } from "react";
import type { FullGameState } from "../hooks/useGameState";

interface Props {
  gameState: FullGameState;
}

function drawBiplane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale: number,
  crashed: boolean,
  tick: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const baseColor = crashed ? "#cc2222" : "#e03131";
  const wingColor = crashed ? "#b01a1a" : "#c0272b";
  const darkColor = crashed ? "#881010" : "#8b0000";
  const lightColor = crashed ? "#dd3333" : "#ff4444";

  // Propeller (spinning)
  const propAngle = (tick * 0.35) % (Math.PI * 2);
  ctx.save();
  ctx.translate(52, 0);
  ctx.rotate(propAngle);
  ctx.fillStyle = crashed ? "#555" : "#ccc";
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -12, 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Engine nacelle
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(44, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lower wing
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(-30, 6);
  ctx.lineTo(-38, 22);
  ctx.lineTo(-10, 22);
  ctx.closePath();
  ctx.fill();

  // Upper wing
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(18, -8);
  ctx.lineTo(-26, -8);
  ctx.lineTo(-38, -28);
  ctx.lineTo(-6, -28);
  ctx.closePath();
  ctx.fill();

  // Wing struts (4 thin vertical lines)
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  for (const xOff of [-8, -20]) {
    ctx.beginPath();
    ctx.moveTo(xOff, -8);
    ctx.lineTo(xOff - 4, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xOff - 14, -28);
    ctx.lineTo(xOff - 4, 6);
    ctx.stroke();
  }

  // Wing cross-wire
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-32, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-26, -8);
  ctx.lineTo(-10, 6);
  ctx.stroke();

  // Fuselage
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(52, 0);
  ctx.bezierCurveTo(40, -8, 20, -10, -10, -8);
  ctx.lineTo(-48, 0);
  ctx.bezierCurveTo(-30, 6, 10, 8, 30, 6);
  ctx.bezierCurveTo(42, 4, 52, 2, 52, 0);
  ctx.closePath();
  ctx.fill();

  // Fuselage highlight stripe
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.moveTo(44, -2);
  ctx.bezierCurveTo(30, -6, 10, -7, -10, -5);
  ctx.lineTo(-12, -3);
  ctx.bezierCurveTo(10, -5, 30, -4, 44, 0);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy
  ctx.fillStyle = "rgba(180,230,255,0.35)";
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(8, -6, 12, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tail vertical stabilizer
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.moveTo(-36, -2);
  ctx.lineTo(-48, -18);
  ctx.lineTo(-52, -14);
  ctx.lineTo(-48, -2);
  ctx.closePath();
  ctx.fill();

  // Tail horizontal stabilizer
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(-36, 2);
  ctx.lineTo(-46, 12);
  ctx.lineTo(-50, 8);
  ctx.lineTo(-42, 2);
  ctx.closePath();
  ctx.fill();

  // Wheel/landing gear (only show during wait/taxi)
  if (!crashed) {
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(10, 18);
    ctx.lineTo(20, 18);
    ctx.lineTo(20, 8);
    ctx.stroke();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(15, 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-8, 18);
    ctx.lineTo(2, 18);
    ctx.lineTo(2, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-3, 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exhaust smoke during flight
  if (!crashed && angle < 0) {
    const puff = (Math.sin(tick * 0.2) + 1) * 0.5;
    ctx.fillStyle = `rgba(180,180,180,${0.06 + puff * 0.08})`;
    ctx.beginPath();
    ctx.arc(-58, 0, 8 + puff * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-70, -4, 6 + puff * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number
) {
  const numRays = 24;
  const maxRadius = Math.sqrt(width * width + height * height);

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const nextAngle = ((i + 0.45) / numRays) * Math.PI * 2;

    const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * maxRadius * 0.6, Math.sin(angle) * maxRadius * 0.6);
    grad.addColorStop(0, "rgba(255,255,255,0.0)");
    grad.addColorStop(0.15, "rgba(255,255,255,0.018)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.012)");
    grad.addColorStop(1, "rgba(255,255,255,0)");

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxRadius, angle, nextAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}

export function GameCanvas({ gameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);
  const curvePointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastMultRef = useRef(1.0);
  const taxiXRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    tickRef.current += 1;
    const tick = tickRef.current;

    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, width, height);

    const { phase, multiplier, crashMultiplier, countdown } = gameState;

    const padL = 64, padR = 44, padT = 80, padB = 60;
    const availW = width - padL - padR;
    const availH = height - padT - padB;
    const originX = padL;
    const originY = height - padB;

    if (phase === "waiting") {
      // --- WAITING / BETTING PHASE ---
      curvePointsRef.current = [];
      lastMultRef.current = 1.0;

      // Sunburst from lower-left area
      const sbCx = width * 0.38;
      const sbCy = height * 0.58;
      drawSunburst(ctx, sbCx, sbCy, width, height);

      // Subtle radial vignette
      const vign = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.9);
      vign.addColorStop(0, "rgba(0,0,0,0)");
      vign.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, width, height);

      // Grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 10]);
      for (let i = 1; i <= 4; i++) {
        const y = originY - (availH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(width - padR, y); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Axes
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, originY); ctx.lineTo(width - padR, originY);
      ctx.stroke();

      // Taxi animation: plane moves slowly right then resets
      taxiXRef.current += 0.7;
      if (taxiXRef.current > width * 0.48) taxiXRef.current = 0;
      const taxiX = padL + 60 + taxiXRef.current;
      const taxiY = originY - 26;
      const taxiBob = Math.sin(tick * 0.08) * 2;

      // Glow under plane
      const glowGrad = ctx.createRadialGradient(taxiX, taxiY + 26, 0, taxiX, taxiY + 26, 60);
      glowGrad.addColorStop(0, "rgba(224,49,49,0.12)");
      glowGrad.addColorStop(1, "rgba(224,49,49,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(taxiX - 70, taxiY - 10, 140, 80);

      drawBiplane(ctx, taxiX, taxiY + taxiBob, 0, 0.55, false, tick);

      // Countdown overlay
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.letterSpacing = "0.1em";
      ctx.fillText("NEXT ROUND IN", width / 2, height / 2 - 32);
      ctx.letterSpacing = "0";

      ctx.shadowColor = "#e03131";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#e03131";
      ctx.font = `bold ${Math.round(height * 0.12)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${countdown.toFixed(1)}s`, width / 2, height / 2 + 40);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.letterSpacing = "0.18em";
      ctx.fillText("PLACING BETS", width / 2, height / 2 + 68);
      ctx.letterSpacing = "0";
      return;
    }

    // --- FLYING / CRASHED PHASE ---

    // Sunburst emanating from where the plane is / was
    const mult = phase === "crashed" && crashMultiplier ? crashMultiplier : multiplier;
    const maxDisplayMult = Math.max(mult * 1.6 + 0.5, 2.5);

    // Rebuild curve
    if (phase === "flying" && mult > lastMultRef.current) {
      lastMultRef.current = mult;
      const N = 160;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const m = Math.pow(mult, t);
        const px = originX + availW * 0.88 * t;
        const py = originY - availH * (m - 1) / (maxDisplayMult - 1);
        points.push({ x: px, y: py });
      }
      curvePointsRef.current = points;
    }

    const points = curvePointsRef.current;
    const lastPt = points.length > 0 ? points[points.length - 1] : { x: originX, y: originY };

    // Sunburst from plane tip
    drawSunburst(ctx, lastPt.x, lastPt.y, width, height);

    // Vignette
    const vign2 = ctx.createRadialGradient(width / 2, height / 2, height * 0.15, width / 2, height / 2, height * 0.85);
    vign2.addColorStop(0, "rgba(0,0,0,0)");
    vign2.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vign2;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    for (let i = 1; i <= 4; i++) {
      const y = originY - (availH * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(width - padR, y); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const x = padL + (availW * i) / 5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, originY); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, originY); ctx.lineTo(width - padR, originY);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = 1 + ((maxDisplayMult - 1) * i) / 4;
      const y = originY - (availH * i) / 4;
      ctx.fillText(`${val.toFixed(1)}x`, padL - 8, y + 4);
    }

    if (points.length >= 2) {
      // Fill under curve
      const grad = ctx.createLinearGradient(0, padT, 0, originY);
      if (phase === "crashed") {
        grad.addColorStop(0, "rgba(160,20,20,0.32)");
        grad.addColorStop(0.7, "rgba(120,10,10,0.1)");
        grad.addColorStop(1, "rgba(80,0,0,0.02)");
      } else {
        grad.addColorStop(0, "rgba(224,49,49,0.30)");
        grad.addColorStop(0.5, "rgba(224,49,49,0.10)");
        grad.addColorStop(1, "rgba(224,49,49,0.01)");
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.lineTo(lastPt.x, originY);
      ctx.lineTo(points[0].x, originY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.shadowColor = phase === "crashed" ? "transparent" : "#ff3333";
      ctx.shadowBlur = phase === "crashed" ? 0 : 18;
      ctx.strokeStyle = phase === "crashed" ? "#663333" : "#e03131";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dashed horizontal line at plane height (flying only)
      if (phase === "flying") {
        ctx.strokeStyle = "rgba(224,49,49,0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(padL, lastPt.y);
        ctx.lineTo(lastPt.x, lastPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw biplane at tip (flying only)
    if (phase === "flying" && points.length >= 2) {
      const p1 = points[points.length - 2];
      const p2 = lastPt;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Glow behind plane
      const glowG = ctx.createRadialGradient(lastPt.x, lastPt.y, 0, lastPt.x, lastPt.y, 80);
      glowG.addColorStop(0, "rgba(255,60,60,0.2)");
      glowG.addColorStop(1, "rgba(255,60,60,0)");
      ctx.fillStyle = glowG;
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 80, 0, Math.PI * 2);
      ctx.fill();

      drawBiplane(ctx, lastPt.x, lastPt.y, angle, 0.62, false, tick);
    }

    // --- Crash: draw plane flying off screen top-right, show FLEW AWAY ---
    if (phase === "crashed") {
      // Red overlay tint
      ctx.fillStyle = "rgba(120,0,0,0.08)";
      ctx.fillRect(0, 0, width, height);

      // FLEW AWAY text
      const flySize = Math.round(Math.max(height * 0.095, 38));
      const crashSize = Math.round(Math.max(height * 0.12, 46));

      ctx.shadowColor = "rgba(224,49,49,0.9)";
      ctx.shadowBlur = 32;
      ctx.fillStyle = "#e03131";
      ctx.font = `bold ${flySize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("FLEW AWAY!", width / 2, height / 2 - 14);

      ctx.font = `bold ${crashSize}px Inter, sans-serif`;
      ctx.fillText(`${(crashMultiplier ?? 1).toFixed(2)}x`, width / 2, height / 2 + crashSize * 0.85);
      ctx.shadowBlur = 0;
    }

    // Flying multiplier (center display)
    if (phase === "flying") {
      const displayVal = multiplier;
      const multSize = Math.round(Math.max(height * 0.135, 52));

      ctx.shadowColor = "rgba(255,255,255,0.35)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${multSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${displayVal.toFixed(2)}x`, width / 2, height / 2 + multSize * 0.35);
      ctx.shadowBlur = 0;
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
