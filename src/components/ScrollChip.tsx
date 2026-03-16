'use client';

import { useRef } from 'react';
import { useScroll, useTransform, useMotionValue, useAnimationFrame, motion } from 'framer-motion';

const D      = 190;
const T      = 26;
const INNER  = D * 0.60;
const SEGS   = 16;

function faceGradient(color: string) {
  const light  = 'rgba(255,255,255,0.28)';
  const parts: string[] = [];
  for (let i = 0; i < SEGS; i++) {
    const s = i * (360 / SEGS);
    const w = 360 / SEGS;
    parts.push(`${color} ${s}deg ${s + w * 0.65}deg`);
    parts.push(`${light}  ${s + w * 0.65}deg ${s + w}deg`);
  }
  return `conic-gradient(${parts.join(', ')})`;
}

const edgeBg = `repeating-linear-gradient(
  to right,
  #b84a08 0px,  #b84a08 10px,
  #e0670f 10px, #e0670f 18px,
  #b84a08 18px, #b84a08 28px,
  #c85510 28px, #c85510 34px
)`;

const orange     = '#F97316';
const orangeDark = '#C2520D';
const faceOff    = (D - INNER) / 2;

export default function ScrollChip() {
  const { scrollYProgress } = useScroll();

  const y      = useTransform(scrollYProgress, [0, 1], [-(D + 60), `calc(100vh + ${D + 80}px)`] as [number, string]);
  const rotY   = useTransform(scrollYProgress, [0, 1], [0, 1440]);
  const scale  = useTransform(scrollYProgress, [0, 0.5, 1], [0.70, 1.18, 0.70]);
  const tiltZ  = useTransform(scrollYProgress, [0, 0.33, 0.67, 1], [0, 13, -13, 0]);

  const swayX = useMotionValue(0);

  useAnimationFrame(() => {
    const p    = scrollYProgress.get();
    const amp  = Math.min(60, window.innerWidth * 0.045);
    swayX.set(Math.sin(p * Math.PI * 3) * amp);
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed', top: 0, left: '70%',
        width: D + 180,
        zIndex: 50,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {/* Fall + sway */}
      <motion.div
        style={{
          position: 'relative', width: D, height: D,
          y,
          x: swayX,
          translateX: '-50%',
        }}
      >
        {/* 3D context */}
        <div style={{ perspective: '1100px', width: D, height: D }}>
          <motion.div
            style={{
              width: D, height: D,
              position: 'relative',
              transformStyle: 'preserve-3d',
              scale,
              rotateZ: tiltZ,
              rotateY: rotY,
            }}
          >
            {/* Front face */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: faceGradient(orange),
              transform: `translateZ(${T / 2}px)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.14) inset',
            }}>
              <div style={{
                position: 'absolute',
                top: faceOff, left: faceOff, right: faceOff, bottom: faceOff,
                borderRadius: '50%',
                background: `radial-gradient(circle at 38% 36%, ${orange}, ${orangeDark})`,
                border: '2px solid rgba(255,255,255,0.20)',
                boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.40)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 32, lineHeight: 1, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}>♠</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.13em', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                  PokerPay
                </span>
              </div>
              <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
            </div>

            {/* Back face */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: faceGradient(orangeDark),
              transform: `rotateY(180deg) translateZ(${T / 2}px)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10) inset',
            }}>
              <div style={{
                position: 'absolute',
                top: faceOff, left: faceOff, right: faceOff, bottom: faceOff,
                borderRadius: '50%',
                background: `radial-gradient(circle at 62% 36%, #e06010, ${orangeDark})`,
                border: '2px solid rgba(255,255,255,0.16)',
                boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.40)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}>♣</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.13em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                  Scroll ↓
                </span>
              </div>
              <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.09)', pointerEvents: 'none' }} />
            </div>

            {/* Edge */}
            <div style={{
              position: 'absolute',
              width: D, height: T,
              left: 0, top: `calc(50% - ${T / 2}px)`,
              background: edgeBg,
              borderRadius: `${D / 2}px`,
              transform: 'rotateX(90deg)',
              backfaceVisibility: 'visible',
              WebkitBackfaceVisibility: 'visible',
            }} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
