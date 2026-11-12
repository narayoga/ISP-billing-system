import { Accordion } from '../components/Accordion'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { faq } from '../content/faq'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { faqLd } from '../lib/structured-data'
import { waLink } from '../lib/whatsapp'
import './faq.css'

export function meta() {
  return pageMeta({
    title: 'FAQ',
    description: 'Pertanyaan yang sering diajukan seputar layanan internet Balisolusindo: paket, pemasangan, dan tagihan.',
    path: '/faq',
    jsonLd: [faqLd()],
  })
}

// Urutan topik mengikuti kemunculan pertamanya di content/faq.ts.
const topics = [...new Set(faq.map((q) => q.topic))]

// PRD US-04 AC 1: seluruh tanya-jawab, dikelompokkan per topik, akordeon keyboard.
export default function Faq() {
  return (
    <>
      <PageHeader title="FAQ" description="Jawaban atas pertanyaan yang sering diajukan." />
      <section className="section">
        <div className="container faq-page">
          <nav aria-label="Topik FAQ" className="faq-page__topics">
            {topics.map((t) => (
              <a key={t} href={`#topik-${t.toLowerCase()}`}>
                {t}
              </a>
            ))}
          </nav>
          {topics.map((topic) => (
            <Reveal key={topic} as="section" id={`topik-${topic.toLowerCase()}`} className="faq-page__group">
              <h2 {...reveal('fade-up', 0, 'faq-page__topic')}>{topic}</h2>
              <div {...reveal('fade-up', 100)}>
                <Accordion
                  items={faq
                    .filter((q) => q.topic === topic)
                    .map((q, i) => ({ id: `${topic}-${i}`, title: q.question, content: <p>{q.answer}</p> }))}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <Section surface eyebrow="Masih ada pertanyaan?" title="Tanyakan Langsung ke Tim Kami">
        <div className="faq-page__cta">
          <Button variant="whatsapp" icon="whatsapp" href={waLink('WEB-KONTAK')}>
            Chat WhatsApp
          </Button>
          <Button variant="secondary" href="/kontak">
            Halaman Kontak
          </Button>
        </div>
      </Section>
    </>
  )
}
