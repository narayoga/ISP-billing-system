import type { Feature, IconName } from '../content/types'
import { Icon } from './Icon'
import './IconBox.css'

/** Kotak ikon bergradien seperti kartu keunggulan Jagonet (radius 30px). */
export function IconBox({ icon, tone = 'primary' }: { icon: IconName; tone?: Feature['tone'] }) {
  return (
    <span className={`icon-box icon-box--${tone}`}>
      <Icon name={icon} size={30} />
    </span>
  )
}
