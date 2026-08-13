import { memo, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface BigNumberCardProps {
  etiqueta: string
  valor: ReactNode
  detalle?: string
  icono: LucideIcon
  destacado?: boolean
}

export const BigNumberCard = memo(function BigNumberCard({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  destacado = false,
}: BigNumberCardProps) {
  return (
    <div className="rounded-2xl border border-mm-yellow/60 bg-black p-6 shadow-[0_0_28px_rgba(255,204,0,0.14)] transition-shadow hover:shadow-[0_0_36px_rgba(255,204,0,0.28)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-mm-gray-400">{etiqueta}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mm-yellow text-mm-black">
          <Icono className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 text-5xl font-bold leading-none ${destacado ? 'text-mm-yellow' : 'text-white'}`}>{valor}</p>
      {detalle && <p className="mt-2 text-xs text-mm-gray-400">{detalle}</p>}
    </div>
  )
})
