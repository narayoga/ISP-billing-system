import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import './Form.css'

type FieldProps = {
  label: string
  required?: boolean
  hint?: string
  error?: string | null
  /** Render prop: menerima id + atribut aria agar label/galat terhubung ke input */
  children: (a11y: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
}

/**
 * Pembungkus label + input + petunjuk + pesan galat (tampil di dekat field,
 * PRD US-07 AC 3). Penanda wajib (*) disertai teks untuk pembaca layar.
 */
export function Field({ label, required, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {required && <span className="sr-only"> (wajib)</span>}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['input', props.className].filter(Boolean).join(' ')} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={['input', 'input--select', props.className].filter(Boolean).join(' ')} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={['input', 'input--textarea', props.className].filter(Boolean).join(' ')} />
}
