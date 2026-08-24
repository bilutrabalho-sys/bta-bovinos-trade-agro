import { Ic } from '@/components/foundation/icons'

export function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-bta-primary text-white rounded-full font-display font-semibold ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
      <Ic.Shield />
      BTA VERIFIED
    </span>
  )
}
