import { Link } from 'react-router'
import './PageHeader.css'

type Props = {
  title: string
  description?: string
  /** Label remah roti terakhir bila berbeda dari judul; null = tanpa remah roti */
  crumb?: string | null
}

/**
 * Pita judul halaman dalam (padanan "page title area" Jagonet). Latar gelap
 * agar header transparan berlogo putih terbaca; teks masuk berurutan seperti
 * teks hero CMS-portfolio (animasi CSS, tidak menunggu JavaScript).
 */
export function PageHeader({ title, description, crumb = title }: Props) {
  return (
    <section className="page-header">
      <div className="container page-header__inner">
        {crumb !== null && (
          <nav aria-label="Remah roti" className="page-header__crumbs">
            <ol>
              <li>
                <Link to="/">Beranda</Link>
              </li>
              <li aria-current="page">{crumb}</li>
            </ol>
          </nav>
        )}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
    </section>
  )
}
