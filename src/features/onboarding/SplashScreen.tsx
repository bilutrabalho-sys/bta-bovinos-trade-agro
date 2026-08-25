import { useEffect, useRef } from 'react'

// Respeita "reduzir movimento" do sistema: nesse caso mostramos só a imagem
// (poster), sem o vídeo. Resolvido uma vez no carregamento do módulo.
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Splash "viva": vídeo do boi Angus respirando (arte hiper-realista com a marca
// BTA já embutida). O poster (primeiro frame) pinta instantâneo e serve de
// fallback offline / reduced-motion. Autoplay em WebView exige muted+playsInline.
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Tempo suficiente para o boi respirar ~1 ciclo antes de avançar.
    const t = setTimeout(onDone, REDUCED_MOTION ? 2600 : 4200)
    // Alguns WebViews Android precisam de um empurrão para dar autoplay.
    videoRef.current?.play().catch(() => {})
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex-1 relative overflow-hidden bg-black">
      {REDUCED_MOTION ? (
        <img
          src="/media/bta-hero.png"
          alt="BTA — Bovinos Trade Agro. Inteligência que movimenta o gado."
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src="/media/bta-hero.mp4"
          poster="/media/bta-hero.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Toque em qualquer lugar para entrar (também dá acessibilidade) */}
      <button onClick={onDone} aria-label="Entrar no BTA" className="absolute inset-0" />

      {/* Dica sutil na base */}
      <div className="absolute inset-x-0 bottom-7 flex justify-center pointer-events-none">
        <span className="text-white/55 text-[11px] font-display font-medium tracking-wide animate-pulse">
          Toque para entrar
        </span>
      </div>
    </div>
  )
}
