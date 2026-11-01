import type { LegalDoc } from '../content/types'
import './LegalDocument.css'

// timeZone UTC: tanggal sama persis saat prerender dan di peramban (hidrasi cocok).
const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Isi halaman legal (S&K, Kebijakan Privasi) dari content/legal.ts. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <section className="section">
      <div className="container legal">
        <p className="legal__updated">
          Terakhir diperbarui: <time dateTime={doc.updatedAt}>{dateFmt.format(new Date(doc.updatedAt))}</time>
        </p>
        {doc.sections.map((s, i) => (
          <section key={s.heading} className="legal__section">
            <h2>
              {i + 1}. {s.heading}
            </h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}
