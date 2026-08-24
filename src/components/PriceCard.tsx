import { Ic } from './icons'
import { Btn } from './Button'

export function PriceCard({ name, current, change, unit, onPress }: {
  name: string; current: number; change: number; unit: string; onPress?: () => void
}) {
  const up = change >= 0
  return (
    <Btn sound="tap" onClick={onPress} className="flex-shrink-0 bg-bta-surface rounded-xl p-4 border border-bta-border text-left w-36 card-shadow">
      <p className="text-bta-muted text-xs font-medium mb-2">{name}</p>
      <p className="font-display font-bold text-bta-text text-base">
        R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        <span className="text-[10px] font-normal text-bta-muted ml-0.5">{unit}</span>
      </p>
      <div className={`flex items-center gap-0.5 mt-1 ${up ? 'text-bta-success' : 'text-bta-error'}`}>
        {up ? <Ic.ArrowUp /> : <Ic.ArrowDown />}
        <span className="text-xs font-semibold">{Math.abs(change)}%</span>
      </div>
    </Btn>
  )
}
