import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return <div className="text-slate-500 py-10 text-center">{label}</div>
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
      {children}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

const buttonStyles: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-700 hover:bg-slate-100',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  )
}

const inputCls =
  'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900'

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputCls} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputCls} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputCls} ${className}`} {...props} />
}

type Color = 'slate' | 'green' | 'red' | 'amber' | 'blue'
const badgeColors: Record<Color, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
}

export function Badge({ color = 'slate', children }: { color?: Color; children: ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[color]}`}>
      {children}
    </span>
  )
}
