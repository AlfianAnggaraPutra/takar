import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import LogoTimbangan from './LogoTimbangan'
import './Header.css'

const MENU = [
  { ke: '/', label: 'Beranda', akhir: true },
  { ke: '/konsultasi', label: 'Konsultasi', sorot: true },
  { ke: '/edukasi', label: 'Edukasi' },
  { ke: '/pasar', label: 'Pasar' },
  { ke: '/berita', label: 'Berita' },
  { ke: '/tentang', label: 'Tentang' },
]

function IkonGembok() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export default function Header() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const [bergulir, setBergulir] = useState(false)
  const barProgres = useRef(null)
  const { pathname } = useLocation()

  // Header berubah tampilan saat halaman digulir, dan bar tipis di atas menunjukkan seberapa jauh Anda membaca.
  useEffect(() => {
    const saatGulir = () => {
      const y = window.scrollY
      setBergulir(y > 24)
      const tinggi = document.documentElement.scrollHeight - window.innerHeight
      const progres = tinggi > 0 ? Math.min(1, y / tinggi) : 0
      barProgres.current?.style.setProperty('--progres', String(progres))
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

  return (
    <header className={`hdr ${bergulir ? 'hdr--gulir' : ''} ${menuTerbuka ? 'hdr--buka' : ''}`}>
      <div className="hdr__progres" ref={barProgres} aria-hidden="true" />

      <div className="hdr__dalam">
        <Link to="/" className="hdr__merek" aria-label="TAKAR, kembali ke beranda">
          <LogoTimbangan className="hdr__logo" />
          <span className="hdr__teks">
            <span className="hdr__nama">TAKAR</span>
            <span className="hdr__tagline">Tentukan Aset Bersama Pakar</span>
          </span>
        </Link>

        <nav className="hdr__nav" aria-label="Menu utama">
          {MENU.map((m) => (
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.akhir}
              className={({ isActive }) => `hdr__tautan ${m.sorot ? 'hdr__tautan--sorot' : ''} ${isActive ? 'hdr__tautan--aktif' : ''}`}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/admin" className="hdr__admin">
          <IkonGembok />
          <span>Login Admin</span>
        </Link>

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
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.akhir}
              tabIndex={menuTerbuka ? 0 : -1}
              style={{ '--urut': i }}
              className={({ isActive }) => `hdr__laci-tautan ${isActive ? 'hdr__laci-tautan--aktif' : ''}`}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/admin" tabIndex={menuTerbuka ? 0 : -1} className="hdr__admin hdr__admin--laci">
          <IkonGembok />
          <span>Login Admin</span>
        </Link>
      </div>
    </header>
  )
}