import { useCallback, useEffect, useRef, useState } from 'react'

// Layar penuh untuk satu elemen. Memakai Fullscreen API bila ada. Bila peramban menolaknya
// (misalnya Safari di iPhone yang hanya mengizinkan layar penuh untuk video), elemen dibentangkan
// menutupi seluruh layar lewat kelas CSS, lengkap dengan tombol keluar dan tombol Esc.
//
// Pemakaian:
//   const { ref, penuh, masuk, keluar, ganti } = useLayarPenuh()
//   <div ref={ref} className={penuh ? 'kotak kotak--penuh' : 'kotak'}>
export const KELAS_KUNCI_GULIR = 'layar-penuh-cadangan'

export default function useLayarPenuh() {
  const ref = useRef(null)
  const mode = useRef(null) // 'asli' | 'cadangan' | null
  const pemicu = useRef(null)
  const [penuh, setPenuh] = useState(false)

  const bersihkan = useCallback(() => {
    document.documentElement.classList.remove(KELAS_KUNCI_GULIR)
    window.__lenis?.start()
  }, [])

  const selesai = useCallback(() => {
    mode.current = null
    setPenuh(false)
    bersihkan()
    // Fokus dikembalikan ke tombol yang membuka layar penuh.
    const el = pemicu.current
    pemicu.current = null
    if (el && el.isConnected) requestAnimationFrame(() => el.focus?.({ preventScroll: true }))
  }, [bersihkan])

  const masuk = useCallback(async () => {
    const el = ref.current
    if (!el || mode.current) return
    pemicu.current = document.activeElement
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: 'hide' })
        mode.current = 'asli'
        setPenuh(true)
        return
      } catch {
        // Ditolak: pakai cara cadangan di bawah.
      }
    }
    mode.current = 'cadangan'
    document.documentElement.classList.add(KELAS_KUNCI_GULIR)
    window.__lenis?.stop()
    setPenuh(true)
  }, [])

  const keluar = useCallback(() => {
    if (mode.current === 'asli' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => selesai())
      return
    }
    if (mode.current) selesai()
  }, [selesai])

  const ganti = useCallback(() => (mode.current ? keluar() : masuk()), [keluar, masuk])

  useEffect(() => {
    // Layar penuh asli bisa diakhiri peramban sendiri (tombol Esc), jadi keadaannya disinkronkan di sini.
    const sinkron = () => {
      if (mode.current === 'asli' && document.fullscreenElement !== ref.current) selesai()
    }
    const tombol = (e) => {
      if (e.key === 'Escape' && mode.current === 'cadangan') {
        e.preventDefault()
        selesai()
      }
    }
    document.addEventListener('fullscreenchange', sinkron)
    document.addEventListener('keydown', tombol)
    return () => {
      document.removeEventListener('fullscreenchange', sinkron)
      document.removeEventListener('keydown', tombol)
      if (mode.current === 'asli' && document.fullscreenElement === ref.current) document.exitFullscreen?.().catch(() => {})
      if (mode.current === 'cadangan') bersihkan()
      mode.current = null
    }
  }, [selesai, bersihkan])

  return { ref, penuh, masuk, keluar, ganti }
}