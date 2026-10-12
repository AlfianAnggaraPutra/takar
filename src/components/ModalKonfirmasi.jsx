import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ModalKonfirmasi.css'

// Pop up konfirmasi yang dipakai di beberapa halaman.
// - Tombol Esc dan klik di area gelap sama dengan membatalkan (aman, tidak ada yang hilang).
// - Fokus keyboard dikunci di dalam pop up dan dikembalikan ke tombol asal saat pop up tertutup.
// - Halaman di belakang tidak bisa digulir selama pop up terbuka.
//
// tombol: [{ label, aksi, gaya: 'emas' | 'garis' | 'bahaya', autoFokus, nonaktif }]
export default function ModalKonfirmasi({ judul, ikon, nada = 'emas', tombol, saatBatal, children }) {
  const kartu = useRef(null)
  const idJudul = useId()
  const batalRef = useRef(saatBatal)
  batalRef.current = saatBatal

  useEffect(() => {
    const sebelumnya = document.activeElement
    window.__lenis?.stop()
    const overflowAwal = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const sasaran = kartu.current?.querySelector('[data-fokus-awal]') ?? kartu.current?.querySelector('button:not([disabled])')
    sasaran?.focus({ preventScroll: true })

    const saatTombol = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        batalRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !kartu.current) return
      const bisaFokus = [...kartu.current.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      if (bisaFokus.length === 0) return
      const pertama = bisaFokus[0]
      const terakhir = bisaFokus[bisaFokus.length - 1]
      if (e.shiftKey && (document.activeElement === pertama || !kartu.current.contains(document.activeElement))) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && (document.activeElement === terakhir || !kartu.current.contains(document.activeElement))) {
        e.preventDefault()
        pertama.focus()
      }
    }
    document.addEventListener('keydown', saatTombol)

    return () => {
      document.removeEventListener('keydown', saatTombol)
      document.body.style.overflow = overflowAwal
      window.__lenis?.start()
      if (sebelumnya && typeof sebelumnya.focus === 'function' && document.contains(sebelumnya)) sebelumnya.focus({ preventScroll: true })
    }
  }, [])

  // Klik hanya dianggap "di luar" bila tekan dan lepasnya sama-sama di area gelap,
  // supaya menyeret teks di dalam kartu lalu melepas di luar tidak menutup pop up.
  const awalTekan = useRef(false)

  return createPortal(
    <div
      className="modal"
      onMouseDown={(e) => {
        awalTekan.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && awalTekan.current) saatBatal?.()
      }}
    >
      <div className={`modal__kartu modal__kartu--${nada}`} role="dialog" aria-modal="true" aria-labelledby={idJudul} ref={kartu}>
        <span className="modal__ikon" aria-hidden="true">
          {ikon}
        </span>
        <h2 className="modal__judul" id={idJudul}>
          {judul}
        </h2>
        <div className="modal__isi">{children}</div>
        <div className="modal__tombol">
          {tombol.map((t) => (
            <button
              key={t.label}
              type="button"
              className={`tombol modal__aksi ${t.gaya === 'emas' ? 'tombol--emas' : t.gaya === 'bahaya' ? 'modal__aksi--bahaya' : 'tombol--garis'}`}
              onClick={t.aksi}
              disabled={t.nonaktif}
              data-fokus-awal={t.autoFokus ? '' : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}