import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import LayarPembuka from './components/LayarPembuka'
import Header from './components/Header'
import Footer from './components/Footer'
import Beranda from './pages/Beranda'
import Konsultasi from './pages/Konsultasi'
import MasukAdmin from './pages/MasukAdmin'
import RiwayatAdmin from './pages/RiwayatAdmin'
import HalamanSegera from './pages/HalamanSegera'
import useScrollHalus from './hooks/useScrollHalus'

const KUNCI_SPLASH = 'takar_sudah_lihat_splash'

// Setiap pindah halaman, mulai dari paling atas.
function KeAtasSaatPindah() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Kerangka yang dipakai semua halaman: header di atas, footer di bawah.
function Rangka() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/konsultasi" element={<Konsultasi />} />
          <Route
            path="/edukasi"
            element={
              <HalamanSegera
                judul="Edukasi Investasi"
                uraian="Penjelasan lengkap tentang profil risiko dan instrumen investasi akan hadir di halaman ini."
              />
            }
          />
          <Route
            path="/pasar"
            element={
              <HalamanSegera
                judul="Pasar"
                uraian="Grafik harga emas, IHSG, dan saham pilihan sedang dalam penyusunan."
              />
            }
          />
          <Route
            path="/berita"
            element={
              <HalamanSegera
                judul="Berita Pasar Modal"
                uraian="Kumpulan berita lengkap tentang pasar modal, emas, saham, dan reksa dana akan tampil di sini."
              />
            }
          />
          <Route
            path="/tentang"
            element={
              <HalamanSegera
                judul="Tentang TAKAR"
                uraian="Latar belakang penelitian, metode, dan pakar rujukan akan dijelaskan di halaman ini."
              />
            }
          />
          <Route path="/admin" element={<MasukAdmin />} />
          <Route path="/admin/riwayat" element={<RiwayatAdmin />} />
          <Route
            path="*"
            element={<HalamanSegera judul="Halaman tidak ditemukan" uraian="Alamat yang Anda buka tidak tersedia. Silakan kembali ke beranda." />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  // tahap: 'splash' (hanya splash), 'beralih' (beranda sudah tampil di bawah, tirai splash memudar), 'beranda'
  const [tahap, setTahap] = useState(() => (sessionStorage.getItem(KUNCI_SPLASH) === '1' ? 'beranda' : 'splash'))
  const tirai = useRef(null)
  const sudahSelesai = useRef(false)

  useScrollHalus()

  const selesaiSplash = useCallback(() => {
    if (sudahSelesai.current) return
    sudahSelesai.current = true
    sessionStorage.setItem(KUNCI_SPLASH, '1')
    setTahap('beralih')
  }, [])

  // Selama splash dan peralihan, halaman tidak boleh bisa digulir.
  useEffect(() => {
    const kunci = tahap !== 'beranda'
    document.documentElement.style.overflow = kunci ? 'hidden' : ''
    if (kunci) window.__lenis?.stop()
    else window.__lenis?.start()
  }, [tahap])

  // Tirai splash memudar perlahan, sementara animasi pembuka beranda sudah berjalan di bawahnya.
  useEffect(() => {
    if (tahap !== 'beralih') return
    const tween = gsap.to(tirai.current, {
      autoAlpha: 0,
      duration: 1,
      delay: 0.15,
      ease: 'power2.inOut',
      onComplete: () => setTahap('beranda'),
    })
    return () => tween.kill()
  }, [tahap])

  return (
    <BrowserRouter>
      <KeAtasSaatPindah />
      {tahap !== 'splash' && <Rangka />}
      {tahap !== 'beranda' && (
        <div ref={tirai} style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
          <LayarPembuka onSelesai={selesaiSplash} />
        </div>
      )}
    </BrowserRouter>
  )
}