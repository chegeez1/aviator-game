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
  playTick: () => void;
}

export function useSound(): SoundControls {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const engineRef = useRef<{
    osc: OscillatorNode;
    lfo: OscillatorNode;
    gainNode: GainNode;
    filter: BiquadFilterNode;
  } | null>(null);

  function getCtx(): { ctx: AudioContext; master: GainNode } {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : 1;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return { ctx: ctxRef.current, master: masterRef.current! };
  }

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      if (masterRef.current) {
        masterRef.current.gain.setTargetAtTime(next ? 0 : 1, masterRef.current.context.currentTime, 0.05);
      }
      return next;
    });
  }, []);

  // --- Takeoff whoosh when round begins ---
  const playTakeoff = useCallback(() => {
    const { ctx, master } = getCtx();

    // Rising sawtooth whoosh
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.55);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.06);
    gain.gain.setTargetAtTime(0, ctx.currentTime + 0.35, 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  }, []);

  // --- Engine hum that runs throughout the round ---
  const startEngine = useCallback(() => {
    const { ctx, master } = getCtx();

    // Stop old engine cleanly
    if (engineRef.current) {
      const old = engineRef.current;
      try {
        old.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        setTimeout(() => {
          try { old.osc.stop(); } catch { /* already stopped */ }
          try { old.lfo.stop(); } catch { /* already stopped */ }
        }, 400);
      } catch { /* ignore */ }
      engineRef.current = null;
    }

    // Layered engine: low rumble + mid buzz
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 58;

    // LFO for propeller flutter
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 24;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 220;
    filter.Q.value = 1.4;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.6);

    // Second harmonic layer
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 116;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.06;
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(ctx.currentTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(master);
    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    const stopOsc2 = () => { try { osc2.stop(); } catch { /* ignore */ } };
    (gainNode as unknown as { _osc2: OscillatorNode; _stopOsc2: () => void })._osc2 = osc2;
    (gainNode as unknown as { _stopOsc2: () => void })._stopOsc2 = stopOsc2;

    engineRef.current = { osc, lfo, gainNode, filter };
  }, []);

  const updateEngine = useCallback((multiplier: number) => {
    const e = engineRef.current;
    const ctx = ctxRef.current;
    if (!e || !ctx) return;
    // Pitch rises gently with multiplier
    const targetFreq = 58 + Math.min((multiplier - 1) * 5, 60);
    e.osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 1.5);
    e.filter.frequency.setTargetAtTime(220 + Math.min((multiplier - 1) * 12, 180), ctx.currentTime, 1.5);
  }, []);

  const stopEngine = useCallback(() => {
    const e = engineRef.current;
    const ctx = ctxRef.current;
    if (!e || !ctx) return;
    engineRef.current = null;
    e.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    const stopFn = (e.gainNode as unknown as { _stopOsc2?: () => void })._stopOsc2;
    setTimeout(() => {
      try { e.osc.stop(); } catch { /* ignore */ }
      try { e.lfo.stop(); } catch { /* ignore */ }
      if (stopFn) stopFn();
    }, 500);
  }, []);

  // --- Crash boom + whoosh away ---
  const playCrash = useCallback(() => {
    const { ctx, master } = getCtx();

    // Deep boom
    const boom = ctx.createOscillator();
    boom.type = "sine";
    boom.frequency.setValueAtTime(140, ctx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.6);
    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.55, ctx.currentTime);
    boomGain.gain.setTargetAtTime(0, ctx.currentTime + 0.05, 0.5);
    boom.connect(boomGain);
    boomGain.connect(master);
    boom.start(ctx.currentTime);
    boom.stop(ctx.currentTime + 2);

    // Noise burst (explosion texture)
    const bufLen = ctx.sampleRate * 0.6;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.28, ctx.currentTime);
    ng.gain.setTargetAtTime(0, ctx.currentTime + 0.04, 0.22);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(master);
    noise.start(ctx.currentTime);

    // Rising whoosh (plane flying away)
    const whoosh = ctx.createOscillator();
    whoosh.type = "sawtooth";
    whoosh.frequency.setValueAtTime(200, ctx.currentTime + 0.05);
    whoosh.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.7);
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 1200;
    wf.Q.value = 0.8;
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, ctx.currentTime + 0.05);
    wg.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.15);
    wg.gain.setTargetAtTime(0, ctx.currentTime + 0.5, 0.18);
    whoosh.connect(wf);
    wf.connect(wg);
    wg.connect(master);
    whoosh.start(ctx.currentTime + 0.05);
    whoosh.stop(ctx.currentTime + 1.5);
  }, []);

  // --- Cashout chime (ascending major chord) ---
  const playCashout = useCallback(() => {
    const { ctx, master } = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Sparkle high overtone
    const spark = ctx.createOscillator();
    spark.type = "sine";
    spark.frequency.value = 2093;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, ctx.currentTime + 0.25);
    sg.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.28);
    sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    spark.connect(sg);
    sg.connect(master);
    spark.start(ctx.currentTime + 0.25);
    spark.stop(ctx.currentTime + 0.75);
  }, []);

  // --- Bet placed click ---
  const playBet = useCallback(() => {
    const { ctx, master } = getCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime + 0.02, 0.04);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  }, []);

  // --- Countdown tick ---
  const playTick = useCallback(() => {
    const { ctx, master } = getCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 480;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime + 0.01, 0.035);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }, []);

  return {
    muted,
    toggleMute,
    playTakeoff,
    startEngine,
    updateEngine,
    stopEngine,
    playCrash,
    playCashout,
    playBet,
    playTick,
  };
}
