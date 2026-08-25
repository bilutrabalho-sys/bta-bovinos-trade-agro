import { useState, useEffect } from 'react'
import { Ic } from '@/components/foundation/icons'

// Foto de um lote com placeholder limpo. Quando `src` está vazio/nulo OU a
// imagem falha ao carregar (onError), renderiza um bloco bg-bta-bg com um ícone
// discreto (e "Sem foto"), mantendo EXATAMENTE as mesmas dimensões da imagem —
// o pai controla altura/aspect-ratio. Nunca deixa um <img> quebrado aparecer.
//
// Com uma imagem válida (modo demo), o comportamento é idêntico ao <img> de
// antes, apenas com um onError de segurança adicionado.
export function LotImage({ src, alt = '', size = 'md', showLabel, className }: {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  // Reseta o estado de erro quando a foto muda (ex.: galeria trocando de slide).
  useEffect(() => { setFailed(false) }, [src])

  const missing = !src || failed
  if (!missing) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className={className ?? 'w-full h-full object-cover'}
      />
    )
  }

  const iconScale = size === 'lg' ? 'scale-[1.7]' : size === 'sm' ? 'scale-90' : ''
  const withLabel = showLabel ?? size !== 'sm'
  return (
    <div className="w-full h-full bg-bta-bg flex flex-col items-center justify-center gap-1.5 text-bta-muted select-none">
      <span className={iconScale}><Ic.Image /></span>
      {withLabel && (
        <span className={`font-display font-medium text-bta-muted ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>Sem foto</span>
      )}
    </div>
  )
}
