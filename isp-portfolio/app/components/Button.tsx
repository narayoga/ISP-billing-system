import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import type { IconName } from '../content/types'
import { Icon } from './Icon'
import './Button.css'

type Variant = 'primary' | 'secondary' | 'whatsapp' | 'light'
type Size = 'md' | 'sm'

type Common = {
  variant?: Variant
  size?: Size
  icon?: IconName
  /** Ikon di kanan teks (mis. panah) */
  iconRight?: IconName
  /** Spinner menggantikan ikon kanan; tombol nonaktif & aria-busy */
  loading?: boolean
  className?: string
  children: ReactNode
}

type LinkProps = { href: string; external?: boolean }
type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined }

/**
 * Tombol bergaya .default-btn Jagonet. Dengan `href` dirender sebagai tautan:
 * path internal ("/…") memakai <Link> React Router, selain itu <a> tab baru.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className,
  children,
  ...rest
}: Common & (LinkProps | NativeButtonProps)) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className].filter(Boolean).join(' ')
  const iconSize = size === 'sm' ? 16 : 18
  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      <span>{children}</span>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  )

  if (rest.href !== undefined) {
    const { href, external } = rest as LinkProps
    if (href.startsWith('/') && !external) {
      return (
        <Link to={href} className={cls}>
          {content}
        </Link>
      )
    }
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  const { type = 'button', disabled, ...buttonProps } = rest as NativeButtonProps
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonProps}>
      {content}
    </button>
  )
}
