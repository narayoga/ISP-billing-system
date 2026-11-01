import { useEffect, useState } from 'react'
import './AnimatedWord.css'

/**
 * Kata yang berganti tiap 3 detik, dari CMS-portfolio (Home.jsx AnimatedWord).
 * Pembaca layar mendapat daftar lengkap sekali; versi berganti disembunyikan
 * agar tidak dibacakan berulang.
 */
export function AnimatedWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (words.length < 2) return
    let swap: number | undefined
    const id = window.setInterval(() => {
      setLeaving(true)
      swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setLeaving(false)
      }, 400)
    }, 3000)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(swap)
    }
  }, [words.length])

  return (
    <>
      <span className="sr-only">{words.join(', ')}</span>
      <span className={`animated-word ${leaving ? 'is-leaving' : 'is-entering'}`} aria-hidden="true">
        {words[index]}
      </span>
    </>
  )
}
