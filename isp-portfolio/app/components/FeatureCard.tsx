import type { Feature } from '../content/types'
import { Card } from './Card'
import { IconBox } from './IconBox'
import './FeatureCard.css'

/** Kartu keunggulan: kotak ikon bergradien Jagonet + judul + deskripsi. */
export function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Card hover className="feature-card">
      <IconBox icon={feature.icon} tone={feature.tone} />
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </Card>
  )
}
