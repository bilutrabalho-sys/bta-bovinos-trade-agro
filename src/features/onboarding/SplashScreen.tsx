import { useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useState(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) })
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0D2B1E 0%, #123B2A 45%, #1E5A40 100%)' }}>

      {/* Decorative rings — animate outward */}
      <div className="absolute" style={{
        width: 480, height: 480, borderRadius: '50%',
        border: '1px solid rgba(214,168,79,0.10)',
        animation: 'splash-ring-3 1.2s cubic-bezier(0.22,1,0.36,1) 0.1s both',
      }} />
      <div className="absolute" style={{
        width: 340, height: 340, borderRadius: '50%',
        border: '1px solid rgba(214,168,79,0.16)',
        animation: 'splash-ring-2 1.0s cubic-bezier(0.22,1,0.36,1) 0.15s both',
      }} />
      <div className="absolute" style={{
        width: 210, height: 210, borderRadius: '50%',
        border: '1px solid rgba(214,168,79,0.24)',
        animation: 'splash-ring-1 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both',
      }} />

      {/* Core brand mark */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Amber rule above */}
        <div style={{
          width: 32, height: 3, borderRadius: 2,
          background: '#D6A84F',
          opacity: 0,
          animation: 'splash-sub 0.5s ease 0.5s forwards',
        }} />

        {/* Main wordmark */}
        <span
          className="font-display font-black brand-shimmer"
          style={{
            fontSize: 96,
            letterSpacing: '-0.055em',
            lineHeight: 0.88,
            animation: 'splash-brand 0.9s cubic-bezier(0.34,1.4,0.64,1) 0.25s both',
          }}
        >
          BTA
        </span>

        {/* Descriptor */}
        <div style={{ opacity: 0, animation: 'splash-sub 0.6s ease 0.75s forwards' }}
          className="flex flex-col items-center gap-1">
          <p className="text-white/50 font-display font-semibold tracking-[0.18em] uppercase text-[10px]">
            Bovinos Trade Agro
          </p>
          <p className="text-white/30 font-display font-medium text-xs tracking-wide">
            Inteligência que movimenta o gado.
          </p>
        </div>
      </div>

      {/* Bottom amber bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #D6A84F 50%, transparent)' }} />
    </div>
  )
}
