import { Link, useLocation } from 'react-router-dom'
import LogoTimbangan from './LogoTimbangan'
import useGambar from '../hooks/useGambar'
import './Footer.css'

// Berita dan FAQ tidak punya halaman sendiri, tautannya menggulir ke bagian itu di Beranda.
const JELAJAH = [
  { ke: '/', label: 'Beranda' },
  { ke: '/konsultasi', label: 'Konsultasi Profil Risiko' },
  { ke: '/edukasi', label: 'Edukasi Investasi' },
  { ke: '/pasar', label: 'Pasar' },
  { ke: { pathname: '/', hash: '#berita' }, label: 'Berita' },
  { ke: { pathname: '/', hash: '#faq' }, label: 'FAQ' },
  { ke: '/tentang', label: 'Tentang TAKAR' },
]

// Hanya situs resmi lembaga yang memang berwenang di bidangnya.
const RUJUKAN = [
  { label: 'Otoritas Jasa Keuangan (OJK)', url: 'https://www.ojk.go.id' },
  { label: 'Kustodian Sentral Efek Indonesia (KSEI)', url: 'https://www.ksei.co.id' },
  { label: 'Bursa Efek Indonesia (BEI)', url: 'https://www.idx.co.id' },
  { label: 'Bank Indonesia', url: 'https://www.bi.go.id' },
]

/*
  Logo lembaga di baris bawah footer.

  CARA MEMASANG LOGO
  Simpan logo di folder public/logo-lembaga/ dengan nama unair, ojk, dan ksei (format .svg, .png, atau .webp).
  Gunakan logo dengan LATAR TRANSPARAN. Kode di bawah mengubahnya menjadi satu warna terang senada footer
  (lewat CSS), jadi warna aslinya tidak perlu diubah dulu. Selama berkas belum ada, yang tampil adalah singkatan
  lembaganya dalam huruf biasa, bukan kotak kosong.
*/
const LEMBAGA = [
  { singkat: 'UNAIR', nama: 'Universitas Airlangga', url: 'https://unair.ac.id/', berkas: 'unair' },
  { singkat: 'OJK', nama: 'Otoritas Jasa Keuangan', url: 'https://ojk.go.id/id/Default.aspx', berkas: 'ojk' },
  { singkat: 'KSEI', nama: 'Kustodian Sentral Efek Indonesia', url: 'https://www.ksei.co.id/id', berkas: 'ksei' },
]

function LogoLembaga({ lembaga }) {
  const { singkat, nama, url, berkas } = lembaga
  const { status, src } = useGambar([`/logo-lembaga/${berkas}.svg`, `/logo-lembaga/${berkas}.png`, `/logo-lembaga/${berkas}.webp`])

  return (
    <li>
      <a className="ftr__lembaga" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${nama} (membuka tab baru)`} title={nama}>
        {status === 'siap' ? <img src={src} alt="" draggable={false} /> : <span className="ftr__lembaga-teks">{status === 'gagal' ? singkat : ''}</span>}
      </a>
    </li>
  )
}

export default function Footer() {
  const { pathname } = useLocation()

  // Mengeklik Beranda saat sudah di Beranda membawa halaman kembali ke paling atas.
  const saatKlik = (ke) => {
    if (ke === '/' && pathname === '/') {
      if (window.__lenis) window.__lenis.scrollTo(0)
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="ftr">
      <div className="pembungkus ftr__atas">
        <div className="ftr__merek">
          <Link to="/" className="ftr__tautan-merek" aria-label="TAKAR, kembali ke beranda" onClick={() => saatKlik('/')}>
            <LogoTimbangan className="ftr__logo" />
            <span className="ftr__teks">
              <span className="ftr__nama">TAKAR</span>
              <span className="ftr__tagline">Tentukan Aset Bersama Pakar</span>
            </span>
          </Link>
          <p className="ftr__uraian">
            Sistem pakar untuk mengenali profil risiko investor dan instrumen investasi yang sesuai, dihitung dengan metode Naive Bayes
            dan Certainty Factor.
          </p>
        </div>

        <nav className="ftr__kolom" aria-label="Jelajahi">
          <h2>Jelajahi</h2>
          <ul>
            {JELAJAH.map((t) => (
              <li key={t.label}>
                <Link to={t.ke} onClick={() => saatKlik(t.ke)}>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ftr__kolom">
          <h2>Rujukan resmi</h2>
          <ul>
            {RUJUKAN.map((t) => (
              <li key={t.url}>
                <a href={t.url} target="_blank" rel="noopener noreferrer">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="ftr__kolom ftr__kolom--tentang">
          <h2>Tentang hasilnya</h2>
          <p className="ftr__catatan">
            TAKAR memberi gambaran awal yang terukur tentang profil risiko Anda, dengan basis pengetahuan dari seorang Certified Financial
            Planner. Hasilnya tidak menggantikan konsultasi langsung dengan perencana keuangan, tetapi bisa menjadi titik mulai yang jelas
            sebelum Anda melangkah.
          </p>
          <div className="ftr__tautan-aksi">
            <Link to="/konsultasi" className="ftr__coba">
              Coba konsultasi sekarang
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link to="/admin" className="ftr__admin">
              Login Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="pembungkus ftr__bawah">
        <p className="ftr__hakcipta">© 2026 TAKAR. Dikembangkan sebagai bagian dari penelitian skripsi Program Studi S-1 Matematika, Universitas Airlangga.</p>
        <ul className="ftr__lembaga-daftar" aria-label="Lembaga rujukan">
          {LEMBAGA.map((l) => (
            <LogoLembaga key={l.berkas} lembaga={l} />
          ))}
        </ul>
      </div>
    </footer>
  )
}