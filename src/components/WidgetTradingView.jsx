import { useEffect, useRef, useState } from 'react'
import IkonPasar from './IkonPasar'
import './WidgetTradingView.css'

// Memasang satu widget TradingView memakai cara resmi mereka: sebuah wadah berisi skrip yang isinya
// adalah pengaturan JSON. Komponen ini menambahkan:
//   - muat malas: skrip baru dipanggil ketika widget hampir terlihat, jadi halaman tetap ringan
//   - kerangka tunggu yang bergerak selama grafik dimuat
//   - penanganan gagal muat (koneksi putus, pemblokir iklan, TradingView sedang bermasalah) dengan tombol coba lagi
//   - pembersihan penuh saat widget diganti atau halaman ditinggalkan, supaya tidak ada iframe yatim
const BATAS_IFRAME_MS = 15000 // iframe harus muncul sebelum ini, bila tidak dianggap gagal
const JEDA_SIAP_MS = 5000 // iframe sudah ada tetapi sinyal "selesai" belum datang: kerangka tunggu tetap dilepas

// Skrip TradingView yang sudah terlanjur diminta tetap berjalan walau wadahnya sudah dibuang (misalnya
// pengguna berpindah instrumen dengan cepat), dan skrip itu mencari induknya lewat
// document.currentScript.parentNode. Karena itu isi lama tidak dihapus begitu saja, tetapi dipindah ke
// wadah lepas yang tidak pernah dipasang di halaman. Skrip yang terlambat tetap menemukan induknya,
// menaruh iframe-nya di sana, dan semuanya hilang bersama sampah memori tanpa muncul di layar.
function kosongkan(tempat) {
  const lepas = document.createElement('div')
  lepas.append(...tempat.childNodes)
}

export default function WidgetTradingView({ skrip, konfigurasi, varian = 'grafik', label, tautanCadangan, segera = false, kelas = '' }) {
  const akar = useRef(null)
  const wadah = useRef(null)
  const [terlihat, setTerlihat] = useState(segera)
  const [status, setStatus] = useState(segera ? 'memuat' : 'menunggu') // menunggu | memuat | siap | gagal
  const [ulang, setUlang] = useState(0)
  const json = JSON.stringify(konfigurasi)

  /* ----- Muat malas ----- */
  useEffect(() => {
    if (terlihat) return
    const el = akar.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setTerlihat(true)
      return
    }
    const pengamat = new IntersectionObserver(
      (entri) => {
        if (entri.some((e) => e.isIntersecting)) {
          setTerlihat(true)
          pengamat.disconnect()
        }
      },
      { rootMargin: '360px 0px' },
    )
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [terlihat])

  /* ----- Pasang widget ----- */
  useEffect(() => {
    if (!terlihat) return
    const tempat = wadah.current
    if (!tempat) return
    setStatus('memuat')
    kosongkan(tempat)

    const dalam = document.createElement('div')
    dalam.className = 'tradingview-widget-container__widget'
    dalam.style.cssText = 'width:100%;height:100%'
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = skrip
    s.async = true
    s.innerHTML = json

    let berhenti = false
    let batasIframe
    let jedaSiap
    const akhiri = (hasil) => {
      if (berhenti) return
      berhenti = true
      clearTimeout(batasIframe)
      clearTimeout(jedaSiap)
      pengamat.disconnect()
      setStatus(hasil)
    }
    const pengamat = new MutationObserver(() => {
      const f = dalam.querySelector('iframe')
      if (!f) return
      pengamat.disconnect()
      clearTimeout(batasIframe)
      f.addEventListener('load', () => akhiri('siap'), { once: true })
      jedaSiap = setTimeout(() => akhiri('siap'), JEDA_SIAP_MS)
    })
    pengamat.observe(dalam, { childList: true, subtree: true })
    batasIframe = setTimeout(() => akhiri('gagal'), BATAS_IFRAME_MS)
    s.onerror = () => akhiri('gagal')

    tempat.append(dalam, s)
    return () => {
      berhenti = true
      clearTimeout(batasIframe)
      clearTimeout(jedaSiap)
      pengamat.disconnect()
      kosongkan(tempat)
    }
  }, [terlihat, skrip, json, ulang])

  const coba = () => {
    setStatus('memuat')
    setUlang((n) => n + 1)
  }

  return (
    <div ref={akar} className={`tv tv--${varian} tv--${status} ${kelas}`} data-status={status} aria-busy={status === 'memuat' || status === 'menunggu'}>
      <div className="tradingview-widget-container tv__wadah" ref={wadah} role="group" aria-label={label} />

      {/* Kerangka tunggu */}
      <div className="tv__rangka" aria-hidden="true">
        {varian === 'grafik' ? (
          <>
            <svg className="tv__lilin" viewBox="0 0 320 120" preserveAspectRatio="none" focusable="false">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
                const x = 12 + i * 19
                const naik = i % 3 !== 1
                const tengah = 78 - i * 2.2 + Math.sin(i * 1.7) * 14
                const tinggi = 14 + ((i * 7) % 18)
                return (
                  <g key={i} className="tv__lilin-satu" style={{ '--i': i }}>
                    <line x1={x} x2={x} y1={tengah - tinggi - 8} y2={tengah + tinggi + 8} />
                    <rect x={x - 4.5} y={tengah - tinggi / 2} width="9" height={tinggi} rx="1.5" className={naik ? 'tv__naik' : 'tv__turun'} />
                  </g>
                )
              })}
            </svg>
            <p className="tv__teks">Memuat grafik dari TradingView</p>
          </>
        ) : (
          <p className="tv__teks">Memuat harga berjalan</p>
        )}
      </div>

      {/* Bila gagal dimuat */}
      {status === 'gagal' && (
        <div className="tv__gagal" role="alert">
          <span className="tv__gagal-ikon">
            <IkonPasar nama="info" ukuran={26} />
          </span>
          <p className="tv__gagal-judul">{varian === 'grafik' ? 'Grafik belum bisa dimuat' : 'Harga berjalan belum bisa dimuat'}</p>
          <p className="tv__gagal-isi">Biasanya karena koneksi terputus atau pemblokir iklan menahan TradingView. Periksa koneksi Anda, matikan pemblokir untuk situs ini bila ada, lalu coba lagi.</p>
          <div className="tv__gagal-aksi">
            <button type="button" className="tv__tombol tv__tombol--emas" onClick={coba}>
              <IkonPasar nama="ulang" ukuran={17} />
              Coba lagi
            </button>
            {tautanCadangan && (
              <a className="tv__tombol tv__tombol--garis" href={tautanCadangan} target="_blank" rel="noopener noreferrer">
                Buka di TradingView
                <IkonPasar nama="luar" ukuran={16} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}