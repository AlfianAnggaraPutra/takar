import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LogoTimbangan from './LogoTimbangan'
import { keluarAdmin, useSesiAdmin } from '../lib/autentikasi'
import './Header.css'

// Dua jenis menu: halaman sendiri (ke) dan bagian di dalam Beranda (bagian, memakai #hash).
// Berita dan FAQ tidak punya halaman terpisah. Keduanya menggulir ke bagiannya di Beranda.
// Konsultasi langsung membuka halaman Konsultasi (formulir data diri), tanpa singgah di Beranda.
const MENU = [
  { ke: '/', label: 'Beranda', akhir: true },
  { ke: '/konsultasi', label: 'Konsultasi', sorot: true },
  { ke: '/edukasi', label: 'Edukasi' },
  { ke: '/pasar', label: 'Pasar' },
  { bagian: 'berita', label: 'Berita' },
  { bagian: 'faq', label: 'FAQ' },
  { ke: '/tentang', label: 'Tentang' },
]
// Urutan bagian Beranda yang menjadi menu, sesuai urutan munculnya di halaman.
const BAGIAN_MENU = MENU.filter((m) => m.bagian).map((m) => m.bagian)

function IkonGembok() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

// Ikon yang sama dengan tombol keluar di panel admin sebelumnya.
function IkonKeluar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
    </svg>
  )
}

export default function Header() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const [bergulir, setBergulir] = useState(false)
  // Bagian Beranda yang sedang dibaca (berita atau faq), null bila di bagian atas Beranda atau di halaman lain.
  const [bagianAktif, setBagianAktif] = useState(null)
  const barProgres = useRef(null)
  const { pathname } = useLocation()
  const navigasi = useNavigate()
  const { sesi } = useSesiAdmin()
  const sudahMasuk = Boolean(sesi)

  // Saat admin sedang masuk, tombol di pojok kanan menjadi Logout. Pop up konfirmasinya milik halaman panel
  // (lewat peristiwa takar:minta-keluar-admin). Bila ternyata tidak ada panel yang menjawab, admin dikeluarkan
  // langsung dan dibawa ke halaman login supaya sesinya tidak tertinggal.
  const mintaKeluar = () => {
    setMenuTerbuka(false)
    const permintaan = new CustomEvent('takar:minta-keluar-admin', { detail: { ditangani: false } })
    window.dispatchEvent(permintaan)
    if (!permintaan.detail.ditangani) keluarAdmin().then(() => navigasi('/admin', { replace: true }))
  }

  // Header berubah tampilan saat halaman digulir, bar tipis di atas menunjukkan seberapa jauh Anda membaca,
  // dan di Beranda menu Berita atau FAQ menyala ketika bagiannya sedang dibaca.
  useEffect(() => {
    const saatGulir = () => {
      const y = window.scrollY
      setBergulir(y > 24)
      const tinggi = document.documentElement.scrollHeight - window.innerHeight
      const progres = tinggi > 0 ? Math.min(1, y / tinggi) : 0
      barProgres.current?.style.setProperty('--progres', String(progres))

      if (pathname !== '/') {
        setBagianAktif(null)
        return
      }
      // Bagian yang aktif adalah yang paling dekat di bawah garis baca (40 persen dari atas layar). Dipilih lewat
      // posisinya di halaman, bukan urutan menu, karena urutan menu tidak sama dengan urutan bagian di Beranda.
      let aktif = null
      let puncak = -Infinity
      for (const id of BAGIAN_MENU) {
        const el = document.getElementById(id)
        if (!el) continue
        const atas = el.getBoundingClientRect().top
        const garis = window.innerHeight * 0.4
        if (atas <= garis && atas > puncak) {
          aktif = id
          puncak = atas
        }
      }
      setBagianAktif(aktif)
    }
    saatGulir()
    window.addEventListener('scroll', saatGulir, { passive: true })
    window.addEventListener('resize', saatGulir)
    return () => {
      window.removeEventListener('scroll', saatGulir)
      window.removeEventListener('resize', saatGulir)
    }
  }, [pathname])

  // Menu laci menutup sendiri setiap pindah halaman.
  useEffect(() => {
    setMenuTerbuka(false)
  }, [pathname])

  // Halaman lain bisa meminta laci ditutup, misalnya setelah pengguna membatalkan kepergiannya lewat pop up konfirmasi.
  useEffect(() => {
    const tutup = () => setMenuTerbuka(false)
    window.addEventListener('takar:tutup-menu', tutup)
    return () => window.removeEventListener('takar:tutup-menu', tutup)
  }, [])

  // Saat menu laci terbuka, halaman di belakangnya tidak ikut tergulir.
  useEffect(() => {
    if (!menuTerbuka) return
    window.__lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      window.__lenis?.start()
      document.body.style.overflow = ''
    }
  }, [menuTerbuka])

  const tutupMenu = () => setMenuTerbuka(false)

  // Mengeklik Beranda (atau logo) saat sudah di Beranda membawa halaman kembali ke paling atas.
  const keAtas = () => {
    const jalankan = () => (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }))
    // Saat menu laci terbuka, scroll halus sedang dikunci. Beri waktu sampai kuncinya dilepas.
    if (menuTerbuka) setTimeout(jalankan, 80)
    else jalankan()
  }
  const saatKlikMenu = (m) => {
    tutupMenu()
    if (m.ke === '/' && pathname === '/') keAtas()
  }

  const aktif = (m) => {
    if (m.bagian) return pathname === '/' && bagianAktif === m.bagian
    if (m.ke === '/') return pathname === '/' && !bagianAktif
    return pathname === m.ke || pathname.startsWith(`${m.ke}/`)
  }
  const tujuan = (m) => (m.bagian ? { pathname: '/', hash: `#${m.bagian}` } : m.ke)
  const jenisAktif = (m) => (m.bagian ? 'location' : 'page')

  return (
    <header className={`hdr ${bergulir ? 'hdr--gulir' : ''} ${menuTerbuka ? 'hdr--buka' : ''}`}>
      <div className="hdr__progres" ref={barProgres} aria-hidden="true" />

      <div className="hdr__dalam">
        <Link to="/" className="hdr__merek" aria-label="TAKAR, kembali ke beranda" onClick={() => pathname === '/' && keAtas()}>
          <LogoTimbangan className="hdr__logo" />
          <span className="hdr__teks">
            <span className="hdr__nama">TAKAR</span>
            <span className="hdr__tagline">Tentukan Aset Bersama Pakar</span>
          </span>
        </Link>

        <nav className="hdr__nav" aria-label="Menu utama">
          {MENU.map((m) => (
            <Link
              key={m.label}
              to={tujuan(m)}
              onClick={() => saatKlikMenu(m)}
              aria-current={aktif(m) ? jenisAktif(m) : undefined}
              className={`hdr__tautan ${m.sorot ? 'hdr__tautan--sorot' : ''} ${aktif(m) ? 'hdr__tautan--aktif' : ''}`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        {sudahMasuk ? (
          <button type="button" className="hdr__admin hdr__admin--keluar" onClick={mintaKeluar}>
            <IkonKeluar />
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/admin" className="hdr__admin">
            <IkonGembok />
            <span>Login Admin</span>
          </Link>
        )}

        <button
          type="button"
          className="hdr__burger"
          aria-label={menuTerbuka ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuTerbuka}
          onClick={() => setMenuTerbuka((b) => !b)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className="hdr__laci" aria-hidden={!menuTerbuka}>
        <nav className="hdr__laci-nav" aria-label="Menu utama (ponsel)">
          {MENU.map((m, i) => (
            <Link
              key={m.label}
              to={tujuan(m)}
              onClick={() => saatKlikMenu(m)}
              tabIndex={menuTerbuka ? 0 : -1}
              style={{ '--urut': i }}
              aria-current={aktif(m) ? jenisAktif(m) : undefined}
              className={`hdr__laci-tautan ${aktif(m) ? 'hdr__laci-tautan--aktif' : ''}`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
        {sudahMasuk ? (
          <button type="button" onClick={mintaKeluar} tabIndex={menuTerbuka ? 0 : -1} className="hdr__admin hdr__admin--keluar hdr__admin--laci">
            <IkonKeluar />
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/admin" onClick={tutupMenu} tabIndex={menuTerbuka ? 0 : -1} className="hdr__admin hdr__admin--laci">
            <IkonGembok />
            <span>Login Admin</span>
          </Link>
        )}
      </div>
    </header>
  )
}