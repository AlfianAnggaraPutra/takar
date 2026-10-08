import { Link } from 'react-router-dom'
import LogoTimbangan from './LogoTimbangan'
import './Footer.css'

const JELAJAH = [
  { ke: '/', label: 'Beranda' },
  { ke: '/konsultasi', label: 'Konsultasi Profil Risiko' },
  { ke: '/edukasi', label: 'Edukasi Investasi' },
  { ke: '/pasar', label: 'Pasar' },
  { ke: '/berita', label: 'Berita' },
  { ke: '/tentang', label: 'Tentang TAKAR' },
]

// Hanya situs resmi lembaga yang memang berwenang di bidangnya.
const RUJUKAN = [
  { label: 'Otoritas Jasa Keuangan (OJK)', url: 'https://www.ojk.go.id' },
  { label: 'Kustodian Sentral Efek Indonesia (KSEI)', url: 'https://www.ksei.co.id' },
  { label: 'Bursa Efek Indonesia (BEI)', url: 'https://www.idx.co.id' },
  { label: 'Bank Indonesia', url: 'https://www.bi.go.id' },
]

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="pembungkus ftr__atas">
        <div className="ftr__merek">
          <Link to="/" className="ftr__tautan-merek" aria-label="TAKAR, kembali ke beranda">
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
              <li key={t.ke}>
                <Link to={t.ke}>{t.label}</Link>
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

        <div className="ftr__kolom">
          <h2>Perlu Anda ketahui</h2>
          <p className="ftr__catatan">
            TAKAR hanyalah alat bantu skrining awal. Hasilnya bukan nasihat keuangan dan bukan ajakan membeli instrumen tertentu. Untuk
            keputusan yang besar, pertimbangkan berkonsultasi dengan perencana keuangan berlisensi.
          </p>
          <Link to="/admin" className="ftr__admin">
            Login Admin
          </Link>
        </div>
      </div>

      <div className="pembungkus ftr__bawah">
        <p>© 2026 TAKAR. Dikembangkan sebagai bagian dari penelitian skripsi Program Studi S-1 Matematika, Universitas Airlangga.</p>
        <p>Basis pengetahuan disusun bersama seorang Certified Financial Planner.</p>
      </div>
    </footer>
  )
}