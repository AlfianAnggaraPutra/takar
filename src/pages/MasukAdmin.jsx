import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import LatarKonsultasi from '../components/LatarKonsultasi'
import LogoTimbangan from '../components/LogoTimbangan'
import { bacaPesanSesi, hapusPesanSesi } from '../lib/batasSesi'
import { masukAdmin, periksaEmail, periksaSandi, useSesiAdmin } from '../lib/autentikasi'
import './MasukAdmin.css'

const TUJUAN = '/admin/riwayat'
const KUNCI_PERCOBAAN = 'takar_admin_percobaan'
const BATAS_GAGAL = 5
const JEDA_GAGAL_MS = 30_000
const JEDA_TERLALU_SERING_MS = 60_000

/* ---------- Penyimpanan percobaan gagal (hanya sesi tab ini) ---------- */

function bacaPercobaan() {
  try {
    const mentah = JSON.parse(sessionStorage.getItem(KUNCI_PERCOBAAN) ?? 'null')
    if (mentah && Number.isFinite(mentah.gagal) && Number.isFinite(mentah.sampai)) return mentah
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return { gagal: 0, sampai: 0 }
}
function simpanPercobaan(nilai) {
  try {
    sessionStorage.setItem(KUNCI_PERCOBAAN, JSON.stringify(nilai))
  } catch {
    /* diabaikan */
  }
}

/* ---------- Ikon ---------- */

const ikonDasar = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const IkonSurat = () => (
  <svg {...ikonDasar}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
)
const IkonGembok = () => (
  <svg {...ikonDasar}>
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
const IkonJam = () => (
  <svg {...ikonDasar}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)
const IkonTutup = () => (
  <svg {...ikonDasar} width={14} height={14}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
const IkonMata = () => (
  <svg {...ikonDasar}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IkonMataCoret = () => (
  <svg {...ikonDasar}>
    <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
)
const IkonPanah = () => (
  <svg {...ikonDasar} width="17" height="17" strokeWidth={2.2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
const IkonCentang = () => (
  <svg {...ikonDasar} width="18" height="18" strokeWidth={2.6}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)
const IkonPeringatan = () => (
  <svg {...ikonDasar} width="17" height="17">
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 10v4.2M12 17.4v.1" />
  </svg>
)
const IkonKembali = () => (
  <svg {...ikonDasar} width="15" height="15" strokeWidth={2.2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export default function MasukAdmin() {
  const { memuat, sesi } = useSesiAdmin()
  const navigasi = useNavigate()
  const idEmail = useId()
  const idSandi = useId()

  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [disentuh, setDisentuh] = useState({ email: false, sandi: false })
  const [lihatSandi, setLihatSandi] = useState(false)
  const [capsAktif, setCapsAktif] = useState(false)
  const [tahap, setTahap] = useState('diam') // diam | proses | berhasil
  const [galat, setGalat] = useState(null) // { jenis, pesan }
  const [goyang, setGoyang] = useState(false)
  const [sisaDetik, setSisaDetik] = useState(() => Math.max(0, Math.ceil((bacaPercobaan().sampai - Date.now()) / 1000)))

  const akar = useRef(null)
  const kartu = useRef(null)
  const kolomEmail = useRef(null)
  const kolomSandi = useRef(null)
  const dariLogin = useRef(false)
  // Pemberitahuan bila sesi sebelumnya berakhir sendiri (diam terlalu lama, koneksi terputus, atau sesi tidak berlaku).
  // Dibaca sekali lalu dihapus dari penyimpanan, jadi tidak muncul lagi saat halaman dimuat ulang.
  const [pesanSesi, setPesanSesi] = useState(() => bacaPesanSesi())
  useEffect(() => {
    hapusPesanSesi()
  }, [])

  const galatEmail = periksaEmail(email)
  const galatSandi = periksaSandi(sandi)
  const valid = !galatEmail && !galatSandi
  const terkunci = sisaDetik > 0
  const sibuk = tahap !== 'diam'
  const tombolAktif = valid && !terkunci && !sibuk

  // Hitung mundur jeda setelah terlalu banyak percobaan gagal.
  useEffect(() => {
    if (!terkunci) return
    const id = setInterval(() => {
      const sisa = Math.max(0, Math.ceil((bacaPercobaan().sampai - Date.now()) / 1000))
      setSisaDetik(sisa)
      if (sisa === 0) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  }, [terkunci])

  // Kartu naik perlahan saat halaman dibuka. Isi di dalamnya muncul bergantian lewat CSS.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const konteks = gsap.context(() => {
      gsap.from('.masuk__kartu', { y: 40, opacity: 0, scale: 0.97, duration: 0.95, ease: 'power3.out', delay: 0.2, clearProps: 'transform,opacity' })
    }, akar)
    return () => konteks.revert()
  }, [])

  // Setelah berhasil masuk, beri jeda singkat agar tanda berhasil sempat terlihat, lalu buka halaman riwayat.
  useEffect(() => {
    if (tahap !== 'berhasil') return
    const id = setTimeout(() => navigasi(TUJUAN, { replace: true }), 800)
    return () => clearTimeout(id)
  }, [tahap, navigasi])

  const kosongkanGalat = () => {
    if (galat) setGalat(null)
  }

  const kirim = async (e) => {
    e.preventDefault()
    if (!tombolAktif) {
      setDisentuh({ email: true, sandi: true })
      return
    }
    setGalat(null)
    setTahap('proses')
    dariLogin.current = true
    const hasil = await masukAdmin(email, sandi)
    if (hasil.berhasil) {
      simpanPercobaan({ gagal: 0, sampai: 0 })
      setTahap('berhasil')
      return
    }
    dariLogin.current = false
    setTahap('diam')
    setGalat({ jenis: hasil.jenis, pesan: hasil.pesan })
    setGoyang(true)
    if (hasil.jenis === 'salah') {
      const lama = bacaPercobaan()
      const gagal = lama.gagal + 1
      if (gagal >= BATAS_GAGAL) {
        simpanPercobaan({ gagal: 0, sampai: Date.now() + JEDA_GAGAL_MS })
        setSisaDetik(Math.ceil(JEDA_GAGAL_MS / 1000))
      } else {
        simpanPercobaan({ gagal, sampai: 0 })
      }
      setSandi('')
      // Kolom sandi kosong lagi: jangan langsung ditandai salah, cukup arahkan kursor ke sana.
      setDisentuh((d) => ({ ...d, sandi: false }))
      requestAnimationFrame(() => kolomSandi.current?.focus())
    } else if (hasil.jenis === 'terlalu-sering') {
      simpanPercobaan({ gagal: 0, sampai: Date.now() + JEDA_TERLALU_SERING_MS })
      setSisaDetik(Math.ceil(JEDA_TERLALU_SERING_MS / 1000))
    }
  }

  // Cahaya lembut mengikuti kursor di atas kartu.
  const saatGeser = (e) => {
    const k = kartu.current
    if (!k) return
    const kotak = k.getBoundingClientRect()
    k.style.setProperty('--x', `${e.clientX - kotak.left}px`)
    k.style.setProperty('--y', `${e.clientY - kotak.top}px`)
  }

  const saatTombolSandi = (e) => setCapsAktif(Boolean(e.getModifierState?.('CapsLock')))

  // Keterangan di bawah tombol hanya muncul saat masuk dikunci sementara. Kekurangan isian cukup ditunjukkan
  // oleh pesan di bawah kotak email dan kata sandi masing-masing.
  const petunjuk = terkunci ? `Terlalu banyak percobaan. Coba lagi dalam ${sisaDetik} detik.` : ''

  // Sudah masuk sebelum halaman dibuka: tidak perlu menampilkan formulir.
  if (sesi && !dariLogin.current) return <Navigate to={TUJUAN} replace />

  const tampilGalatEmail = disentuh.email && galatEmail
  const tampilGalatSandi = disentuh.sandi && galatSandi

  return (
    <section className="masuk" ref={akar}>
      <LatarKonsultasi />

      <div className="masuk__isi">
        <div
          className={`masuk__kartu ${goyang ? 'masuk__kartu--goyang' : ''}`}
          ref={kartu}
          onPointerMove={saatGeser}
          onAnimationEnd={(e) => {
            if (e.animationName === 'masuk-goyang') setGoyang(false)
          }}
        >
          <span className="masuk__kilau" aria-hidden="true" />

          <div className="masuk__kepala masuk__muncul" style={{ '--urut': 0 }}>
            <span className="masuk__logo-bungkus">
              <LogoTimbangan className="masuk__logo" />
            </span>
            <p className="masuk__label">Area pengelola</p>
            <h1 className="masuk__judul">Masuk Admin</h1>
            <p className="masuk__uraian">Khusus pengelola TAKAR untuk melihat riwayat konsultasi pengguna.</p>
          </div>

          {pesanSesi && (
            <div className="masuk__sesi" role="status">
              <span className="masuk__sesi-ikon">
                <IkonJam />
              </span>
              <div className="masuk__sesi-teks">
                <strong>{pesanSesi.judul}</strong>
                <span>{pesanSesi.isi}</span>
              </div>
              <button type="button" className="masuk__sesi-tutup" onClick={() => setPesanSesi(null)} aria-label="Tutup pemberitahuan">
                <IkonTutup />
              </button>
            </div>
          )}

          {memuat ? (
            <div className="masuk__periksa" role="status">
              <span className="masuk__putar masuk__putar--besar" aria-hidden="true" />
              Memeriksa sesi Anda...
            </div>
          ) : (
            <form className="masuk__form" onSubmit={kirim} noValidate aria-busy={sibuk}>
              {galat && (
                <div className={`masuk__galat masuk__galat--${galat.jenis}`} role="alert">
                  <IkonPeringatan />
                  <span>{galat.pesan}</span>
                </div>
              )}

              <div className="masuk__muncul" style={{ '--urut': 1 }}>
                <label className="masuk__nama" htmlFor={idEmail}>
                  Email
                </label>
                <div className={`masuk__kolom ${tampilGalatEmail ? 'masuk__kolom--salah' : ''} ${!galatEmail && email ? 'masuk__kolom--benar' : ''}`}>
                  <span className="masuk__ikon">
                    <IkonSurat />
                  </span>
                  <input
                    ref={kolomEmail}
                    id={idEmail}
                    className="masuk__input"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="nama@gmail.com"
                    value={email}
                    disabled={sibuk}
                    maxLength={80}
                    aria-invalid={Boolean(tampilGalatEmail)}
                    aria-describedby={tampilGalatEmail ? `${idEmail}-galat` : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      kosongkanGalat()
                    }}
                    onBlur={() => setDisentuh((d) => ({ ...d, email: true }))}
                  />
                </div>
                <p className={`masuk__pesan ${tampilGalatEmail ? 'masuk__pesan--tampil' : ''}`} id={`${idEmail}-galat`} aria-live="polite">
                  {tampilGalatEmail ? galatEmail : ''}
                </p>
              </div>

              <div className="masuk__muncul" style={{ '--urut': 2 }}>
                <label className="masuk__nama" htmlFor={idSandi}>
                  Kata sandi
                </label>
                <div className={`masuk__kolom ${tampilGalatSandi ? 'masuk__kolom--salah' : ''} ${!galatSandi && sandi ? 'masuk__kolom--benar' : ''}`}>
                  <span className="masuk__ikon">
                    <IkonGembok />
                  </span>
                  <input
                    ref={kolomSandi}
                    id={idSandi}
                    className="masuk__input masuk__input--sandi"
                    type={lihatSandi ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="********"
                    value={sandi}
                    disabled={sibuk}
                    maxLength={100}
                    aria-invalid={Boolean(tampilGalatSandi)}
                    aria-describedby={tampilGalatSandi ? `${idSandi}-galat` : undefined}
                    onChange={(e) => {
                      setSandi(e.target.value)
                      kosongkanGalat()
                    }}
                    onBlur={() => {
                      setDisentuh((d) => ({ ...d, sandi: true }))
                      setCapsAktif(false)
                    }}
                    onKeyDown={saatTombolSandi}
                    onKeyUp={saatTombolSandi}
                  />
                  <button
                    type="button"
                    className="masuk__mata"
                    onClick={() => setLihatSandi((v) => !v)}
                    aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-pressed={lihatSandi}
                    disabled={sibuk}
                  >
                    {lihatSandi ? <IkonMataCoret /> : <IkonMata />}
                  </button>
                </div>
                <p className={`masuk__pesan ${tampilGalatSandi || capsAktif ? 'masuk__pesan--tampil' : ''} ${!tampilGalatSandi && capsAktif ? 'masuk__pesan--info' : ''}`} id={`${idSandi}-galat`} aria-live="polite">
                  {tampilGalatSandi ? galatSandi : capsAktif ? 'Caps Lock sedang aktif.' : ''}
                </p>
              </div>

              <div className="masuk__muncul" style={{ '--urut': 3 }}>
                <button type="submit" className={`tombol tombol--emas masuk__kirim masuk__kirim--${tahap}`} disabled={!tombolAktif} aria-disabled={!tombolAktif}>
                  {tahap === 'proses' && (
                    <>
                      <span className="masuk__putar" aria-hidden="true" />
                      Memeriksa...
                    </>
                  )}
                  {tahap === 'berhasil' && (
                    <>
                      <IkonCentang />
                      Berhasil, mengalihkan...
                    </>
                  )}
                  {tahap === 'diam' && (
                    <>
                      {terkunci ? `Tunggu ${sisaDetik} detik` : 'Masuk'}
                      {!terkunci && <IkonPanah />}
                    </>
                  )}
                </button>
                <p className={`masuk__petunjuk ${petunjuk ? 'masuk__petunjuk--tampil' : ''}`} aria-live="polite">
                  {petunjuk}
                </p>
              </div>
            </form>
          )}

          <div className="masuk__kaki masuk__muncul" style={{ '--urut': 4 }}>
            <Link to="/" className="masuk__kembali">
              <IkonKembali />
              Kembali ke beranda
            </Link>
            <p className="masuk__aman">
              <IkonGembok />
              Halaman ini hanya untuk admin
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}