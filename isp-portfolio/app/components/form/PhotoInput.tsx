import { useEffect, useId, useRef, useState } from 'react'
import { PHOTO_TYPES } from '../../lib/validation'
import { Icon } from '../Icon'
import './PhotoInput.css'

type Props = {
  label: string
  required?: boolean
  hint?: string
  error?: string | null
  onChange: (file: File | null) => void
  /** Penanda untuk fokus ke field pertama yang galat */
  dataField: string
}

/**
 * Unggah foto dengan pratinjau LOKAL (PRD US-07 AC 6): gambar hanya dibaca
 * peramban lewat URL.createObjectURL dan dilepas saat diganti/dihapus — tidak
 * pernah diunggah ke mana pun.
 */
export function PhotoInput({ label, required, hint, error, onChange, dataField }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  function handle(file: File | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = file && PHOTO_TYPES.includes(file.type) ? URL.createObjectURL(file) : null
    setPreview(urlRef.current)
    setFileName(file?.name ?? null)
    onChange(file)
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = ''
    handle(null)
  }

  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field photo-input${error ? ' field--error' : ''}`}>
      <span className="field__label" id={`${id}-label`}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {required && <span className="sr-only"> (wajib)</span>}
      </span>

      <div className="photo-input__box">
        {preview ? (
          <img src={preview} alt={`Pratinjau ${label}`} className="photo-input__preview" />
        ) : (
          <span className="photo-input__placeholder" aria-hidden="true">
            <Icon name="copy" size={26} />
          </span>
        )}
        <div className="photo-input__actions">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            data-field={dataField}
            aria-labelledby={`${id}-label`}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(e) => handle(e.target.files?.[0] ?? null)}
          />
          <label htmlFor={id} className="btn btn--secondary btn--sm photo-input__pick">
            {fileName ? 'Ganti foto' : 'Pilih foto'}
          </label>
          {fileName && (
            <button type="button" className="photo-input__clear" onClick={clear}>
              Hapus
            </button>
          )}
          {fileName && <span className="photo-input__name">{fileName}</span>}
        </div>
      </div>

      {hint && !error && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
