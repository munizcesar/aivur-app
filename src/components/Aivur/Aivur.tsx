// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Mic, Check, X } from "lucide-react";

interface AivurProps {
  size?: number;
  state?: string;
  themeMode?: string;
  lookTarget?: { x: number; y: number } | null;
  className?: string;
  style?: React.CSSProperties;
}

interface AivurTourOverlayProps {
  message: string;
  onDismiss?: () => void;
  mascotState?: string;
  themeMode?: string;
  dismissLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * <Aivur />
 * Mascote oficial da AIVOS — duas esferas (cabeça + corpo) com sombreamento
 * em gradiente simulando acabamento 3D fosco/glossy, inspirado na referência
 * enviada. Sem contorno de linha: a forma é definida só por luz e sombra.
 *
 * Decisões desta versão:
 *  - 3D "de mentira" via gradientes SVG, não WebGL/Three.js — mesma
 *    performance leve de sempre, roda liso em qualquer celular de aluno.
 *  - Sobrancelha voltou, mas discreta: é uma sombra suave sobre o material
 *    (opacidade baixa, sem contorno reto), quase invisível no neutro e mais
 *    presente nas expressões — não é mais uma barra sólida "colada" em cima.
 *  - Boca só aparece em parte dos estados (ver MOUTH_MAP) — no repouso o
 *    rosto é só os dois olhos, como na referência.
 *  - Os 20 estados e toda a "vida" (respiração orgânica, microtremor por
 *    olho, corpo seguindo o olhar) continuam os mesmos de antes.
 *
 * Props:
 *  - size, state, themeMode, lookTarget, className, style — iguais à versão anterior
 */

export const SIZE_PRESETS = { xs: 24, sm: 40, md: 64, lg: 120, xl: 200, xxl: 280 };

const PALETTE = {
  light: {
    paper: "#FAFAF8", card: "#FFFFFF", ink: "#18181B", inkSoft: "#6E6E73", line: "#E7E5E1", accent: "#E86A3D",
    sphereHi: "#FFFFFF", sphereMid: "#F6F4FA", sphereBlue: "#DCD3F0", spherePurple: "#EAC0DC", sphereEdge: "#F3B990",
    eyeDeep: "#242428", eyeDeepSoft: "#3C3C42",
  },
  dark: {
    paper: "#141416", card: "#1C1C1F", ink: "#F2F2F0", inkSoft: "#9A9A9F", line: "#2C2C30", accent: "#F08A5C",
    sphereHi: "#DEDCE2", sphereMid: "#B7AFC9", sphereBlue: "#7D6B9E", spherePurple: "#A8628F", sphereEdge: "#C17A4E",
    eyeDeep: "#000000", eyeDeepSoft: "#0C0C0E",
  },
};

const HEAD = { cx: 100, cy: 82, r: 60 };
const BODY_BALL = { cx: 100, cy: 164, r: 26 };
const EYE_L = { x: 86, y: 80 };
const EYE_R = { x: 114, y: 80 };
const BROW_L = { x: 86, y: 59 };
const BROW_R = { x: 114, y: 59 };
const RING_R = 92;
const SPEAK_RY = [2.5, 5.5, 3.5, 6.5, 2.5];

const BODY_VARIANTS = {
  idle: { animate: { y: [0, -6, 0], x: 0, scaleX: 1, scaleY: 1, rotate: 0 }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } },
  calm: { animate: { y: [0, -3, 0], x: 0, scaleX: 1, scaleY: 1, rotate: 0 }, transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } },
  greeting: { animate: { scaleX: [1, 0.97, 1.02, 1], scaleY: [1, 1.04, 0.98, 1], y: [0, -6, 0], x: 0, rotate: [0, -2, 2, 0] }, transition: { duration: 0.7, ease: "easeOut" } },
  sleepy: { animate: { y: [0, 3, 0], x: 0, scaleX: 1, scaleY: [1, 0.985, 1], rotate: 0 }, transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } },
  focus: { animate: { y: -3, x: 0, scaleX: 1, scaleY: 1.015, rotate: 0 }, transition: { duration: 0.25, ease: "easeOut" } },
  typing: { animate: { y: 0, x: 0, scaleX: 1, scaleY: 1, rotate: 0 }, transition: { duration: 0.2 } },
  password: { animate: { y: 1, x: 0, scaleX: 0.98, scaleY: 0.985, rotate: 0 }, transition: { duration: 0.2 } },
  listening: { animate: { y: 0, x: 0, scaleX: [1, 1.012, 1], scaleY: [1, 1.012, 1], rotate: 0 }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  speaking: { animate: { y: -1, x: 0, scaleX: 1, scaleY: 1.005, rotate: 0 }, transition: { duration: 0.2, ease: "easeOut" } },
  thinking: { animate: { rotate: [0, -2.5, 2.5, 0], y: 0, x: 0, scaleX: 1, scaleY: 1 }, transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } },
  curious: { animate: { rotate: -9, y: -2, x: 0, scaleX: 1, scaleY: 1 }, transition: { duration: 0.3, ease: "easeOut" } },
  loading: { animate: { y: 0, x: 0, scaleX: [1, 1.03, 1], scaleY: [1, 1.03, 1], rotate: 0 }, transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } },
  surprised: { animate: { scaleX: [1, 0.94, 1.03, 1], scaleY: [1, 1.08, 0.98, 1], y: [0, -5, 0], x: 0, rotate: 0 }, transition: { duration: 0.35, ease: "easeOut" } },
  confused: { animate: { rotate: [0, -4, 4, -2, 0], y: 0, x: 0, scaleX: 1, scaleY: 1 }, transition: { duration: 0.7, ease: "easeInOut" } },
  error: { animate: { x: [0, -5, 5, -5, 4, -2, 0], y: 0, scaleX: 1, scaleY: 1, rotate: [0, -2, 2, -1, 0] }, transition: { duration: 0.5, ease: "easeInOut" } },
  concerned: { animate: { y: 2, x: 0, scaleX: 1, scaleY: 0.99, rotate: 0 }, transition: { duration: 0.35, ease: "easeOut" } },
  success: { animate: { scaleX: [1, 0.95, 1.04, 1], scaleY: [1, 1.07, 0.96, 1], y: [0, -4, 0], x: 0, rotate: 0 }, transition: { duration: 0.45, ease: "easeOut" } },
  celebrating: { animate: { scaleX: [1, 0.93, 1.06, 0.97, 1], scaleY: [1, 1.1, 0.93, 1.04, 1], y: [0, -9, 0, -3, 0], x: 0, rotate: [0, -2.5, 2.5, 0] }, transition: { duration: 0.75, ease: "easeOut" } },
  happy: { animate: { y: [0, -5, 0], x: 0, scaleX: 1, scaleY: 1, rotate: 0 }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } },
  proud: { animate: { rotate: [0, 4, 0], y: [0, 1, 0], x: 0, scaleX: 1, scaleY: 1 }, transition: { duration: 0.6, ease: "easeOut" } },
};

// "speaking" tem boca animada à parte (ver render) — não entra neste mapa.
// Boca só em success/celebrating — o resto do tempo o rosto é só olhos,
// pra um ar mais sério/tecnológico e menos "sorriso permanente de desenho".
const MOUTH_MAP = {
  idle: "none", calm: "none", greeting: "none", sleepy: "none", focus: "none",
  typing: "none", password: "none", listening: "none", thinking: "none", curious: "none",
  loading: "none", surprised: "none", confused: "none", error: "none", concerned: "none",
  success: "smile", celebrating: "smile", happy: "none", proud: "none",
};

const STATE_CAPTIONS = {
  idle: "acompanhando o cursor",
  calm: "presença tranquila, sem pressa",
  greeting: "olá — pronto para ajudar",
  sleepy: "em espera, ninguém por aqui",
  focus: "atento ao campo",
  typing: "acompanhando o que você escreve",
  password: "protegendo sua privacidade",
  listening: "ouvindo com atenção",
  speaking: "respondendo",
  thinking: "avaliando com calma",
  curious: "reparando em algo novo",
  loading: "processando",
  surprised: "não esperava por isso",
  confused: "não ficou claro",
  error: "algo não funcionou",
  concerned: "isso pode precisar de atenção",
  success: "confirmado",
  celebrating: "conquista registrada",
  happy: "tudo tranquilo por aqui",
  proud: "bom progresso",
};

const STATE_GROUPS = [
  { label: "base", states: ["idle", "calm", "greeting", "sleepy"] },
  { label: "atenção", states: ["focus", "typing", "password", "listening", "speaking"] },
  { label: "raciocínio", states: ["thinking", "curious", "loading"] },
  { label: "atrito", states: ["confused", "error", "concerned", "surprised"] },
  { label: "conquista", states: ["success", "celebrating", "happy", "proud"] },
];

const BLINK_EYES = ["idle", "focus", "curious", "thinking", "concerned", "happy", "proud", "confused", "calm", "listening"];
const BREATH_STATES = ["idle", "calm", "happy", "sleepy"];

const FIXED_GAZE = {
  greeting: { x: 0, y: -1 },
  sleepy: { x: 0, y: 0 },
  typing: { x: 0, y: 6 },
  password: { x: 0, y: 0 },
  listening: { x: 0, y: -1 },
  speaking: { x: 0, y: 0 },
  thinking: { x: -3.6, y: -4.2 },
  loading: { x: 0, y: 0 },
  surprised: { x: 0, y: 0 },
  confused: { x: 2, y: 1 },
  error: { x: 0, y: 0 },
  concerned: { x: 0, y: 2 },
  success: { x: 0, y: 0 },
  celebrating: { x: 0, y: 0 },
  proud: { x: 0, y: 0 },
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// sem sobrancelha fixa, a expressão precisa vir do próprio olho: largura,
// altura e ângulo mudam mais aqui do que na versão anterior.
function getEyeAnim(state, blinking, side) {
  if (blinking && BLINK_EYES.includes(state)) return { scaleX: 1, scaleY: 0.08, rotate: 0, opacity: 1 };
  switch (state) {
    case "password": return { scaleX: 1, scaleY: 0.08, rotate: 0, opacity: 1 };
    case "typing": return { scaleX: 0.94, scaleY: 0.82, rotate: 0, opacity: 1 };
    case "loading": return { scaleX: 0.9, scaleY: 0.42, rotate: 0, opacity: 1 };
    case "sleepy": return { scaleX: 0.92, scaleY: 0.15, rotate: 0, opacity: 1 };
    case "thinking": return { scaleX: 0.95, scaleY: 0.88, rotate: 0, opacity: 1 };
    case "curious": return side === "left" ? { scaleX: 1.16, scaleY: 1.1, rotate: 0, opacity: 1 } : { scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 };
    case "surprised": return { scaleX: 1.22, scaleY: 1.25, rotate: 0, opacity: 1 };
    case "error": return { scaleX: 0.85, scaleY: 0.86, rotate: side === "left" ? 98 : 82, opacity: 1 };
    case "concerned": return { scaleX: 0.95, scaleY: 0.94, rotate: side === "left" ? -8 : 8, opacity: 1 };
    case "success": return { scaleX: 1, scaleY: 1, rotate: 0, opacity: 0 };
    case "celebrating": return { scaleX: 1, scaleY: 1, rotate: 0, opacity: 0 };
    case "greeting": return { scaleX: 1.1, scaleY: 1.12, rotate: 0, opacity: 1 };
    case "confused": return side === "left" ? { scaleX: 1.05, scaleY: 0.9, rotate: -10, opacity: 1 } : { scaleX: 0.92, scaleY: 0.94, rotate: 8, opacity: 1 };
    case "calm": return { scaleX: 0.95, scaleY: 0.96, rotate: 0, opacity: 1 };
    case "listening": return { scaleX: 1.05, scaleY: 1.04, rotate: 0, opacity: 1 };
    default: return { scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 };
  }
}

// sobrancelha discreta — mesma lógica emocional de antes, só que agora é
// renderizada como sombra suave sobre o material, não uma barra sólida
function getBrowAnim(state, side) {
  switch (state) {
    case "greeting": return { rotate: 0, y: -4, opacity: 0.5 };
    case "calm": return { rotate: 0, y: 0.5, opacity: 0.2 };
    case "focus": return { rotate: 0, y: -1.5, opacity: 0.35 };
    case "password": return { rotate: side === "left" ? -4 : 4, y: 1, opacity: 0.3 };
    case "listening": return { rotate: 0, y: -1, opacity: 0.35 };
    case "thinking": return side === "left" ? { rotate: -9, y: -1.5, opacity: 0.55 } : { rotate: 3, y: 0.5, opacity: 0.4 };
    case "curious": return side === "left" ? { rotate: -11, y: -3.5, opacity: 0.6 } : { rotate: 0, y: 0, opacity: 0.25 };
    case "surprised": return { rotate: 0, y: -5.5, opacity: 0.6 };
    case "confused": return side === "left" ? { rotate: -9, y: -2, opacity: 0.55 } : { rotate: 6, y: 2, opacity: 0.5 };
    case "error": return side === "left" ? { rotate: -14, y: -3, opacity: 0.65 } : { rotate: 10, y: 3, opacity: 0.65 };
    case "concerned": return side === "left" ? { rotate: -11, y: -2, opacity: 0.6 } : { rotate: 11, y: -2, opacity: 0.6 };
    case "success": return { rotate: 0, y: -3, opacity: 0.45 };
    case "celebrating": return side === "left" ? { rotate: -4, y: -5, opacity: 0.55 } : { rotate: 4, y: -5, opacity: 0.55 };
    case "happy": return { rotate: 0, y: -1, opacity: 0.3 };
    case "proud": return { rotate: 0, y: -2, opacity: 0.45 };
    case "sleepy": return { rotate: 0, y: 2, opacity: 0.2 };
    default: return { rotate: 0, y: 0, opacity: 0.25 };
  }
}

export function Aivur({ size = 120, state = "idle", themeMode = "light", lookTarget = null, className = "", style }: AivurProps) {
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [glance, setGlance] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [jitterL, setJitterL] = useState({ x: 0, y: 0 });
  const [jitterR, setJitterR] = useState({ x: 0, y: 0 });
  const [breath, setBreath] = useState({ y: 0, scaleY: 1 });
  const [speakFrame, setSpeakFrame] = useState(0);
  const [reducedMotion] = useState(prefersReducedMotion);
  const colors = PALETTE[themeMode] || PALETTE.light;

  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  // piscadas naturais
  useEffect(() => {
    if (!BLINK_EYES.includes(state) || reducedMotion) return;
    let cancelled = false;
    let t;
    const schedule = () => {
      const delay = 2200 + Math.random() * 2600;
      t = setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => !cancelled && setBlinking(false), 130);
        schedule();
      }, delay);
    };
    schedule();
    return () => { cancelled = true; clearTimeout(t); };
  }, [state, reducedMotion]);

  // olhar espontâneo — pequenos desvios aleatórios em idle/calm
  useEffect(() => {
    if ((state !== "idle" && state !== "calm") || reducedMotion) { setGlance({ x: 0, y: 0 }); return; }
    let cancelled = false;
    let t;
    const schedule = () => {
      const delay = 4000 + Math.random() * 3000;
      t = setTimeout(() => {
        if (cancelled) return;
        const angle = Math.random() * Math.PI * 2;
        const mag = 2 + Math.random() * 1.5;
        setGlance({ x: Math.cos(angle) * mag, y: Math.sin(angle) * mag * 0.6 });
        setTimeout(() => !cancelled && setGlance({ x: 0, y: 0 }), 650);
        schedule();
      }, delay);
    };
    schedule();
    return () => { cancelled = true; clearTimeout(t); };
  }, [state, reducedMotion]);

  // microssacadas — cada olho treme sozinho, em intervalo levemente diferente do outro
  useEffect(() => {
    if (reducedMotion) { setJitterL({ x: 0, y: 0 }); return; }
    let cancelled = false;
    let t;
    const tick = () => {
      t = setTimeout(() => {
        if (cancelled) return;
        setJitterL({ x: (Math.random() - 0.5) * 0.9, y: (Math.random() - 0.5) * 0.6 });
        tick();
      }, 450 + Math.random() * 650);
    };
    tick();
    return () => { cancelled = true; clearTimeout(t); };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) { setJitterR({ x: 0, y: 0 }); return; }
    let cancelled = false;
    let t;
    const tick = () => {
      t = setTimeout(() => {
        if (cancelled) return;
        setJitterR({ x: (Math.random() - 0.5) * 0.9, y: (Math.random() - 0.5) * 0.6 });
        tick();
      }, 520 + Math.random() * 680);
    };
    tick();
    return () => { cancelled = true; clearTimeout(t); };
  }, [reducedMotion]);

  // respiração orgânica — profundidade e duração variam a cada ciclo
  useEffect(() => {
    if (!BREATH_STATES.includes(state) || reducedMotion) { setBreath({ y: 0, scaleY: 1 }); return; }
    let cancelled = false;
    let t;
    let up = true;
    const depthByState = { idle: 6, happy: 5, calm: 3, sleepy: 3 };
    const speedByState = { idle: 1700, happy: 1800, calm: 2600, sleepy: 2400 };
    const baseDepth = depthByState[state] ?? 5;
    const baseSpeed = speedByState[state] ?? 2000;
    const cycle = () => {
      const depth = baseDepth * (0.75 + Math.random() * 0.5);
      const dur = baseSpeed * (0.85 + Math.random() * 0.3);
      setBreath({ y: up ? -depth : 0, scaleY: up ? 1 + depth * 0.003 : 1 });
      up = !up;
      t = setTimeout(() => { if (!cancelled) cycle(); }, dur);
    };
    cycle();
    return () => { cancelled = true; clearTimeout(t); };
  }, [state, reducedMotion]);

  // boca animada durante "speaking"
  useEffect(() => {
    if (state !== "speaking") { setSpeakFrame(0); return; }
    let cancelled = false;
    let t;
    const cycle = () => {
      t = setTimeout(() => {
        if (cancelled) return;
        setSpeakFrame((f) => (f + 1) % SPEAK_RY.length);
        cycle();
      }, 110 + Math.random() * 90);
    };
    cycle();
    return () => { cancelled = true; clearTimeout(t); };
  }, [state]);

  // para onde os olhos olham
  useEffect(() => {
    if (state === "calm") { setEyeOffset({ x: glance.x, y: 1.5 + glance.y }); return; }
    if (FIXED_GAZE[state]) { setEyeOffset(FIXED_GAZE[state]); return; }
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const target = state === "focus" && lookTarget ? lookTarget : mouse;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const max = 4.6;
    const clamped = Math.min(dist / 16, max);
    const base = { x: (dx / dist) * clamped, y: (dy / dist) * clamped };
    const extra = state === "idle" ? glance : { x: 0, y: 0 };
    setEyeOffset({ x: base.x + extra.x, y: base.y + extra.y });
  }, [mouse, state, lookTarget, glance]);

  const isBreathing = BREATH_STATES.includes(state);
  const body = BODY_VARIANTS[state] || BODY_VARIANTS.idle;
  const bodyAnimate = reducedMotion
    ? { ...body.animate, y: 0, x: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : isBreathing
      ? { ...body.animate, y: breath.y, scaleY: breath.scaleY }
      : body.animate;
  const bodyTransition = isBreathing ? { duration: 1.3, ease: "easeInOut" } : body.transition;
  const bodyLeanX = reducedMotion ? 0 : eyeOffset.x * 0.4;
  const bodyLeanRotate = reducedMotion ? 0 : eyeOffset.x * 0.3;
  const strokeW = size < 60 ? 1.6 : 1;
  const browH = size < 60 ? 6 : 4;
  const circumference = 2 * Math.PI * RING_R;
  const ringDash = `${circumference * 0.22} ${circumference}`;
  const mouthType = MOUTH_MAP[state] || "none";

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        width: size, height: size, flexShrink: 0,
        filter: themeMode === "light" ? "drop-shadow(0 15px 25px rgba(0, 0, 0, 0.15))" : "drop-shadow(0 14px 24px rgba(0,0,0,0.55))",
        transition: "filter 0.3s ease",
        ...style,
      }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={`Aivur — ${STATE_CAPTIONS[state] || state}`}>
        <defs>
          <radialGradient id={`sphere-${uid}`} cx="32%" cy="26%" r="85%">
            <stop offset="0%" stopColor={colors.sphereHi} />
            <stop offset="38%" stopColor={colors.sphereMid} />
            <stop offset="66%" stopColor={colors.sphereBlue} />
            <stop offset="85%" stopColor={colors.spherePurple} />
            <stop offset="100%" stopColor={colors.sphereEdge} />
          </radialGradient>
          <linearGradient id={`eye-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.eyeDeep} />
            <stop offset="100%" stopColor={colors.eyeDeepSoft} />
          </linearGradient>
          <filter id={`soft-${uid}`}>
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
        </defs>

        <motion.g animate={{ x: bodyLeanX, rotate: bodyLeanRotate }} transition={{ type: "spring", stiffness: 90, damping: 14 }} style={{ originX: 0.5, originY: 0.5 }}>
          <AnimatePresence>
            {state === "loading" && (
              <motion.circle
                key="ring-loading" cx="100" cy="100" r={RING_R} fill="none" stroke={colors.accent}
                strokeWidth={strokeW + 3} strokeLinecap="round" strokeDasharray={ringDash}
                initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{ opacity: 0 }}
                transition={{ rotate: { repeat: Infinity, ease: "linear", duration: 1.1 }, opacity: { duration: 0.2 } }}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            )}
            {state === "listening" && (
              <motion.circle
                key="ring-listening" cx="100" cy="100" r={RING_R} fill="none" stroke={colors.accent}
                strokeWidth={strokeW + 2} strokeLinecap="round" strokeDasharray="5 11"
                initial={{ opacity: 0 }} animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.03, 1] }} exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            )}
          </AnimatePresence>

          <motion.g animate={bodyAnimate} transition={bodyTransition} style={{ originX: 0.5, originY: 0.5 }}>
            <ellipse cx={BODY_BALL.cx} cy={HEAD.cy + HEAD.r - 8} rx="19" ry="7" fill={colors.eyeDeep} opacity="0.14" filter={`url(#soft-${uid})`} />
            <circle cx={BODY_BALL.cx} cy={BODY_BALL.cy} r={BODY_BALL.r} fill={`url(#sphere-${uid})`} />
            <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={`url(#sphere-${uid})`} />
            <ellipse cx={HEAD.cx - 26} cy={HEAD.cy - 35} rx="21" ry="28" fill="#FFFFFF" opacity={themeMode === "light" ? 0.4 : 0.22} filter={`url(#soft-${uid})`} />

            <motion.g animate={{ y: getBrowAnim(state, "left").y }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <motion.rect
                x={BROW_L.x - 9} y={BROW_L.y - browH / 2} width="18" height={browH} rx={browH / 2}
                fill={colors.eyeDeepSoft}
                animate={{ rotate: getBrowAnim(state, "left").rotate, opacity: getBrowAnim(state, "left").opacity }}
                transition={{ duration: 0.25, ease: "easeOut" }} style={{ originX: 0.5, originY: 0.5 }}
              />
            </motion.g>
            <motion.g animate={{ y: getBrowAnim(state, "right").y }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <motion.rect
                x={BROW_R.x - 9} y={BROW_R.y - browH / 2} width="18" height={browH} rx={browH / 2}
                fill={colors.eyeDeepSoft}
                animate={{ rotate: getBrowAnim(state, "right").rotate, opacity: getBrowAnim(state, "right").opacity }}
                transition={{ duration: 0.25, ease: "easeOut" }} style={{ originX: 0.5, originY: 0.5 }}
              />
            </motion.g>

            <motion.g animate={{ x: eyeOffset.x, y: eyeOffset.y }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <motion.g animate={{ x: jitterL.x, y: jitterL.y }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <motion.rect
                  x={EYE_L.x - 8} y={EYE_L.y - 17} width="16" height="34" rx="8" fill={`url(#eye-${uid})`}
                  animate={getEyeAnim(state, blinking, "left")} transition={{ duration: 0.18 }} style={{ originX: 0.5, originY: 0.5 }}
                />
              </motion.g>
              <motion.g animate={{ x: jitterR.x, y: jitterR.y }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <motion.rect
                  x={EYE_R.x - 8} y={EYE_R.y - 17} width="16" height="34" rx="8" fill={`url(#eye-${uid})`}
                  animate={getEyeAnim(state, blinking, "right")} transition={{ duration: 0.18 }} style={{ originX: 0.5, originY: 0.5 }}
                />
              </motion.g>
            </motion.g>

            <AnimatePresence>
              {(state === "success" || state === "celebrating") && (
                <motion.g key="happy-eyes" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ originX: 0.5, originY: 0.5 }}>
                  <path d={`M ${EYE_L.x - 9} 83 Q ${EYE_L.x} 70 ${EYE_L.x + 9} 83`} fill="none" stroke={colors.eyeDeep} strokeWidth="7" strokeLinecap="round" />
                  <path d={`M ${EYE_R.x - 9} 83 Q ${EYE_R.x} 70 ${EYE_R.x + 9} 83`} fill="none" stroke={colors.eyeDeep} strokeWidth="7" strokeLinecap="round" />
                </motion.g>
              )}
            </AnimatePresence>

            {state === "speaking" ? (
              <motion.ellipse cx="100" cy="118" rx="7" animate={{ ry: SPEAK_RY[speakFrame] }} transition={{ duration: 0.1 }} fill={colors.eyeDeep} />
            ) : (
              <AnimatePresence mode="wait">
                {mouthType !== "none" && (
                  <motion.g key={mouthType} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.18 }} style={{ originX: 0.5, originY: 0.5 }}>
                    {mouthType === "smile" && <path d={`M 86 116 Q 100 129 114 116 Q 100 121 86 116 Z`} fill={`url(#eye-${uid})`} />}
                    {mouthType === "flat" && <path d={`M 87 114 Q 100 109.5 113 114 Q 100 112 87 114 Z`} fill={`url(#eye-${uid})`} />}
                    {mouthType === "soft" && <path d={`M 87 116 Q 100 120.5 113 116 Q 100 118 87 116 Z`} fill={`url(#eye-${uid})`} />}
                    {mouthType === "open" && <circle cx="100" cy="118" r="6.5" fill={`url(#eye-${uid})`} />}
                  </motion.g>
                )}
              </AnimatePresence>
            )}
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}

/**
 * <AivurTourOverlay />
 * Card de notificação para tours/dicas guiadas — sem seta de balão de fala,
 * fundo escuro sofisticado (estilo notificação de macOS/SaaS), botão fantasma.
 * É um componente de apresentação: ele não se posiciona sozinho na tela —
 * quem usa envolve num container próprio (position: fixed/absolute) com as
 * coordenadas certas pro elemento que está sendo indicado no tour.
 *
 * Props:
 *  - message      texto da dica
 *  - onDismiss    função chamada ao clicar em "Entendi" (some o botão se omitido)
 *  - mascotState  estado do Aivur dentro do card (padrão "focus")
 *  - themeMode    tema do Aivur (o card em si é sempre escuro, de propósito)
 *  - dismissLabel texto do botão (padrão "Entendi")
 */
export function AivurTourOverlay({ message, onDismiss, mascotState = "focus", themeMode = "light", dismissLabel = "Entendi", style, className = "" }: AivurTourOverlayProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={className}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14, maxWidth: 320,
        padding: "16px 18px", borderRadius: 16,
        background: "#1B365D",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.25)",
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
    >
      <Aivur size={44} state={mascotState} themeMode={themeMode} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#F3F4F6" }}>{message}</p>
        {onDismiss && (
          <button
            type="button" onClick={onDismiss}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
              marginTop: 10, background: "none", border: "none", padding: 0,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              color: hovered ? "#FFFFFF" : "#9CA3AF", transition: "color 0.2s ease",
            }}
          >
            {dismissLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Página de demonstração                                             */
/* ------------------------------------------------------------------ */

function SectionLabel({ children, colors }) {
  return (
    <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.inkSoft, fontWeight: 500, margin: 0 }}>
      {children}
    </h2>
  );
}

function fieldLabelStyle(colors) {
  return { display: "block", fontSize: 12.5, color: colors.inkSoft, marginBottom: 6 };
}

function inputStyle(colors) {
  return {
    width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10,
    border: `1px solid ${colors.line}`, background: colors.paper, color: colors.ink,
    outline: "none", fontFamily: "'Inter', sans-serif",
  };
}

function flowButtonStyle(colors, variant) {
  return {
    display: "flex", alignItems: "center", gap: 7, fontFamily: "'Inter', sans-serif", fontWeight: 500,
    fontSize: 13.5, padding: "10px 16px", borderRadius: 10, cursor: "pointer",
    border: `1px solid ${variant === "solid" ? colors.ink : colors.line}`,
    background: variant === "solid" ? colors.ink : colors.card,
    color: variant === "solid" ? colors.card : colors.ink,
  };
}

export default function AivurShowcase() {
  const [themeMode, setThemeMode] = useState("light");
  const [heroState, setHeroState] = useState("idle");
  const [lookTarget, setLookTarget] = useState(null);
  const [tourVisible, setTourVisible] = useState(false);
  const nameRef = useRef(null);
  const passRef = useRef(null);
  const sequenceTimeouts = useRef([]);
  const colors = PALETTE[themeMode];

  const clearSequence = () => {
    sequenceTimeouts.current.forEach(clearTimeout);
    sequenceTimeouts.current = [];
  };

  useEffect(() => () => clearSequence(), []);

  useEffect(() => {
    setHeroState("greeting");
    const t = setTimeout(() => setHeroState("idle"), 1300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let inactivityTimer;
    const goSleepy = () => setHeroState((s) => (s === "idle" ? "sleepy" : s));
    const wakeUp = () => {
      clearTimeout(inactivityTimer);
      setHeroState((s) => (s === "sleepy" ? "idle" : s));
      inactivityTimer = setTimeout(goSleepy, 14000);
    };
    window.addEventListener("pointermove", wakeUp);
    window.addEventListener("keydown", wakeUp);
    window.addEventListener("click", wakeUp);
    inactivityTimer = setTimeout(goSleepy, 14000);
    return () => {
      window.removeEventListener("pointermove", wakeUp);
      window.removeEventListener("keydown", wakeUp);
      window.removeEventListener("click", wakeUp);
      clearTimeout(inactivityTimer);
    };
  }, []);

  const selectState = (s) => {
    clearSequence();
    setLookTarget(null);
    setHeroState(s);
  };

  const runSequence = (steps) => {
    clearSequence();
    setLookTarget(null);
    steps.forEach(([s, delay]) => {
      const id = setTimeout(() => setHeroState(s), delay);
      sequenceTimeouts.current.push(id);
    });
  };

  const simulateCorrect = () => runSequence([["loading", 0], ["success", 900], ["celebrating", 1600], ["happy", 2700], ["idle", 4400]]);
  const simulateIncorrect = () => runSequence([["loading", 0], ["confused", 900], ["concerned", 2000], ["idle", 3600]]);
  const simulateVoice = () => runSequence([["listening", 0], ["speaking", 1800], ["success", 4000], ["idle", 4800]]);

  const focusField = (ref, state) => {
    clearSequence();
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setLookTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setHeroState(state);
  };

  const blurField = () => {
    setLookTarget(null);
    setHeroState("idle");
  };

  return (
    <div
      className="aivo-demo-root"
      style={{
        "--accent": colors.accent, minHeight: "100vh", background: colors.paper, color: colors.ink,
        fontFamily: "'Inter', sans-serif", transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .aivo-demo-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
        .aivo-demo-root * { box-sizing: border-box; }
        .aivo-demo-root ::selection { background: var(--accent); color: #fff; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.06em", color: colors.inkSoft, textTransform: "uppercase" }}>
            aivur · aivos · 20 estados
          </span>
          <button
            type="button" onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")} aria-label="Alternar tema"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.line}`, background: colors.card, color: colors.ink, cursor: "pointer" }}
          >
            {themeMode === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Aivur size={240} state={heroState} themeMode={themeMode} lookTarget={lookTarget} />
          <div style={{ marginTop: 22, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.inkSoft, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.accent, display: "inline-block" }} />
            state: {heroState} · {STATE_CAPTIONS[heroState]}
          </div>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, textAlign: "center", margin: "18px 0 8px", letterSpacing: "-0.01em" }}>
          Aivur
        </h1>
        <p style={{ textAlign: "center", color: colors.inkSoft, fontSize: 15, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 40px" }}>
          Duas esferas, luz e sombra — sem contorno de linha. A sobrancelha é quase invisível em repouso e só aparece quando a expressão pede; a boca também é exceção, não regra.
        </p>

        <div style={{ height: 1, background: colors.line, margin: "0 0 32px" }} />

        <section style={{ marginBottom: 44 }}>
          <SectionLabel colors={colors}>fluxo — responder uma questão</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <button type="button" onClick={simulateCorrect} style={flowButtonStyle(colors, "solid")}>
              <Check size={15} /> resposta correta
            </button>
            <button type="button" onClick={simulateIncorrect} style={flowButtonStyle(colors, "outline")}>
              <X size={15} /> resposta incorreta
            </button>
            <button type="button" onClick={simulateVoice} style={flowButtonStyle(colors, "outline")}>
              <Mic size={15} /> pergunta por voz
            </button>
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <SectionLabel colors={colors}>testar cada estado</SectionLabel>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {STATE_GROUPS.map((group) => (
              <div key={group.label} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: colors.inkSoft, width: 68, flexShrink: 0 }}>{group.label}</span>
                {group.states.map((s) => {
                  const active = heroState === s;
                  return (
                    <button
                      key={s} type="button" aria-pressed={active} onClick={() => selectState(s)}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "6px 12px", borderRadius: 999,
                        border: `1px solid ${active ? colors.ink : colors.line}`,
                        background: active ? colors.ink : colors.card, color: active ? colors.card : colors.ink, cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <SectionLabel colors={colors}>exemplo em um formulário</SectionLabel>
          <div style={{ marginTop: 14, background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 16, padding: 22 }}>
            <label style={fieldLabelStyle(colors)}>Nome</label>
            <input ref={nameRef} type="text" placeholder="Como podemos te chamar?" onFocus={() => focusField(nameRef, "focus")} onBlur={blurField} style={inputStyle(colors)} />
            <label style={{ ...fieldLabelStyle(colors), marginTop: 16 }}>Senha</label>
            <input ref={passRef} type="password" placeholder="••••••••" onFocus={() => focusField(passRef, "password")} onBlur={blurField} style={inputStyle(colors)} />
          </div>
        </section>

        <section>
          <SectionLabel colors={colors}>em um chat</SectionLabel>
          <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Aivur size={34} state="idle" themeMode={themeMode} />
            <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 14, color: colors.ink, maxWidth: 260 }}>
              Precisa de ajuda para continuar?
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <SectionLabel colors={colors}>tour / dica guiada</SectionLabel>
          <div style={{ marginTop: 14, position: "relative" }}>
            <button type="button" onClick={() => setTourVisible((v) => !v)} style={flowButtonStyle(colors, "outline")}>
              {tourVisible ? "esconder" : "mostrar"} card de dica
            </button>
            {tourVisible && (
              <div style={{ marginTop: 14 }}>
                <AivurTourOverlay
                  message="Clique aqui para revisar as questões que você errou nesta simulação."
                  onDismiss={() => setTourVisible(false)}
                  mascotState="focus"
                  themeMode={themeMode}
                />
              </div>
            )}
          </div>
        </section>

        <p style={{ marginTop: 56, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: colors.inkSoft, textAlign: "center", lineHeight: 1.7 }}>
          {"<Aivur size={} state={} themeMode={} lookTarget={} />"}
          <br />{"<AivurTourOverlay message={} onDismiss={} mascotState={} />"}
        </p>
      </div>
    </div>
  );
}
