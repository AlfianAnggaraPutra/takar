import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import IkonPasar from './IkonPasar'
import useLayarPenuh from '../hooks/useLayarPenuh'
import { angka, dolar, persen } from '../data/pasar'
import './GrafikEmas.css'

// Grafik garis rata-rata harga emas per kuartal. Digambar sendiri dengan SVG supaya tema, huruf, dan
// perilakunya sama persis dengan halaman lain. Bisa diperbesar, digeser, dibaca angkanya satu per satu,
// dilihat sebagai tabel, dan dibuka di layar penuh.

const MIN_SPAN = 3 // paling sedikit 4 kuartal terlihat
const klem = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const sama = (a, b) => Math.abs(a - b) < 0.05

const PRESET = [
  { id: 'semua', label: 'Semua', span: Infinity },
  { id: '3th', label: '3 tahun', span: 11 },
  { id: '2th', label: '2 tahun', span: 7 },
  { id: '1th', label: '1 tahun', span: 3 },
]

// Langkah sumbu yang enak dibaca: 1, 2, 2,5, atau 5 dikali pangkat sepuluh.
function langkahBagus(kasar) {
  const pangkat = 10 ** Math.floor(Math.log10(kasar))
  const f = kasar / pangkat
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pangkat
}

// Nilai pada posisi pecahan di antara dua kuartal (dipakai saat animasi zoom).
function nilaiPada(data, x) {
  const n = data.length
  const i = klem(Math.floor(x), 0, n - 1)
  const j = klem(i + 1, 0, n - 1)
  const t = klem(x - i, 0, 1)
  return data[i].nilai + (data[j].nilai - data[i].nilai) * t
}

function rentangY(data, a, b) {
  let lo = Math.min(nilaiPada(data, a), nilaiPada(data, b))
  let hi = Math.max(nilaiPada(data, a), nilaiPada(data, b))
  for (let i = Math.ceil(a); i <= Math.floor(b); i++) {
    lo = Math.min(lo, data[i].nilai)
    hi = Math.max(hi, data[i].nilai)
  }
  const ruang = (hi - lo) * 0.14 || hi * 0.05
  return [lo - ruang, hi + ruang]
}

function jendelaPreset(span, n) {
  const total = n - 1
  if (!Number.isFinite(span) || span >= total) return { a: 0, b: total }
  // Jendela pendek selalu berakhir di kuartal terbaru, karena itu yang paling ingin dilihat orang.
  return { a: total - span, b: total }
}

export default function GrafikEmas({ data, kelas = '' }) {
  const n = data.length
  const kartu = useRef(null)
  const plot = useRef(null)
  const { ref: refPenuh, penuh, ganti } = useLayarPenuh()
  const [ukuran, setUkuran] = useState({ w: 0, h: 0 })
  const [jendela, setJendela] = useState({ a: 0, b: n - 1 })
  const [alvo, setAlvo] = useState({ a: 0, b: n - 1 }) // jendela tujuan, dipakai status tombol dan kisi
  const [aktif, setAktif] = useState(n - 1)
  const [lihat, setLihat] = useState('grafik') // grafik | tabel
  const [mulai, setMulai] = useState(false)
  const [gambarSelesai, setGambarSelesai] = useState(false)

  // Nilai yang dituju animasi (selalu terbaru, tanpa memicu render ulang).
  const target = useRef({ a: 0, b: n - 1 })
  const kini = useRef({ a: 0, b: n - 1 })
  const tween = useRef(null)
  const seret = useRef(null)
  const aktifRef = useRef(n - 1)
  aktifRef.current = aktif

  const kurangGerak = useMemo(() => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false), [])

  /* ----- Ukuran area gambar mengikuti wadahnya ----- */
  useEffect(() => {
    const el = plot.current
    if (!el) return
    const baca = () => {
      const r = el.getBoundingClientRect()
      setUkuran((u) => (Math.abs(u.w - r.width) < 0.5 && Math.abs(u.h - r.height) < 0.5 ? u : { w: r.width, h: r.height }))
    }
    baca()
    const pengamat = new ResizeObserver(baca)
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [lihat])

  /* ----- Mulai menggambar saat kartu terlihat ----- */
  useEffect(() => {
    if (kurangGerak) {
      setMulai(true)
      setGambarSelesai(true)
      return
    }
    const el = kartu.current
    if (!el || !('IntersectionObserver' in window)) {
      setMulai(true)
      return
    }
    const pengamat = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setMulai(true)
          pengamat.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [kurangGerak])

  /* ----- Pindah jendela dengan animasi ----- */
  const keJendela = useCallback(
    (a, b, { langsung = false } = {}) => {
      const total = n - 1
      let span = klem(b - a, MIN_SPAN, total)
      let aa = klem(a, 0, total - span)
      let bb = aa + span
      aa = +aa.toFixed(4)
      bb = +bb.toFixed(4)
      target.current = { a: aa, b: bb }
      setAlvo({ a: aa, b: bb })
      tween.current?.kill()
      if (langsung || kurangGerak) {
        kini.current = { a: aa, b: bb }
        setJendela({ a: aa, b: bb })
        return
      }
      const nilai = { ...kini.current }
      tween.current = gsap.to(nilai, {
        a: aa,
        b: bb,
        duration: 0.6,
        ease: 'power3.out',
        onUpdate: () => {
          kini.current = { a: nilai.a, b: nilai.b }
          setJendela({ a: nilai.a, b: nilai.b })
        },
      })
    },
    [n, kurangGerak],
  )
  useEffect(() => () => tween.current?.kill(), [])

  const pilih = useCallback(
    (i) => {
      const k = klem(Math.round(i), 0, n - 1)
      setAktif(k)
      const { a, b } = target.current
      if (k < a - 0.01 || k > b + 0.01) {
        const span = b - a
        if (k < a) keJendela(k, k + span)
        else keJendela(k - span, k)
      }
    },
    [n, keJendela],
  )

  const perbesar = useCallback(() => {
    const { a, b } = target.current
    const span = Math.max(MIN_SPAN, Math.round((b - a) * 0.7))
    if (span >= b - a - 0.01) return
    const pusat = aktifRef.current >= a && aktifRef.current <= b ? aktifRef.current : (a + b) / 2
    const nisbah = (pusat - a) / (b - a)
    const aa = pusat - span * nisbah
    keJendela(aa, aa + span)
  }, [keJendela])

  const perkecil = useCallback(() => {
    const { a, b } = target.current
    const span = Math.min(n - 1, Math.ceil((b - a) / 0.7))
    if (span <= b - a + 0.01) return
    const pusat = (a + b) / 2
    keJendela(pusat - span / 2, pusat + span / 2)
  }, [n, keJendela])

  const geser = useCallback(
    (arah) => {
      const { a, b } = target.current
      const langkah = Math.max(1, Math.round((b - a) / 3)) * arah
      keJendela(a + langkah, b + langkah)
    },
    [keJendela],
  )

  const atur = useCallback(() => keJendela(0, n - 1), [n, keJendela])

  // Zoom dengan Ctrl atau Cmd + roda (juga gerakan cubit di trackpad). Roda biasa tetap menggulir halaman.
  useEffect(() => {
    const el = plot.current
    if (!el || lihat !== 'grafik') return
    const roda = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      if (e.deltaY < 0) perbesar()
      else if (e.deltaY > 0) perkecil()
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [lihat, perbesar, perkecil])

  /* ----- Ukuran dan skala ----- */
  const W = ukuran.w || 640
  const H = ukuran.h || 360
  const sempit = W < 520
  const m = { k: sempit ? 46 : 58, ka: sempit ? 12 : 22, a: 14, b: 52 }
  const lebarPlot = Math.max(10, W - m.k - m.ka)
  const tinggiPlot = Math.max(10, H - m.a - m.b)
  const { a, b } = jendela
  const span = Math.max(0.0001, b - a)
  const x = (i) => m.k + ((i - a) / span) * lebarPlot
  const [lo, hi] = rentangY(data, a, b)
  const y = (v) => m.a + (1 - (v - lo) / (hi - lo)) * tinggiPlot
  const langkahPx = lebarPlot / span

  // Garis kisi dihitung dari rentang tujuan supaya tidak berkedip selama animasi.
  const [loT, hiT] = rentangY(data, alvo.a, alvo.b)
  const langkahY = langkahBagus((hiT - loT) / 5)
  const kisi = []
  for (let v = Math.ceil(loT / langkahY) * langkahY; v <= hiT; v += langkahY) kisi.push(v)

  const dari = Math.max(0, Math.floor(a) - 1)
  const sampai = Math.min(n - 1, Math.ceil(b) + 1)
  const titik = []
  for (let i = dari; i <= sampai; i++) titik.push([x(i), y(data[i].nilai), i])
  const garis = titik.map(([px, py], k) => `${k ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const dasar = m.a + tinggiPlot
  const area = titik.length ? `${garis} L${titik[titik.length - 1][0].toFixed(1)} ${dasar} L${titik[0][0].toFixed(1)} ${dasar} Z` : ''

  // Tahun yang terlihat, untuk pita latar dan label bawah.
  const tahun = []
  for (let i = Math.max(0, Math.ceil(a - 0.5)); i <= Math.min(n - 1, Math.floor(b + 0.5)); i++) {
    const t = data[i].tahun
    const akhir = tahun[tahun.length - 1]
    if (akhir && akhir.tahun === t) akhir.sampai = i
    else tahun.push({ tahun: t, dari: i, sampai: i })
  }

  /* ----- Interaksi pada area gambar ----- */
  const indeksDariX = (clientX) => {
    const r = plot.current.getBoundingClientRect()
    const px = clientX - r.left
    return a + ((px - m.k) / lebarPlot) * span
  }
  const bisaGeser = alvo.b - alvo.a < n - 1 - 0.01

  const tekan = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    seret.current = { x: e.clientX, a: target.current.a, b: target.current.b, bergerak: false, id: e.pointerId, jenis: e.pointerType }
    pilih(indeksDariX(e.clientX))
  }
  const gerak = (e) => {
    const s = seret.current
    if (s && e.pointerId === s.id) {
      const dx = e.clientX - s.x
      if (!s.bergerak && Math.abs(dx) > 5) {
        s.bergerak = true
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // Tidak masalah bila peramban menolak penangkapan penunjuk.
        }
      }
      if (s.bergerak) {
        if (bisaGeser) {
          const gs = (dx / langkahPx) * -1
          const aa = klem(s.a + gs, 0, n - 1 - (s.b - s.a))
          tween.current?.kill()
          target.current = { a: aa, b: aa + (s.b - s.a) }
          kini.current = target.current
          setAlvo(target.current)
          setJendela(target.current)
        } else {
          pilih(indeksDariX(e.clientX))
        }
        return
      }
    }
    // Mouse tanpa tombol: ikuti penunjuk. Layar sentuh hanya berubah saat disentuh.
    if (e.pointerType === 'mouse' && !s) pilih(indeksDariX(e.clientX))
  }
  const lepas = (e) => {
    const s = seret.current
    seret.current = null
    if (s?.bergerak) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Sudah terlepas.
      }
    }
  }

  const tombol = (e) => {
    const peta = {
      ArrowLeft: () => pilih(aktif - 1),
      ArrowRight: () => pilih(aktif + 1),
      Home: () => pilih(0),
      End: () => pilih(n - 1),
      PageUp: () => pilih(aktif + 4),
      PageDown: () => pilih(aktif - 4),
      '+': perbesar,
      '=': perbesar,
      '-': perkecil,
      0: atur,
    }
    const aksi = peta[e.key]
    if (aksi) {
      e.preventDefault()
      aksi()
    }
  }

  const t = data[aktif]
  const aktifPreset = PRESET.find((p) => {
    const w = jendelaPreset(p.span, n)
    return sama(alvo.a, w.a) && sama(alvo.b, w.b)
  })
  const penuhTerlihat = sama(alvo.a, 0) && sama(alvo.b, n - 1)
  const bisaPerbesar = alvo.b - alvo.a > MIN_SPAN + 0.05
  const bisaPerkecil = !penuhTerlihat

  const stepLabelQ = langkahPx >= 30
  const ringkasLabel = langkahPx < 22

  return (
    <div
      ref={(el) => {
        kartu.current = el
        refPenuh.current = el
      }}
      className={`emas ${penuh ? 'emas--penuh' : ''} ${mulai ? 'emas--mulai' : ''} ${gambarSelesai ? 'emas--selesai' : ''} ${kelas}`}
      data-lihat={lihat}
      data-aktif={aktif}
      data-a={a.toFixed(2)}
      data-b={b.toFixed(2)}
    >
      {/* Baris atas: pembaca angka dan alat */}
      <div className="emas__atas">
        <div className="emas-baca" data-arah={t.dariKuartal === null ? 'awal' : t.dariKuartal >= 0 ? 'naik' : 'turun'}>
          <div className="emas-baca__utama" key={aktif}>
            <span className="emas-baca__label">{t.label}</span>
            <strong className="emas-baca__nilai">{dolar(t.nilai)}</strong>
            <span className="emas-baca__satuan">rata-rata per troy ounce</span>
          </div>
          <div className="emas-baca__ubah">
            {t.dariKuartal !== null ? (
              <span className={`emas-chip ${t.dariKuartal >= 0 ? 'emas-chip--naik' : 'emas-chip--turun'}`}>
                <IkonPasar nama={t.dariKuartal >= 0 ? 'naik' : 'turun'} ukuran={14} tebal={2.2} />
                <span>
                  {persen(t.dariKuartal)} <small>dari {data[aktif - 1].label}</small>
                </span>
              </span>
            ) : (
              <span className="emas-chip emas-chip--awal">Kuartal pertama dalam data</span>
            )}
            {t.dariTahunLalu !== null && (
              <span className={`emas-chip ${t.dariTahunLalu >= 0 ? 'emas-chip--naik' : 'emas-chip--turun'}`}>
                <IkonPasar nama={t.dariTahunLalu >= 0 ? 'naik' : 'turun'} ukuran={14} tebal={2.2} />
                <span>
                  {persen(t.dariTahunLalu)} <small>dari {t.pembandingTahun}</small>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="emas__alat">
        <div className="emas__rentang" role="group" aria-label="Rentang waktu">
          {PRESET.map((p) => (
            <button key={p.id} type="button" className={`emas-pil ${aktifPreset?.id === p.id ? 'emas-pil--aktif' : ''}`} aria-pressed={aktifPreset?.id === p.id} disabled={lihat === 'tabel'} onClick={() => {
              const w = jendelaPreset(p.span, n)
              keJendela(w.a, w.b)
            }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="emas__perkakas" role="group" aria-label="Alat grafik">
          <button type="button" className="emas-ikon" onClick={() => geser(-1)} disabled={lihat === 'tabel' || sama(alvo.a, 0)} aria-label="Geser ke kuartal sebelumnya" title="Geser ke kiri">
            <IkonPasar nama="kiri" />
          </button>
          <button type="button" className="emas-ikon" onClick={() => geser(1)} disabled={lihat === 'tabel' || sama(alvo.b, n - 1)} aria-label="Geser ke kuartal berikutnya" title="Geser ke kanan">
            <IkonPasar nama="kanan" />
          </button>
          <span className="emas__pemisah" aria-hidden="true" />
          <button type="button" className="emas-ikon" onClick={perkecil} disabled={lihat === 'tabel' || !bisaPerkecil} aria-label="Perkecil, tampilkan rentang lebih luas" title="Perkecil">
            <IkonPasar nama="perkecil" />
          </button>
          <button type="button" className="emas-ikon" onClick={perbesar} disabled={lihat === 'tabel' || !bisaPerbesar} aria-label="Perbesar, tampilkan rentang lebih sempit" title="Perbesar">
            <IkonPasar nama="perbesar" />
          </button>
          <button type="button" className="emas-ikon" onClick={atur} disabled={lihat === 'tabel' || penuhTerlihat} aria-label="Atur ulang rentang" title="Atur ulang">
            <IkonPasar nama="ulang" />
          </button>
          <span className="emas__pemisah" aria-hidden="true" />
          <button type="button" className={`emas-ikon emas-ikon--teks ${lihat === 'tabel' ? 'emas-ikon--aktif' : ''}`} onClick={() => setLihat((v) => (v === 'grafik' ? 'tabel' : 'grafik'))} aria-pressed={lihat === 'tabel'} title={lihat === 'tabel' ? 'Lihat grafik' : 'Lihat tabel'}>
            <IkonPasar nama={lihat === 'tabel' ? 'grafik' : 'tabel'} />
            <span>{lihat === 'tabel' ? 'Lihat grafik' : 'Lihat tabel'}</span>
          </button>
          <button type="button" className="emas-ikon emas-ikon--teks" onClick={ganti} aria-pressed={penuh} data-keluar-layar={penuh ? 'ya' : undefined} title={penuh ? 'Keluar layar penuh' : 'Layar penuh'}>
            <IkonPasar nama={penuh ? 'keluarPenuh' : 'layarPenuh'} />
            <span>{penuh ? 'Keluar layar penuh' : 'Layar penuh'}</span>
          </button>
        </div>
      </div>

      {/* Grafik */}
      {lihat === 'grafik' && (
        <div className="emas__gambar" ref={plot}>
          <p className="emas__sumbu-judul">US$ per troy ounce</p>
          <svg className="emas__svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} focusable="false" aria-hidden="true">
            <defs>
              <linearGradient id="emas-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ecb54e" stopOpacity="0.34" />
                <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="emas-garis" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#f0cd82" />
                <stop offset="1" stopColor="#ecb54e" />
              </linearGradient>
              <clipPath id="emas-klip">
                <rect x={m.k} y={m.a - 6} width={lebarPlot} height={tinggiPlot + 12} />
              </clipPath>
            </defs>

            {/* Pita tahun selang-seling */}
            <g clipPath="url(#emas-klip)">
              {tahun.map((th, k) => (th.tahun % 2 === 0 ? <rect key={th.tahun} className="emas__pita" x={x(th.dari - 0.5)} y={m.a - 6} width={x(th.sampai + 0.5) - x(th.dari - 0.5)} height={tinggiPlot + 12} /> : null))}
            </g>

            {/* Kisi dan angka sumbu */}
            {kisi.map((v) => {
              const py = y(v)
              if (py < m.a - 2 || py > dasar + 2) return null
              return (
                <g key={v} className="emas__kisi">
                  <line x1={m.k} x2={W - m.ka} y1={py} y2={py} />
                  <text x={m.k - 9} y={py + 4} textAnchor="end">
                    {angka(v, 0)}
                  </text>
                </g>
              )
            })}
            <line className="emas__dasar" x1={m.k} x2={W - m.ka} y1={dasar} y2={dasar} />

            {/* Area dan garis */}
            <g clipPath="url(#emas-klip)">
              <path className="emas__area" d={area} fill="url(#emas-area)" />
              <path className={`emas__garis ${gambarSelesai ? '' : 'emas__garis--awal'}`} d={garis} fill="none" stroke="url(#emas-garis)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" onAnimationEnd={() => setGambarSelesai(true)} />
              {aktif >= a - 0.01 && aktif <= b + 0.01 && <line className="emas__silang" x1={x(aktif)} x2={x(aktif)} y1={m.a - 6} y2={dasar} />}
            </g>

            {/* Titik tiap kuartal */}
            <g>
              {titik.map(([px, py, i]) => {
                if (px < m.k - 4 || px > W - m.ka + 4) return null
                const turun = data[i].dariKuartal !== null && data[i].dariKuartal < 0
                const sedang = i === aktif
                return (
                  <g key={i} className={`emas__titik ${turun ? 'emas__titik--turun' : ''} ${sedang ? 'emas__titik--aktif' : ''}`} style={{ '--i': i }} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}>
                    {sedang && <circle className="emas__halo" r="13" />}
                    <circle className="emas__bulat" r={sedang ? 6.5 : 4.4} />
                  </g>
                )
              })}
            </g>

            {/* Label kuartal dan tahun */}
            <g className="emas__sumbu-x">
              {stepLabelQ &&
                titik.map(([px, , i]) => (px >= m.k - 2 && px <= W - m.ka + 2 ? (
                  <text key={`q${i}`} className={i === aktif ? 'emas__q emas__q--aktif' : 'emas__q'} x={px} y={H - 28} textAnchor="middle">
                    Q{data[i].kuartal}
                  </text>
                ) : null))}
              {tahun.map((th) => {
                const kiri = Math.max(m.k, x(th.dari - 0.5))
                const kanan = Math.min(W - m.ka, x(th.sampai + 0.5))
                const lebar = kanan - kiri
                if (lebar < 30) return null
                return (
                  <g key={th.tahun}>
                    {th.dari > 0 && data[th.dari].kuartal === 1 && <line className="emas__batas" x1={x(th.dari - 0.5)} x2={x(th.dari - 0.5)} y1={dasar} y2={dasar + 10} />}
                    <text className="emas__tahun" x={(kiri + kanan) / 2} y={H - 9} textAnchor="middle">
                      {ringkasLabel && lebar < 46 ? `'${String(th.tahun).slice(2)}` : th.tahun}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Lapisan sentuh dan papan ketik */}
          <div
            className={`emas__sentuh ${bisaGeser ? 'emas__sentuh--geser' : ''}`}
            style={{ left: m.k - 12, top: m.a - 6, width: lebarPlot + 24, height: tinggiPlot + 12 }}
            role="slider"
            tabIndex={0}
            aria-label="Harga emas per kuartal. Gunakan panah kiri dan kanan untuk berpindah kuartal, plus dan minus untuk memperbesar atau memperkecil."
            aria-valuemin={0}
            aria-valuemax={n - 1}
            aria-valuenow={aktif}
            aria-valuetext={`${t.label}, ${dolar(t.nilai)} per troy ounce`}
            onPointerDown={tekan}
            onPointerMove={gerak}
            onPointerUp={lepas}
            onPointerCancel={lepas}
            onKeyDown={tombol}
          />
        </div>
      )}

      {/* Tabel */}
      {lihat === 'tabel' && (
        <div className="emas__tabel-bungkus" ref={plot}>
          <div className="emas__tabel" role="region" aria-label="Tabel harga emas per kuartal" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Kuartal</th>
                  <th scope="col" className="emas__angka">Rata-rata (US$/oz)</th>
                  <th scope="col" className="emas__angka">Dari kuartal sebelumnya</th>
                  <th scope="col" className="emas__angka">Dari tahun lalu</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={d.label} className={i === aktif ? 'emas__baris--aktif' : ''} onClick={() => setAktif(i)} aria-current={i === aktif ? 'true' : undefined}>
                    <th scope="row">{d.label}</th>
                    <td className="emas__angka">{angka(d.nilai)}</td>
                    <td className={`emas__angka ${d.dariKuartal === null ? '' : d.dariKuartal >= 0 ? 'emas__naik' : 'emas__turun'}`}>{d.dariKuartal === null ? 'Awal data' : persen(d.dariKuartal)}</td>
                    <td className={`emas__angka ${d.dariTahunLalu === null ? '' : d.dariTahunLalu >= 0 ? 'emas__naik' : 'emas__turun'}`}>{d.dariTahunLalu === null ? '-' : persen(d.dariTahunLalu)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="emas__kaki">
        <p className="emas__legenda">
          <span className="emas__ket emas__ket--naik">Naik dari kuartal sebelumnya</span>
          <span className="emas__ket emas__ket--turun">Turun dari kuartal sebelumnya</span>
        </p>
        <p className="emas__petunjuk">
          {lihat === 'grafik' ? 'Seret untuk menggeser, perbesar dengan tombol di atas atau Ctrl dan roda mouse. Sumbu tegak tidak dimulai dari nol, supaya selisih antar kuartal terlihat jelas.' : 'Klik satu baris untuk menandainya, lalu kembali ke grafik untuk melihat posisinya.'}
        </p>
      </div>
    </div>
  )
}