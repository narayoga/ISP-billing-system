import { useEffect, useRef, useState, type ReactNode } from 'react'
import { registerPinGate } from './api'

type Resolver = { resolve: (pin: string) => void; reject: (err: unknown) => void }

export function PinGateProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState('')
    const [errored, setErrored] = useState(false)
    const [shake, setShake] = useState(false)
    const resolverRef = useRef<Resolver | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Daftarkan diri ke api.ts sekali saat mount.
        registerPinGate({
            requestPin({ invalid }) {
                return new Promise<string>((resolve, reject) => {
                    resolverRef.current = { resolve, reject }
                    setOpen(true)
                    setValue('')
                    setErrored(invalid)
                    if (invalid) {
                        setShake(true)
                        window.setTimeout(() => setShake(false), 400)
                    }
                    window.setTimeout(() => inputRef.current?.focus(), 0)
                })
            },
            done() {
                resolverRef.current = null
                setOpen(false)
                setValue('')
                setErrored(false)
            },
        })
        return () => registerPinGate(null)
    }, [])

    function onChange(raw: string) {
        const digits = raw.replace(/\D/g, '').slice(0, 4)
        setValue(digits)
        if (errored) setErrored(false)
        // Auto-submit begitu 4 digit terisi.
        if (digits.length === 4) resolverRef.current?.resolve(digits)
    }

    function cancel() {
        resolverRef.current?.reject(new Error('pin_cancelled'))
        resolverRef.current = null
        setOpen(false)
        setValue('')
        setErrored(false)
    }

    return (
        <>
            {children}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
                    onClick={cancel}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-semibold text-slate-800">Masukkan PIN</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">4 digit untuk menyimpan perubahan.</p>
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') cancel()
                            }}
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={4}
                            className={`w-full text-center text-2xl tracking-[0.6em] px-3 py-2 border rounded-lg outline-none ${errored
                                    ? `border-red-500 ${shake ? 'animate-shake' : ''}`
                                    : 'border-slate-300 focus:ring-2 focus:ring-slate-900'
                                }`}
                        />
                        {errored && <p className="text-sm text-red-600 mt-2">PIN salah, coba lagi.</p>}
                    </div>
                </div>
            )}
        </>
    )
}