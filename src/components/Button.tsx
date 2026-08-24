import { useState, useRef } from 'react'
import { sounds, type SoundKey } from '@/utils/sound'

// ─── Ripple + Sound ────────────────────────────────────────────────────────

type RippleDot = { id: number; x: number; y: number }

export function Btn({
  children, className = '', onClick, sound = 'tap', dark = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { sound?: SoundKey; dark?: boolean }) {
  const [dots, setDots] = useState<RippleDot[]>([])
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const id = Date.now() + Math.random()
    setDots(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setDots(prev => prev.filter(d => d.id !== id)), 560)
    sounds[sound]()
    if (ref.current) {
      ref.current.classList.remove('spring-press')
      void ref.current.offsetWidth
      ref.current.classList.add('spring-press')
    }
    onClick?.(e)
  }

  return (
    <button ref={ref} className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>
      {dots.map(d => (
        <span key={d.id} className={`ripple-dot${dark ? ' ripple-dot-dark' : ''}`} style={{ left: d.x, top: d.y }} />
      ))}
      {children}
    </button>
  )
}
