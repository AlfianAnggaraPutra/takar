import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import IkonPasar from '../components/IkonPasar'
import WidgetTradingView from '../components/WidgetTradingView'
import GrafikEmas from '../components/GrafikEmas'
import useLayarPenuh from '../hooks/useLayarPenuh'
import { gulirKe } from '../hooks/useScrollHalus'
import {
  CATATAN_DATA,
  EMAS_KUARTAL,
  EMAS_KUARTAL_BERJALAN,
  INSTRUMEN_PASAR,
  LATAR_WIDGET,
  PANDUAN_BACA,
  SIMBOL_PITA,
  SKRIP_TV,
  SUMBER_EMAS,
  angka,
  dolar,
  jadwalHari,
  persen,
  ringkasanEmas,
  statusBursa,
  teksJam,
} from '../data/pasar'
import './Pasar.css'

gsap.registerPlugin(ScrollTrigger)

const IKON_KATEGORI = { Indeks: 'rentang', Saham: 'lilin', Emas: 'koin', Kurs: 'batang' }
const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const TIPS_GRAFIK = [
  { ikon: 'kanan', judul: 'Telusuri waktu', isi: 'Tahan, lalu seret grafik ke kiri atau kanan untuk melihat harga di masa lalu.' },
  { ikon: 'perbesar', judul: 'Perbesar dan perkecil', isi: 'Gulir roda mouse di atas grafik, atau cubit dengan dua jari di layar sentuh.' },
  { ikon: 'lilin', judul: 'Ganti tampilan', isi: 'Jarak waktu ada di bagian bawah grafik. Jenis grafik dan indikator ada di bagian atas.' },
  { ikon: 'layarPenuh', judul: 'Luaskan', isi: 'Tombol layar penuh membuat grafik memenuhi layar. Keluar dengan tombol yang sama atau tekan Esc.' },
]

/* ---------- Hiasan hero: deretan lilin harga yang dibuat dari angka tetap ---------- */

const LILIN_HERO = (() => {
  let benih = 11
  const acak = () => (benih = (benih * 16807) % 2147483647) / 2147483647
  const jumlah = 56
  let harga = 100
  const mentah = Array.from({ length: jumlah }, () => {
    const buka = harga
    const tutup = buka + (acak() - 0.42) * 24
    harga = tutup
    return { buka, tutup, atas: Math.max(buka, tutup) + acak() * 11, bawah: Math.min(buka, tutup) - acak() * 11 }
  })
  const nilai = mentah.flatMap((l) => [l.atas, l.bawah])
  const rendah = Math.min(...nilai)
  const tinggi = Math.max(...nilai)
  const y = (v) => 285 - ((v - rendah) / (tinggi - rendah)) * 215
  const lebar = 1440 / jumlah
  return mentah.map((l, i) => ({
    x: lebar * i + lebar / 2,
    lebar: lebar * 0.46,
    atas: y(l.atas),
    bawah: y(l.bawah),
    badanAtas: y(Math.max(l.buka, l.tutup)),
    badanBawah: y(Math.min(l.buka, l.tutup)),
    naik: l.tutup >= l.buka,
  }))
})()

/* ---------- Kartu jam bursa ---------- */

function KartuBursa() {
  const [sekarang, setSekarang] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setSekarang(new Date()), 20000)
    return () => clearInterval(t)
  }, [])

  const status = statusBursa(sekarang)
  const jadwal = jadwalHari(sekarang)
  const sedangDalamJadwal = !jadwal.akhirPekan && jadwal.menit >= jadwal.awal && jadwal.menit < jadwal.akhir
  const posisi = sedangDalamJadwal ? ((jadwal.menit - jadwal.awal) / (jadwal.akhir - jadwal.awal)) * 100 : null
  const sesiAktif = sedangDalamJadwal ? jadwal.sesi.find((s) => jadwal.menit >= s.dari && jadwal.menit < s.sampai) : null

  return (
    <div className="ruang-bursa" data-kode={status.kode}>
      <div className="ruang-bursa__kepala">
        <p>Jam bursa saham Indonesia</p>
        <span>WIB</span>
      </div>

      <div className="ruang-bursa__status" role="status" aria-live="polite">
        <span className="ruang-bursa__titik" aria-hidden="true" />
        <div>
          <strong>{status.judul}</strong>
          <span>{status.rinci}</span>
        </div>
      </div>

      <p className="ruang-bursa__jam">
        <time>{teksJam(jadwal.menit)}</time>
        <span>{FORMAT_TANGGAL.format(sekarang)}</span>
      </p>

      <div className="ruang-garis-waktu" aria-hidden="true">
        <div className="ruang-garis-waktu__lajur">
          {jadwal.sesi.map((s) => (
            <span key={s.nama} className={`ruang-garis-waktu__sesi ruang-garis-waktu__sesi--${s.kode} ${sesiAktif?.nama === s.nama ? 'ruang-garis-waktu__sesi--aktif' : ''}`} style={{ flexGrow: s.sampai - s.dari }} />
          ))}
          {posisi !== null && <i className="ruang-garis-waktu__penanda" style={{ left: `${posisi}%` }} />}
        </div>
      </div>

      <ul className="ruang-sesi">
        {jadwal.sesi.map((s) => (
          <li key={s.nama} className={`ruang-sesi__butir ruang-sesi__butir--${s.kode} ${sesiAktif?.nama === s.nama ? 'ruang-sesi__butir--aktif' : ''}`} aria-current={sesiAktif?.nama === s.nama ? 'time' : undefined}>
            <span>{s.nama}</span>
            <span>
              {s.teksDari} sampai {s.teksSampai}
            </span>
          </li>
        ))}
      </ul>
      <p className="ruang-bursa__catatan">{jadwal.akhirPekan ? 'Akhir pekan bursa libur. Jadwal di atas berlaku Senin sampai Kamis.' : 'Hari libur nasional dan cuti bersama belum dihitung di sini.'}</p>
    </div>
  )
}

/* ---------- Ruang grafik ---------- */

function RuangGrafik() {
  const [id, setId] = useState(INSTRUMEN_PASAR[0].id)
  const aktif = INSTRUMEN_PASAR.find((i) => i.id === id) ?? INSTRUMEN_PASAR[0]
  const { ref, penuh, ganti } = useLayarPenuh()
  const barisChip = useRef(null)
  // Palet gambar di sisi kiri (alat gambar) terlalu sempit untuk layar kecil, jadi disembunyikan di sana.
  const layarKecil = useMemo(() => window.matchMedia('(max-width: 720px)').matches, [])

  const konfigurasi = useMemo(
    () => ({
      autosize: true,
      symbol: aktif.simbol,
      interval: 'D',
      range: '12M',
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      backgroundColor: LATAR_WIDGET,
      gridColor: 'rgba(246, 243, 236, 0.06)',
      hide_side_toolbar: layarKecil,
      hide_top_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      details: false,
      hotlist: false,
      withdateranges: true,
      support_host: 'https://www.tradingview.com',
    }),
    [aktif.simbol, layarKecil],
  )

  const papanKetik = (e, i) => {
    const n = INSTRUMEN_PASAR.length
    let ke = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ke = (i + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ke = (i - 1 + n) % n
    else if (e.key === 'Home') ke = 0
    else if (e.key === 'End') ke = n - 1
    if (ke === null) return
    e.preventDefault()
    setId(INSTRUMEN_PASAR[ke].id)
    // Fokus dipindah seketika (semua chip sudah ada di halaman), supaya tekanan panah berikutnya, termasuk saat tombol ditahan, dihitung dari chip yang benar.
    barisChip.current?.querySelectorAll('[role="radio"]')[ke]?.focus()
  }

  const tautanTv = `https://www.tradingview.com/symbols/${aktif.slugTv}/`

  return (
    <div className="ruang-grafik">
      <div className={`ruang-meja ${penuh ? 'ruang-meja--penuh' : ''}`} ref={ref} data-penuh={penuh ? 'ya' : 'tidak'}>
        <div className="ruang-meja__bar">
          <div className="ruang-meja__judul" key={aktif.id}>
            <span className="ruang-meja__ikon" aria-hidden="true">
              <IkonPasar nama={IKON_KATEGORI[aktif.kategori]} ukuran={22} />
            </span>
            <div className="ruang-meja__nama">
              <h3>{aktif.nama}</h3>
              <p>{aktif.panjang}</p>
              <span className={`ruang-tanda ${aktif.tunda ? 'ruang-tanda--tunda' : 'ruang-tanda--dekat'}`} title={aktif.tunda ? CATATAN_DATA.tunda : CATATAN_DATA.dekat}>
                <IkonPasar nama={aktif.tunda ? 'tunda' : 'jam'} ukuran={15} tebal={2} />
                {aktif.tunda ? 'Tertunda sekitar 15 menit' : 'Nyaris langsung'}
              </span>
            </div>
          </div>
          <div className="ruang-meja__alat">
            <a className="ruang-alat" href={tautanTv} target="_blank" rel="noopener noreferrer">
              <IkonPasar nama="luar" ukuran={18} />
              <span>
                Buka di TradingView<span className="ruang-sr"> (tab baru)</span>
              </span>
            </a>
            <button type="button" className="ruang-alat ruang-alat--utama" onClick={ganti}>
              <IkonPasar nama={penuh ? 'keluarPenuh' : 'layarPenuh'} ukuran={18} />
              <span>{penuh ? 'Keluar layar penuh' : 'Layar penuh'}</span>
            </button>
          </div>
        </div>

        <div className="ruang-chip-baris" role="radiogroup" aria-label="Pilih instrumen" ref={barisChip}>
          {INSTRUMEN_PASAR.map((it, i) => {
            const terpilih = it.id === aktif.id
            return (
              <button key={it.id} type="button" role="radio" aria-checked={terpilih} tabIndex={terpilih ? 0 : -1} className={`ruang-chip ${terpilih ? 'ruang-chip--aktif' : ''}`} onClick={() => setId(it.id)} onKeyDown={(e) => papanKetik(e, i)}>
                {it.nama}
              </button>
            )
          })}
        </div>

        <div className="ruang-meja__layar">
          <WidgetTradingView key={aktif.id} skrip={SKRIP_TV.grafik} konfigurasi={konfigurasi} varian="grafik" label={`Grafik ${aktif.panjang}`} tautanCadangan={tautanTv} />
        </div>

        <div className="ruang-meja__kaki">
          <a href={tautanTv} target="_blank" rel="noopener nofollow noreferrer">
            Grafik {aktif.nama} oleh TradingView
          </a>
          <span>Gulir untuk memperbesar, seret untuk menggeser.</span>
        </div>
      </div>

      <aside className="ruang-info" aria-label={`Tentang ${aktif.nama}`}>
        <div className="ruang-info__kartu" key={aktif.id}>
          <p className="ruang-info__kategori">{aktif.kategori}</p>
          <h3>{aktif.panjang}</h3>
          <p>{aktif.uraian}</p>
          <p className="ruang-info__data">
            <IkonPasar nama={aktif.tunda ? 'tunda' : 'jam'} ukuran={18} />
            <span>{aktif.tunda ? CATATAN_DATA.tunda : CATATAN_DATA.dekat}</span>
          </p>
          {aktif.edukasi && (
            <Link to={aktif.edukasi.ke} className="ruang-info__tautan">
              {aktif.edukasi.label}
              <IkonPasar nama="panah" ukuran={17} tebal={2} />
            </Link>
          )}
        </div>

        <div className="ruang-info__tips">
          <p className="ruang-info__judul">Bergerak di grafik</p>
          <ul>
            {TIPS_GRAFIK.map((t) => (
              <li key={t.judul}>
                <span className="ruang-info__ikon" aria-hidden="true">
                  <IkonPasar nama={t.ikon} ukuran={19} />
                </span>
                <span>
                  <strong>{t.judul}</strong>
                  {t.isi}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

/* ---------- Ilustrasi panduan membaca ---------- */

function IlustrasiBaca({ id }) {
  if (id === 'lilin') {
    return (
      <svg viewBox="0 0 240 136" aria-hidden="true" focusable="false">
        <line className="ruang-ilus__sumbu ruang-ilus__sumbu--hijau" x1="90" x2="90" y1="14" y2="104" />
        <rect className="ruang-ilus__hijau" x="76" y="36" width="28" height="50" rx="3" />
        <line className="ruang-ilus__sumbu ruang-ilus__sumbu--merah" x1="160" x2="160" y1="20" y2="110" />
        <rect className="ruang-ilus__merah" x="146" y="42" width="28" height="38" rx="3" />
        {[
          [14, 'Tertinggi'],
          [36, 'Tutup'],
          [86, 'Buka'],
          [104, 'Terendah'],
        ].map(([y, teks]) => (
          <g key={teks}>
            <line className="ruang-ilus__penunjuk" x1="64" x2="74" y1={y} y2={y} />
            <text className="ruang-ilus__teks" x="60" y={y + 4} textAnchor="end">
              {teks}
            </text>
          </g>
        ))}
        {[
          [42, 'Buka'],
          [80, 'Tutup'],
        ].map(([y, teks]) => (
          <g key={teks}>
            <line className="ruang-ilus__penunjuk" x1="176" x2="184" y1={y} y2={y} />
            <text className="ruang-ilus__teks" x="188" y={y + 4}>
              {teks}
            </text>
          </g>
        ))}
        <text className="ruang-ilus__teks ruang-ilus__teks--hijau" x="90" y="128" textAnchor="middle">
          Naik
        </text>
        <text className="ruang-ilus__teks ruang-ilus__teks--merah" x="160" y="128" textAnchor="middle">
          Turun
        </text>
      </svg>
    )
  }
  if (id === 'periode') {
    return (
      <svg viewBox="0 0 240 136" aria-hidden="true" focusable="false">
        <rect className="ruang-ilus__kotak" x="8" y="10" width="104" height="86" rx="10" />
        <rect className="ruang-ilus__kotak" x="128" y="10" width="104" height="86" rx="10" />
        <path className="ruang-ilus__garis" d="M16 54 L24 40 L31 60 L39 34 L46 64 L54 44 L62 72 L70 46 L78 76 L86 52 L94 82 L104 58" />
        <path className="ruang-ilus__garis" d="M136 82 C150 80 156 68 166 70 S184 52 192 56 S208 36 224 26" />
        <text className="ruang-ilus__teks" x="60" y="120" textAnchor="middle">
          1 hari
        </text>
        <text className="ruang-ilus__teks" x="180" y="120" textAnchor="middle">
          5 tahun
        </text>
      </svg>
    )
  }
  if (id === 'volume') {
    const tinggi = [12, 16, 10, 14, 12, 36, 44, 18, 12, 10, 26, 38, 14, 12, 10, 16]
    const sorot = new Set([5, 6, 11])
    return (
      <svg viewBox="0 0 240 136" aria-hidden="true" focusable="false">
        <path className="ruang-ilus__garis" d="M14 56 L40 50 L66 54 L92 44 L118 48 L144 30 L170 24 L196 28 L226 14" />
        {tinggi.map((t, i) => (
          <rect key={i} className={sorot.has(i) ? 'ruang-ilus__batang ruang-ilus__batang--sorot' : 'ruang-ilus__batang'} x={16 + i * 13} y={124 - t} width="8" height={t} rx="1.5" />
        ))}
        <text className="ruang-ilus__teks" x="14" y="12">
          Harga
        </text>
        <text className="ruang-ilus__teks" x="14" y="88">
          Volume
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 240 136" aria-hidden="true" focusable="false">
      <rect className="ruang-ilus__kotak" x="10" y="30" width="88" height="70" rx="12" />
      <rect className="ruang-ilus__kotak" x="142" y="30" width="88" height="70" rx="12" />
      <text className="ruang-ilus__teks" x="54" y="54" textAnchor="middle">
        Di bursa
      </text>
      <text className="ruang-ilus__angka" x="54" y="84" textAnchor="middle">
        10.15
      </text>
      <text className="ruang-ilus__teks" x="186" y="54" textAnchor="middle">
        Di grafik
      </text>
      <text className="ruang-ilus__angka ruang-ilus__angka--redup" x="186" y="84" textAnchor="middle">
        10.00
      </text>
      <line className="ruang-ilus__penunjuk ruang-ilus__penunjuk--tebal" x1="104" x2="134" y1="72" y2="72" />
      <path className="ruang-ilus__kepala" d="M130 66 L137 72 L130 78" />
      <text className="ruang-ilus__teks ruang-ilus__teks--emas" x="120" y="62" textAnchor="middle">
        15 mnt
      </text>
    </svg>
  )
}

/* ---------- Kalimat penjelas emas, dihitung dari data ---------- */

function kalimatKuartalTerbaru(r) {
  const t = r.terakhir
  if (t.dariKuartal === null) return ''
  const arah = t.dariKuartal < 0 ? 'turun' : 'naik'
  const dasar = `${t.label} ${arah} ${angka(Math.abs(t.dariKuartal))}% dari kuartal sebelumnya`
  if (t.dariTahunLalu === null) return `${dasar}.`
  const kata = t.dariKuartal < 0 && t.dariTahunLalu > 0 ? 'tetapi masih' : t.dariKuartal > 0 && t.dariTahunLalu < 0 ? 'meski masih' : 'dan'
  const banding = t.dariTahunLalu >= 0 ? 'lebih tinggi' : 'lebih rendah'
  return `${dasar}, ${kata} ${angka(Math.abs(t.dariTahunLalu))}% ${banding} dibanding ${t.pembandingTahun}.`
}

/* ---------- Halaman ---------- */

export default function Pasar() {
  const { hash } = useLocation()
  const akar = useRef(null)
  const r = useMemo(() => ringkasanEmas(), [])
  const berjalan = EMAS_KUARTAL_BERJALAN
  const jumlahSaham = INSTRUMEN_PASAR.filter((i) => i.kategori === 'Saham').length

  const posisiBerjalan = berjalan ? Math.min(100, Math.max(0, ((berjalan.akhir - berjalan.terendah) / (berjalan.tertinggi - berjalan.terendah)) * 100)) : 0

  /* ----- Animasi ----- */
  useLayoutEffect(() => {
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (kurangGerak) return
    let batal = false
    const ctx = gsap.context(() => {
      gsap.set('[data-muncul]', { autoAlpha: 0, y: 34 })
      gsap
        .timeline({ delay: 0.3, defaults: { ease: 'power4.out' } })
        .from('.ruang-hero__label, .ruang-hero__lead, .ruang-hero__aksi, .ruang-hero__daftar', { autoAlpha: 0, y: 26, duration: 0.9, stagger: 0.1 })
        .from('.ruang-hero__baris-isi', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0)
        .from('.ruang-bursa', { autoAlpha: 0, y: 50, scale: 0.95, duration: 1.2 }, 0.25)
        .from('.ruang-sesi__butir', { autoAlpha: 0, x: 18, duration: 0.7, stagger: 0.1, clearProps: 'transform' }, 0.9)

      gsap.to('.ruang-hero__grid', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.ruang-hero', start: 'top top', end: 'bottom top', scrub: true } })

      ScrollTrigger.batch('[data-muncul]', {
        start: 'top 90%',
        once: true,
        onEnter: (kelompok) => gsap.to(kelompok, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, overwrite: true, clearProps: 'transform' }),
      })
    }, akar)

    document.fonts?.ready.then(() => {
      if (!batal) ScrollTrigger.refresh()
    })
    return () => {
      batal = true
      ctx.revert()
    }
  }, [])

  /* ----- Tautan dengan #hash, misalnya /pasar#emas ----- */
  useEffect(() => {
    if (!hash) return
    // #hash yang rusak (misalnya %E0%A4%A atau karakter ilegal) tidak boleh membuat halaman galat
    let id = hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* pakai apa adanya */ }
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) gulirKe(el, -120)
    }, 450)
    return () => clearTimeout(t)
  }, [hash])

  const tiles = [
    { ikon: 'rentang', judul: `Sejak awal ${r.pertama.tahun}`, nilai: persen(r.sejakAwal, 0), isi: `Rata-rata kuartalan ${r.sejakAwal >= 0 ? 'naik' : 'turun'} dari ${dolar(r.pertama.nilai)} di ${r.pertama.label} menjadi ${dolar(r.terakhir.nilai)} di ${r.terakhir.label}.` },
    { ikon: 'naik', judul: 'Kuartal tertinggi', nilai: dolar(r.tertinggi.nilai), isi: `Dicapai pada ${r.tertinggi.label}, rata-rata tertinggi di seluruh periode ini.` },
    { ikon: 'turun', judul: 'Kuartal terendah', nilai: dolar(r.terendah.nilai), isi: `Terjadi pada ${r.terendah.label}, saat rata-ratanya paling rendah di periode ini.` },
    { ikon: 'batang', judul: 'Kuartal yang naik', nilai: `${r.naik} dari ${r.jumlahPerubahan}`, isi: `Sebanyak ${r.naik} kuartal lebih tinggi dari kuartal sebelumnya, dan ${r.turun} kuartal turun. Riwayat ini bukan jaminan ke depan.` },
  ]

  return (
    <div className="ruang" ref={akar}>
      {/* ============ HERO ============ */}
      <section className="ruang-hero" id="atas">
        <div className="ruang-hero__grid" aria-hidden="true" />
        <div className="ruang-hero__cahaya ruang-hero__cahaya--a" aria-hidden="true" />
        <div className="ruang-hero__cahaya ruang-hero__cahaya--b" aria-hidden="true" />
        <svg className="ruang-lilin" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
          {LILIN_HERO.map((l, i) => (
            <g key={i} className={`ruang-lilin__satu ${l.naik ? 'ruang-lilin__satu--naik' : 'ruang-lilin__satu--turun'}`} style={{ '--i': i }}>
              <line x1={l.x} x2={l.x} y1={l.atas} y2={l.bawah} />
              <rect x={l.x - l.lebar / 2} y={l.badanAtas} width={l.lebar} height={Math.max(2, l.badanBawah - l.badanAtas)} rx="1.5" />
            </g>
          ))}
        </svg>

        <div className="pembungkus ruang-hero__isi">
          <div className="ruang-hero__teks">
            <p className="label-seksi ruang-hero__label">Pasar</p>
            <h1 className="ruang-hero__judul">
              <span className="ruang-hero__baris">
                <span className="ruang-hero__baris-isi">Biasakan mata dengan</span>
              </span>
              <span className="ruang-hero__baris">
                <span className="ruang-hero__baris-isi">
                  <em>naik turunnya</em> harga.
                </span>
              </span>
            </h1>
            <p className="lead-seksi ruang-hero__lead">IHSG, saham besar, emas, dan kurs rupiah ada dalam satu halaman. Grafiknya bergerak sungguhan, jadi Anda bisa belajar membaca pergerakan harga sebelum uang sungguhan ikut bermain.</p>
            <div className="ruang-hero__aksi">
              <button type="button" className="tombol tombol--emas" onClick={() => gulirKe('#grafik', -110)}>
                Buka ruang grafik
                <IkonPasar nama="panah" ukuran={18} tebal={2} />
              </button>
              <button type="button" className="tombol tombol--garis" onClick={() => gulirKe('#emas', -110)}>
                Lihat emas sejak {EMAS_KUARTAL[0].tahun}
              </button>
            </div>
            <div className="ruang-hero__daftar" aria-label="Yang bisa dipantau">
              <span>Bisa dipantau</span>
              <ul>
                <li>IHSG</li>
                <li>{jumlahSaham} saham besar</li>
                <li>Emas dunia</li>
                <li>Kurs USD/IDR</li>
              </ul>
            </div>
          </div>

          <KartuBursa />
        </div>
      </section>

      {/* ============ PITA HARGA ============ */}
      <section className="ruang-pita" aria-label="Harga berjalan">
        <div className="pembungkus">
          <div className="ruang-pita__kepala">
            <p>
              <span className="ruang-pita__titik" aria-hidden="true" />
              Harga berjalan
            </p>
            <a href="https://www.tradingview.com/markets/" target="_blank" rel="noopener nofollow noreferrer">
              Pantau semua pasar di TradingView
              <IkonPasar nama="luar" ukuran={14} tebal={2} />
            </a>
          </div>
          <div className="ruang-pita__bingkai">
            <WidgetTradingView skrip={SKRIP_TV.pita} konfigurasi={{ symbols: SIMBOL_PITA, showSymbolLogo: false, colorTheme: 'dark', isTransparent: true, displayMode: 'adaptive', locale: 'id' }} varian="pita" label="Harga berjalan beberapa instrumen" tautanCadangan="https://www.tradingview.com/markets/" segera />
          </div>
        </div>
      </section>

      {/* ============ RUANG GRAFIK ============ */}
      <section className="ruang-seksi" id="grafik" aria-labelledby="judul-grafik">
        <div className="pembungkus">
          <div className="ruang-kepala" data-muncul>
            <p className="label-seksi">Ruang grafik</p>
            <h2 className="judul-seksi" id="judul-grafik">
              Pilih instrumennya, lalu telusuri sesuka Anda
            </h2>
            <p className="lead-seksi">Geser untuk menelusuri waktu, gulir untuk memperbesar, dan ganti jenis grafik atau jarak waktunya kapan saja. Butuh ruang yang lebih luas? Tekan layar penuh.</p>
          </div>
          <RuangGrafik />
        </div>
      </section>

      {/* ============ CARA MEMBACA ============ */}
      <section className="ruang-seksi ruang-seksi--terang" id="baca" aria-labelledby="judul-baca">
        <div className="pembungkus">
          <div className="ruang-kepala" data-muncul>
            <p className="label-seksi">Cara membaca</p>
            <h2 className="judul-seksi" id="judul-baca">
              Empat hal yang membuat grafik tak lagi terlihat seperti coretan
            </h2>
            <p className="lead-seksi">Tidak perlu menghafal istilah. Pahami empat hal ini, lalu kembali ke grafik di atas dan coba sendiri.</p>
          </div>
          <ul className="ruang-baca">
            {PANDUAN_BACA.map((p, i) => (
              <li className="ruang-baca__kartu" data-warna={p.warna} data-muncul key={p.id}>
                <div className="ruang-baca__gambar">
                  <IlustrasiBaca id={p.id} />
                </div>
                <span className="ruang-baca__nomor" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{p.judul}</h3>
                <p>{p.isi}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ EMAS PER KUARTAL ============ */}
      <section className="ruang-seksi" id="emas" aria-labelledby="judul-emas">
        <div className="pembungkus">
          <div className="ruang-kepala" data-muncul>
            <p className="label-seksi">Emas sejak {EMAS_KUARTAL[0].tahun}</p>
            <h2 className="judul-seksi" id="judul-emas">
              Emas dari kuartal ke kuartal
            </h2>
            <p className="lead-seksi">Grafik harian terlalu ramai untuk melihat arah besar. Di sini harga emas dunia dirata-rata tiap tiga bulan: Q1 untuk Januari sampai Maret, Q2 April sampai Juni, Q3 Juli sampai September, dan Q4 Oktober sampai Desember. Satu titik mewakili satu kuartal.</p>
          </div>

          <GrafikEmas data={r.olah} />

          <p className="ruang-emas__ringkas" data-muncul>
            {kalimatKuartalTerbaru(r)} Naik turun sesaat itu wajar. Yang menarik dilihat adalah arah dalam beberapa tahun.
          </p>

          <ul className="ruang-statistik">
            {tiles.map((t) => (
              <li className="ruang-statistik__butir" data-muncul key={t.judul}>
                <span className="ruang-statistik__ikon" aria-hidden="true">
                  <IkonPasar nama={t.ikon} ukuran={20} />
                </span>
                <p className="ruang-statistik__judul">{t.judul}</p>
                <p className="ruang-statistik__nilai">{t.nilai}</p>
                <p className="ruang-statistik__isi">{t.isi}</p>
              </li>
            ))}
          </ul>

          <div className="ruang-catatan-baris">
            {berjalan && (
              <article className="ruang-catatan ruang-catatan--berjalan" data-muncul>
                <p className="ruang-catatan__label">Kuartal yang belum masuk grafik</p>
                <h3>
                  {berjalan.judul}: {berjalan.periode}
                </h3>
                <p>
                  Rata-rata resmi kuartal ini belum tersedia, jadi belum ada titiknya di grafik. Sebagai gambaran sementara, ini rentang harga dunia selama kuartal itu. Angkanya bukan rata-rata, sehingga sengaja tidak digambar bersama titik lainnya.
                </p>
                <div className="ruang-jangkauan" style={{ '--pos': `${posisiBerjalan}%` }}>
                  <div className="ruang-jangkauan__penanda">
                    <span>Akhir kuartal</span>
                    <strong>{dolar(berjalan.akhir)}</strong>
                  </div>
                  <div className="ruang-jangkauan__lajur" aria-hidden="true">
                    <span className="ruang-jangkauan__titik" />
                  </div>
                  <div className="ruang-jangkauan__ujung">
                    <div>
                      <span>Terendah, {berjalan.tanggalTerendah}</span>
                      <strong>{dolar(berjalan.terendah, 2)}</strong>
                    </div>
                    <div>
                      <span>Tertinggi, {berjalan.tanggalTertinggi}</span>
                      <strong>{dolar(berjalan.tertinggi)}</strong>
                    </div>
                  </div>
                </div>
              </article>
            )}

            <article className="ruang-catatan" data-muncul>
              <p className="ruang-catatan__label">Sebelum membandingkan dengan harga di toko</p>
              <h3>Angkanya dalam dolar, belinya dalam rupiah</h3>
              <p>Grafik ini memakai dolar AS per troy ounce, sekitar 31,1 gram. Emas batangan di Indonesia dijual per gram dalam rupiah, jadi harganya ikut digerakkan kurs.</p>
              <p>Ada juga selisih antara harga beli dan harga jual kembali. Karena itu emas yang baru dibeli biasanya perlu naik dulu sebelum terasa impas.</p>
              <Link to="/edukasi#instrumen-emas" className="ruang-catatan__tautan">
                Pelajari emas di Edukasi
                <IkonPasar nama="panah" ukuran={17} tebal={2} />
              </Link>
            </article>
          </div>

          <p className="ruang-sumber" data-muncul>
            <span>Sumber angka kuartalan</span>
            {SUMBER_EMAS.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
                <IkonPasar nama="luar" ukuran={13} tebal={2} />
              </a>
            ))}
          </p>
        </div>
      </section>

      {/* ============ AJAKAN ============ */}
      <section className="ruang-ajakan">
        <div className="pembungkus">
          <div className="ruang-ajakan__kartu" data-muncul>
            <div className="ruang-ajakan__teks">
              <h2>Sudah akrab dengan naik turunnya harga? Kenali dulu risiko yang nyaman Anda tanggung.</h2>
              <p>Pasar akan terus bergerak. Yang bisa Anda tentukan adalah seberapa besar gerakan itu sanggup Anda hadapi. TAKAR membantu menjawabnya lewat 40 pernyataan singkat.</p>
            </div>
            <div className="ruang-ajakan__aksi">
              <Link to="/konsultasi" className="tombol tombol--emas">
                Mulai konsultasi
                <IkonPasar nama="panah" ukuran={18} tebal={2} />
              </Link>
              <Link to="/edukasi#profil" className="tombol tombol--garis">
                Pelajari profil risiko
              </Link>
            </div>
          </div>

          <div className="ruang-penafian" data-muncul>
            <span className="ruang-penafian__ikon" aria-hidden="true">
              <IkonPasar nama="info" ukuran={20} />
            </span>
            <div>
              <p className="ruang-penafian__judul">Bekal untuk belajar dan memantau pasar</p>
              <p>
                Grafik dan angka di halaman ini membantu Anda memahami pergerakan pasar sebelum mengambil keputusan sendiri. Data saham Indonesia tertunda sekitar 15 menit, dan harga dari penyedia lain bisa sedikit berbeda dari aplikasi sekuritas Anda. Grafik interaktif berasal dari TradingView dan mengikuti kebijakan mereka, termasuk cookie yang mereka pasang. Rata-rata emas per kuartal bergantung pada cara tiap lembaga menghitungnya, sehingga bisa berbeda tipis dari sumber lain.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}