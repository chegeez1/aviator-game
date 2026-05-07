import { useRef, useCallback, useState } from "react";

export interface SoundControls {
  muted: boolean;
  toggleMute: () => void;
  playTakeoff: () => void;
  startEngine: () => void;
  updateEngine: (multiplier: number) => void;
  stopEngine: () => void;
  playCrash: () => void;
  playCashout: () => void;
  playBet: () => void;
  playTick: (remaining: number) => void;
}

export function useSound(): SoundControls {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const engineNodesRef = useRef<{ nodes: AudioNode[]; oscMain: OscillatorNode; lfo: OscillatorNode; gainNode: GainNode } | null>(null);

  function getCtx(): { ctx: AudioContext; master: GainNode } {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : 0.85;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return { ctx: ctxRef.current, master: masterRef.current! };
  }

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      mutedRef.current = next;
      if (masterRef.current) {
        masterRef.current.gain.setTargetAtTime(next ? 0 : 0.85, masterRef.current.context.currentTime, 0.06);
      }
      return next;
    });
  }, []);

  // ─── TAKEOFF — quick propeller spool-up whoosh ───────────────────────────────
  const playTakeoff = useCallback(() => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;

    // Propeller noise spool-up
    const bufLen = ctx.sampleRate * 0.7;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.setValueAtTime(300, t);
    nf.frequency.exponentialRampToValueAtTime(2800, t + 0.55);
    nf.Q.value = 1.8;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.28, t + 0.07);
    ng.gain.setTargetAtTime(0, t + 0.38, 0.12);
    ns.connect(nf); nf.connect(ng); ng.connect(master);
    ns.start(t);

    // Rising tone
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.1);
    g.gain.setTargetAtTime(0, t + 0.35, 0.12);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.9);
  }, []);

  // ─── ENGINE — realistic prop-plane hum during flight ────────────────────────
  const startEngine = useCallback(() => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;

    // Stop old engine
    if (engineNodesRef.current) {
      const { gainNode } = engineNodesRef.current;
      gainNode.gain.setTargetAtTime(0, t, 0.08);
      const oldNodes = engineNodesRef.current;
      setTimeout(() => {
        try { oldNodes.oscMain.stop(); } catch { /* ok */ }
        try { oldNodes.lfo.stop(); } catch { /* ok */ }
      }, 400);
      engineNodesRef.current = null;
    }

    // Main engine oscillator — sawtooth for that piston-engine sound
    const oscMain = ctx.createOscillator();
    oscMain.type = "sawtooth";
    oscMain.frequency.value = 52;

    // Waveshaper for warm harmonic distortion
    const wsCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      wsCurve[i] = (Math.PI + 180) * x / (Math.PI + 180 * Math.abs(x));
    }
    const ws = ctx.createWaveShaper();
    ws.curve = wsCurve;
    ws.oversample = "4x";

    // Band-pass filter centred on engine fundamental
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 180;
    filt.Q.value = 0.9;

    // LFO — slow cylinder-fire modulation (prop flutter)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 18; // ~18 Hz = prop flutter at takeoff RPM
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(oscMain.frequency);

    // Second partial for richness
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 104;
    const g2 = ctx.createGain();
    g2.gain.value = 0;
    g2.gain.linearRampToValueAtTime(0.055, t + 1.2);
    osc2.connect(g2);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.16, t + 0.8);

    oscMain.connect(ws);
    ws.connect(filt);
    filt.connect(gainNode);
    g2.connect(gainNode);
    gainNode.connect(master);

    oscMain.start(t); lfo.start(t); osc2.start(t);
    engineNodesRef.current = { nodes: [ws, filt, g2, osc2, lfoGain], oscMain, lfo, gainNode };
  }, []);

  const updateEngine = useCallback((multiplier: number) => {
    const e = engineNodesRef.current;
    const ctx = ctxRef.current;
    if (!e || !ctx) return;
    const t = ctx.currentTime;
    // RPM rises logarithmically with multiplier — subtle but noticeable
    const rpm = 52 + Math.log(multiplier) * 18;
    e.oscMain.frequency.setTargetAtTime(rpm, t, 2.5);
    // LFO freq rises too (faster prop flutter)
    e.lfo.frequency.setTargetAtTime(18 + Math.log(multiplier) * 6, t, 2.5);
  }, []);

  const stopEngine = useCallback(() => {
    const e = engineNodesRef.current;
    const ctx = ctxRef.current;
    if (!e || !ctx) return;
    engineNodesRef.current = null;
    e.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    setTimeout(() => {
      try { e.oscMain.stop(); } catch { /* ok */ }
      try { e.lfo.stop(); } catch { /* ok */ }
    }, 500);
  }, []);

  // ─── CRASH — boom + silence + dramatic high-pitched flyaway ────────────────
  const playCrash = useCallback(() => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;

    // Sub-bass thud
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(160, t);
    sub.frequency.exponentialRampToValueAtTime(22, t + 0.55);
    const subG = ctx.createGain();
    subG.gain.setValueAtTime(0.7, t);
    subG.gain.setTargetAtTime(0, t + 0.04, 0.45);
    sub.connect(subG); subG.connect(master);
    sub.start(t); sub.stop(t + 2.5);

    // Noise burst
    const bLen = Math.floor(ctx.sampleRate * 0.55);
    const bbuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
    const bd = bbuf.getChannelData(0);
    for (let i = 0; i < bLen; i++) bd[i] = Math.random() * 2 - 1;
    const bs = ctx.createBufferSource();
    bs.buffer = bbuf;
    const bf = ctx.createBiquadFilter();
    bf.type = "lowpass";
    bf.frequency.value = 1400;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.4, t);
    bg.gain.setTargetAtTime(0, t + 0.03, 0.18);
    bs.connect(bf); bf.connect(bg); bg.connect(master);
    bs.start(t);

    // Engine cut-off splutter (brief)
    const splut = ctx.createOscillator();
    splut.type = "sawtooth";
    splut.frequency.setValueAtTime(52, t);
    splut.frequency.setTargetAtTime(20, t, 0.06);
    const spG = ctx.createGain();
    spG.gain.setValueAtTime(0.15, t);
    spG.gain.setTargetAtTime(0, t + 0.01, 0.06);
    splut.connect(spG); spG.connect(master);
    splut.start(t); splut.stop(t + 0.3);

    // High-pitched flyaway whoosh (plane escaping off-screen)
    const wo = ctx.createOscillator();
    wo.type = "sawtooth";
    wo.frequency.setValueAtTime(180, t + 0.08);
    wo.frequency.exponentialRampToValueAtTime(3200, t + 0.7);
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.setValueAtTime(800, t + 0.08);
    wf.frequency.exponentialRampToValueAtTime(4000, t + 0.7);
    wf.Q.value = 1.2;
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, t + 0.08);
    wg.gain.linearRampToValueAtTime(0.22, t + 0.16);
    wg.gain.setTargetAtTime(0, t + 0.55, 0.12);
    wo.connect(wf); wf.connect(wg); wg.connect(master);
    wo.start(t + 0.08); wo.stop(t + 1.2);
  }, []);

  // ─── CASHOUT — coins + ascending win arpeggio ───────────────────────────────
  const playCashout = useCallback(() => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;

    // Coin impact clicks (3 rapid)
    for (let c = 0; c < 3; c++) {
      const cOsc = ctx.createOscillator();
      cOsc.type = "sine";
      const ct = t + c * 0.055;
      cOsc.frequency.setValueAtTime(1800 + c * 200, ct);
      cOsc.frequency.exponentialRampToValueAtTime(600, ct + 0.06);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.18, ct);
      cg.gain.exponentialRampToValueAtTime(0.001, ct + 0.09);
      cOsc.connect(cg); cg.connect(master);
      cOsc.start(ct); cOsc.stop(ct + 0.12);
    }

    // Ascending win arpeggio — major 6th chord
    const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4 C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const nt = t + 0.12 + i * 0.085;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, nt);
      og.gain.linearRampToValueAtTime(0.2, nt + 0.025);
      og.gain.exponentialRampToValueAtTime(0.001, nt + 0.55);
      o.connect(og); og.connect(master);
      o.start(nt); o.stop(nt + 0.6);
    });

    // Final sparkle
    const sp = ctx.createOscillator();
    sp.type = "sine";
    sp.frequency.value = 2093;
    const sg = ctx.createGain();
    const st = t + 0.55;
    sg.gain.setValueAtTime(0, st);
    sg.gain.linearRampToValueAtTime(0.12, st + 0.03);
    sg.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
    sp.connect(sg); sg.connect(master);
    sp.start(st); sp.stop(st + 0.6);
  }, []);

  // ─── BET PLACED — satisfying chip-drop click ────────────────────────────────
  const playBet = useCallback(() => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;
    // Two-tone click (chip drop)
    [820, 560].forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      const ot = t + i * 0.045;
      g.gain.setValueAtTime(0.2 - i * 0.06, ot);
      g.gain.exponentialRampToValueAtTime(0.001, ot + 0.07);
      o.connect(g); g.connect(master);
      o.start(ot); o.stop(ot + 0.1);
    });
  }, []);

  // ─── COUNTDOWN TICK — pitch rises as time runs out ──────────────────────────
  const playTick = useCallback((remaining: number) => {
    const { ctx, master } = getCtx();
    const t = ctx.currentTime;
    // Pitch rises the closer to 0
    const freq = 380 + Math.max(0, (5 - remaining)) * 60;
    const vol = 0.07 + Math.max(0, (5 - remaining)) * 0.018;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.13);
  }, []);

  return { muted, toggleMute, playTakeoff, startEngine, updateEngine, stopEngine, playCrash, playCashout, playBet, playTick };
}
