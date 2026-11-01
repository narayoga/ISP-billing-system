import type { ElementType, ReactNode } from 'react'
import { useReveal } from '../lib/useReveal'

type Props = {
  as?: ElementType
  className?: string
  id?: string
  children: ReactNode
}

/**
 * Pembungkus yang memberi kelas `is-visible` saat masuk layar, sehingga anak
 * berkelas `.reveal` (helper `reveal()` di lib/reveal.ts) memainkan animasinya
 * — pola section di CMS-portfolio.
 */
export function Reveal({ as: Tag = 'div', className, id, children }: Props) {
  const [ref, visible] = useReveal()
  return (
    <Tag ref={ref} id={id} className={[className, visible && 'is-visible'].filter(Boolean).join(' ') || undefined}>
      {children}
    </Tag>
  )
}
