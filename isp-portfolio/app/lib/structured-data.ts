import { coverage } from '../content/coverage'
import { faq } from '../content/faq'
import { packages } from '../content/packages'
import { site } from '../content/site'
import { SITE_URL } from './seo'

// JSON-LD schema.org (PRD §10 SEO): LocalBusiness, Service + Offer, FAQPage.
// Semua dibangun dari file konten agar selalu sama dengan isi halaman.

const BUSINESS_ID = `${SITE_URL}/#bisnis`

/** Desa/kelurahan berstatus "Tersedia" sebagai wilayah layanan. */
const areaServed = coverage
  .filter((a) => a.status === 'tersedia')
  .map((a) => ({ '@type': 'Place', name: `${a.village}, ${a.district}, ${a.city}` }))

export function localBusinessLd() {
  const { brand, contact, address } = site
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': BUSINESS_ID,
    name: `${brand.name} — Jagonya Internet Ubud`,
    legalName: brand.legalName,
    description: brand.description,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}${brand.logo.dark}`,
    image: `${SITE_URL}/og-image.jpg`,
    telephone: `+${contact.phone}`,
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.office,
      addressLocality: 'Ubud',
      addressRegion: 'Bali',
      addressCountry: 'ID',
    },
    geo: { '@type': 'GeoCoordinates', latitude: address.geo.lat, longitude: address.geo.lng },
    hasMap: address.mapsUrl,
    openingHours: site.openingHours,
    areaServed,
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
  }
}

export function serviceLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Internet fiber optic',
    name: `Internet Fiber ${site.brand.name}`,
    description: site.seo.description,
    provider: { '@type': 'LocalBusiness', '@id': BUSINESS_ID, name: site.brand.name },
    areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Paket Internet',
      itemListElement: packages.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        url: `${SITE_URL}/daftar?paket=${p.slug}`,
        description: p.features.join(', '),
        ...(p.isCustomPrice
          ? {}
          : {
              price: p.price,
              priceCurrency: 'IDR',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: p.price,
                priceCurrency: 'IDR',
                valueAddedTaxIncluded: true,
                referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
              },
            }),
      })),
    },
  }
}

export function faqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}
