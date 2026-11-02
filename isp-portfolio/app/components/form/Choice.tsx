import { useId, type ReactNode } from 'react'
import './Choice.css'

type GroupProps = {
  legend: string
  name: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string | null
  dataField: string
}

/** Grup radio berbentuk kapsul dalam <fieldset> — panah kiri/kanan berpindah pilihan. */
export function ChoiceGroup({ legend, name, options, value, onChange, required, error, dataField }: GroupProps) {
  const id = useId()
  return (
    <fieldset className={`field choice-group${error ? ' field--error' : ''}`} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="field__label">
        {legend}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {required && <span className="sr-only"> (wajib)</span>}
      </legend>
      <div className="choice-group__options">
        {options.map((opt, i) => (
          <label key={opt} className="choice-pill">
            <input
              type="radio"
              name={`${id}-${name}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              data-field={i === 0 ? dataField : undefined}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string | null
  dataField: string
  children: ReactNode
}

/** Kotak centang dengan label kaya (mis. berisi tautan S&K). */
export function Checkbox({ checked, onChange, error, dataField, children }: CheckboxProps) {
  const id = useId()
  return (
    <div className={`field checkbox${error ? ' field--error' : ''}`}>
      <label className="checkbox__label" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          data-field={dataField}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
