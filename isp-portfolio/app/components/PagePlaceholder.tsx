import { Section } from './Section'

/** Isi sementara halaman kerangka sampai fasenya dikerjakan (RENCANA.md). */
export function PagePlaceholder({ phase, items }: { phase: string; items: string[] }) {
  return (
    <Section eyebrow={`Dibangun di ${phase}`} title="Halaman sedang disiapkan" align="center">
      <ul className="page-placeholder">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </Section>
  )
}
