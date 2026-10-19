import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import IkonEdukasi from '../components/IkonEdukasi'
import FotoHero from '../components/FotoHero'
import GambarAman from '../components/GambarAman'
import IlustrasiBerita from '../components/IlustrasiBerita'
import { DAFTAR_INSTRUMEN, LABEL_RISIKO, warnaRisiko } from '../data/edukasi'
import { gulirKe } from '../hooks/useScrollHalus'
import './Beranda.css'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/* Data isi halaman. Teks diubah di sini, tidak perlu menyentuh JSX.   */
/* ------------------------------------------------------------------ */

const STATISTIK = [
  { nilai: 40, label: 'indikator penilaian' },
  { nilai: 3, label: 'profil risiko investor' },
  { nilai: 7, label: 'instrumen investasi yang dijelaskan' },
  { teks: 'CFP', label: 'perencana keuangan bersertifikat sebagai pakar rujukan' },
]

const ANGKA_PENTING = [
  {
    nilai: 30.3,
    desimal: 1,
    sufiks: ' juta',
    uraian: 'investor pasar modal tercatat per 7 Agustus 2026, bertambah sekitar 9,9 juta sejak akhir 2025.',
    sumber: 'Sumber: KSEI',
  },
  {
    nilai: 69.57,
    desimal: 2,
    sufiks: '%',
    uraian:
      'indeks literasi keuangan nasional pada SNLIK 2026. Indeks inklusinya sudah 93,61%, jadi produk keuangan lebih luas dipakai daripada dipahami.',
    sumber: 'Sumber: OJK, LPS, dan BPS',
  },
]

const ALASAN = [
  {
    judul: 'Setiap instrumen punya karakter sendiri',
    isi: 'Deposito relatif stabil, sedangkan saham bisa naik turun tajam dalam hitungan hari. Keduanya tidak cocok untuk semua orang.',
  },
  {
    judul: 'Rasa nyaman terhadap risiko itu pribadi',
    isi: 'Dua orang dengan penghasilan yang sama bisa bereaksi sangat berbeda ketika nilai investasinya turun sepuluh persen.',
  },
  {
    judul: 'Ikut tren sering berujung menyesal',
    isi: 'Keputusan yang tidak berpijak pada profil sendiri mudah berubah menjadi panik saat pasar bergerak melawan harapan.',
  },
]

const LANGKAH = [
  {
    judul: 'Isi data diri singkat',
    isi: 'Cukup identitas dasar untuk melengkapi laporan hasil Anda. Jika ingin lebih privat, nama panggilan pun boleh.',
  },
  {
    judul: 'Jawab 40 pernyataan',
    isi: 'Untuk tiap pernyataan, pilih seberapa sesuai dengan kondisi Anda, dari Tidak sampai Sangat Sesuai.',
  },
  {
    judul: 'Sistem menghitung',
    isi: 'Naive Bayes menghitung peluang tiap profil dari seluruh jawaban. Certainty Factor memastikan seberapa yakin Anda menjawab ikut menentukan bobotnya.',
  },
  {
    judul: 'Terima hasil dan rekomendasi',
    isi: 'Anda mendapat profil risiko, persentase keyakinan sistem, daftar instrumen yang sesuai, dan laporan PDF yang bisa disimpan.',
  },
]

const PROFIL = [
  {
    kode: 'H1',
    slug: 'konservatif',
    nama: 'Konservatif',
    warna: 'teal',
    ikon: 'perisai',
    sub: 'Utamakan modal tetap aman',
    isi: 'Lebih nyaman dengan hasil yang stabil dan terukur meski kecil. Penurunan nilai investasi cepat membuat tidak tenang.',
  },
  {
    kode: 'H2',
    slug: 'moderat',
    nama: 'Moderat',
    warna: 'emas',
    ikon: 'timbang',
    sub: 'Seimbang antara aman dan tumbuh',
    isi: 'Siap menerima naik turunnya nilai dalam batas tertentu demi hasil yang lebih baik, biasanya untuk jangka menengah.',
  },
  {
    kode: 'H3',
    slug: 'agresif',
    nama: 'Agresif',
    warna: 'terakota',
    ikon: 'naik',
    sub: 'Kejar pertumbuhan setinggi mungkin',
    isi: 'Bersedia menanggung potensi rugi yang besar. Umumnya berpengetahuan memadai, berhorizon panjang, dan punya kemampuan finansial yang cukup.',
  },
]

// Delapan berita nyata, tiap kartu membuka artikel aslinya di situs sumber. Dipilih per 4 Oktober 2026.
//
// foto: daftar alamat gambar, dari yang paling diutamakan. Sumber pertama yang berhasil dimuat dipakai.
//   - Alamat https://... adalah gambar utama artikel di situs medianya (foto milik media, ditampilkan dengan kredit).
//   - Alamat yang diawali / adalah berkas Anda sendiri di folder public (lihat panduan di bawah).
//   Bila semuanya gagal, kartu menampilkan ilustrasi sesuai kategorinya, jadi tidak pernah kosong.
// Untuk mengganti foto sebuah kartu dengan foto Anda sendiri: simpan berkasnya di public/berita/, lalu taruh
// alamatnya (misalnya '/berita/foto-saya.jpg') paling depan di daftar foto kartu itu.
const BERITA = [
  {
    id: 'sid-bisnis',
    foto: ['https://images.bisnis.com/posts/2026/08/10/1994993/jibi_20042026-bi-arf-22-ihsg-3_20260420061349381_1_1779085291.jpg'],
    kategori: 'SID dan Investor',
    ikon: 'orang',
    warna: 'teal',
    judul: 'Investor pasar modal bertambah 9,9 juta sepanjang 2026',
    ringkas: 'KSEI mencatat 30,30 juta SID per 7 Agustus 2026, bertambah sekitar 9,9 juta sejak akhir 2025.',
    sumber: 'Bisnis.com',
    tanggal: '10 Agustus 2026',
    url: 'https://market.bisnis.com/read/20260810/7/1994993/jumlah-investor-pasar-modal-bertambah-99-juta-sepanjang-2026',
  },
  {
    id: 'snlik-ojk',
    foto: ['https://ojk.go.id/PublishingImages/WhatsApp%20Image%202026-08-11%20at%2019.37.49.jpeg'],
    kategori: 'Literasi Keuangan',
    ikon: 'gedung',
    warna: 'biru',
    judul: 'Hasil SNLIK 2026: literasi keuangan 69,57 persen, inklusi 93,61 persen',
    ringkas: 'Indeks literasi keuangan naik dari 66,64 persen pada 2025, dan hasil survei ini sudah melampaui target RPJMN untuk tahun 2029.',
    sumber: 'OJK',
    tanggal: '11 Agustus 2026',
    url: 'https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Hasil-SNLIK-Tahun-2026.aspx',
  },
  {
    id: 'emas-antam',
    foto: ['/berita/emas-antam.jpg'],
    kategori: 'Emas',
    ikon: 'emas',
    warna: 'emas',
    judul: 'Harga emas Antam hari ini makin tergerus',
    ringkas: 'Harga emas Antam pada Sabtu 3 Oktober 2026 tercatat Rp 2.574.000 per gram, sedangkan sejak awal tahun masih naik sekitar 3,45 persen.',
    sumber: 'Investor.id',
    tanggal: '3 Oktober 2026',
    url: 'https://investor.id/market/456506/harga-emas-antam-antm-hari-ini-sabtu-3-oktober-2026-makin-tergerus',
  },
  {
    id: 'etf-emas',
    foto: ['https://www.kabarbursa.com/assets/img/berita/b9343f222582dbd82d16dec3309c4e7388dab79f3ec9353a.webp'],
    kategori: 'Emas',
    ikon: 'emas',
    warna: 'emas',
    judul: 'Mengenal ETF emas BEI: pengertian dan cara membelinya',
    ringkas: 'ETF emas adalah reksa dana yang unitnya diperdagangkan di bursa dengan emas sebagai aset dasar. BEI meluncurkan lima produk perdananya pada 10 Agustus 2026, dan unitnya dibeli lewat perusahaan sekuritas.',
    sumber: 'KabarBursa',
    tanggal: '11 Agustus 2026',
    url: 'https://www.kabarbursa.com/market-hari-ini/mengenal-etf-emas-bei-simak-pengertian-dan-cara-belinya',
  },
  {
    id: 'ihsg-cnbc',
    foto: ['https://awsimages.detik.net.id/visual/2026/06/08/layar-menampilkan-pergerakan-indeks-harga-saham-gabungan-ihsg-di-gedung-bursa-efek-indonesia-bei-jakarta-senin-862026-cnbc-ind-1780893013438_169.jpeg?w=650&q=90'],
    kategori: 'Saham',
    ikon: 'saham',
    warna: 'terakota',
    judul: 'IHSG ditutup menguat 0,46 persen ke level 6.036',
    ringkas: 'Indeks naik 27,38 poin pada Jumat 2 Oktober 2026 setelah sempat melemah di sesi pertama.',
    sumber: 'CNBC Indonesia',
    tanggal: '2 Oktober 2026',
    url: 'https://www.cnbcindonesia.com/market/20261002161146-17-772946/ihsg-happy-weekend-menguat-046-ke-level-6036',
  },
  {
    id: 'ihsg-mingguan',
    foto: ['https://awsimages.detik.net.id/api/wm/2024/04/22/jelang-putusan-mk-ihsg-menguat-3_169.jpeg?wid=54&w=1200&v=1&t=jpeg'],
    kategori: 'Saham',
    ikon: 'saham',
    warna: 'terakota',
    judul: 'IHSG ditutup menguat ke 6.036, tetapi sepekan masih turun 3,28 persen',
    ringkas: 'Penguatan di akhir pekan belum cukup menutup tekanan sepanjang minggu. Secara mingguan, IHSG tercatat turun 3,28 persen.',
    sumber: 'detikFinance',
    tanggal: '2 Oktober 2026',
    url: 'https://finance.detik.com/bursa-dan-valas/d-8689711/sambut-akhir-pekan-ihsg-ditutup-menguat-ke-6-036',
  },
  {
    id: 'reksa-juni',
    foto: ['/berita/reksa-juni.jpg'],
    kategori: 'Reksa Dana',
    ikon: 'reksa',
    warna: 'biru',
    judul: 'Dana kelolaan reksadana Juni 2026 turun 4,79 persen jadi Rp 652,9 triliun',
    ringkas: 'Data OJK menunjukkan nilai aktiva bersih reksadana menyusut, disertai penarikan dana bersih sepanjang Juni.',
    sumber: 'Kontan',
    tanggal: '7 Juli 2026',
    url: 'https://investasi.kontan.co.id/news/dana-kelolaan-reksadana-pada-juni-2026-turun-479-jadi-rp-6529-triliun',
  },
  {
    id: 'reksa-likuiditas',
    foto: ['https://images.bisnis.com/posts/2026/07/31/1992631/hil-reksa-dana-2.jpg'],
    kategori: 'Reksa Dana',
    ikon: 'reksa',
    warna: 'biru',
    judul: 'NAB reksa dana tertekan, bersaing dengan deposito, ORI030, hingga aset dolar AS',
    ringkas: 'Reksa dana pendapatan tetap dan pasar uang mencatat arus keluar terbesar pada Juni 2026, yang menurut analis lebih dipicu persoalan likuiditas daripada kualitas produk.',
    sumber: 'Bisnis.com',
    tanggal: '31 Juli 2026',
    url: 'https://market.bisnis.com/read/20260731/92/1992631/nab-reksa-dana-rontok-bersaing-dengan-deposito-ori030-hingga-aset-dolar-as',
  },
]

// Jawaban yang cukup dengan beberapa kalimat berdiri sendiri. Yang penjelasannya panjang diringkas di sini,
// lalu diberi tautan "Selengkapnya" ke bagian terkait di halaman Edukasi atau Tentang (ke = tujuan dengan #hash).
const FAQ = [
  {
    t: 'Apakah TAKAR bisa menggantikan perencana keuangan?',
    j: 'Tidak menggantikan, tetapi sangat membantu sebagai langkah pertama. Penilaiannya bersumber dari seorang Certified Financial Planner, jadi hasilnya punya dasar yang jelas, bukan tebakan. Dalam beberapa menit Anda tahu profil risiko dan jenis instrumen yang biasanya cocok, sehingga diskusi dengan perencana keuangan nanti jauh lebih terarah. Untuk keputusan yang besar, tetap libatkan perencana secara langsung.',
  },
  {
    t: 'Apakah konsultasinya berbayar atau perlu membuat akun?',
    j: 'Tidak keduanya. Anda cukup mengisi nama, usia, pekerjaan, dan nomor WhatsApp, lalu menjawab 40 pernyataan dalam empat langkah, masing-masing sepuluh pernyataan. Setelah itu hasilnya langsung tampil dan laporan PDF-nya bisa diunduh.',
  },
  {
    t: 'Bagaimana hasilnya dihitung?',
    j: 'Setiap jawaban Anda diubah menjadi bobot keyakinan, lalu dipadukan dengan peluang tiap profil yang dinilai pakar. Naive Bayes menghitung profil mana yang paling mungkin, sedangkan Certainty Factor membuat seberapa yakin Anda ikut diperhitungkan.',
    ke: { pathname: '/tentang', hash: '#cara', label: 'Selengkapnya di Tentang' },
  },
  {
    t: 'Mengapa jawabannya berupa tingkat kesesuaian, bukan sekadar ya atau tidak?',
    j: 'Karena rasa yakin tiap orang berbeda. Jawaban Sangat Sesuai dan Sedikit Sesuai sama-sama berarti ya, tetapi bobotnya tidak sama saat dihitung.',
  },
  {
    t: 'Bagaimana jika semua jawaban saya Tidak?',
    j: 'Sistem tidak dapat menentukan profil karena belum ada kondisi yang sesuai dengan Anda. Silakan isi ulang dengan jawaban yang benar-benar mencerminkan keadaan Anda.',
  },
  {
    t: 'Apa bedanya profil Konservatif, Moderat, dan Agresif?',
    j: 'Konservatif mengutamakan keamanan dan lebih nyaman dengan nilai yang stabil. Moderat bersedia menerima naik turun yang wajar demi pertumbuhan yang lebih baik. Agresif siap menanggung gejolak besar untuk mengejar hasil yang tertinggi.',
    ke: { pathname: '/edukasi', hash: '#profil', label: 'Selengkapnya di Edukasi' },
  },
  {
    t: 'Instrumen apa yang akan disarankan TAKAR?',
    j: 'Tiap profil punya daftar instrumen yang cocok. Konservatif mendapat deposito, reksa dana pasar uang, dan emas. Moderat mendapat reksa dana pendapatan tetap, reksa dana campuran, dan emas. Agresif mendapat reksa dana saham dan saham. Daftar ini titik awal yang berguna: di halaman Edukasi, tiap instrumen dijelaskan cara kerjanya beserta hal yang perlu dicek sebelum membeli, sehingga keputusan akhirnya tetap di tangan Anda.',
    ke: { pathname: '/edukasi', hash: '#instrumen', label: 'Selengkapnya di Edukasi' },
  },
  {
    t: 'Seberapa bisa saya percaya hasilnya?',
    j: 'Hasilnya punya dasar yang kuat. Penilaiannya bersumber dari seorang Certified Financial Planner dan dihitung dengan metode yang bisa ditelusuri, yaitu Naive Bayes dan Certainty Factor. Satu hal yang perlu diingat: hasil hanya sebaik jawaban Anda, dan profil bisa berubah seiring usia, pekerjaan, serta keadaan keuangan. Jawablah dengan jujur, lalu ulangi konsultasi ketika hidup Anda berubah.',
    ke: { pathname: '/tentang', hash: '#batasan', label: 'Selengkapnya di Tentang' },
  },
  {
    t: 'Siapa pakar di balik penilaian ini?',
    j: 'Seorang Certified Financial Planner (CFP) yang diwawancarai. Beliau menilai probabilitas prior, probabilitas likelihood, dan pemetaan profil ke instrumen. Namanya tidak dicantumkan atas permintaan beliau.',
    ke: { pathname: '/tentang', hash: '#pakar', label: 'Selengkapnya di Tentang' },
  },
  {
    t: 'Apakah data saya disimpan?',
    j: 'Ya. Yang disimpan adalah nama, usia, pekerjaan, nomor WhatsApp, jawaban, hasil profil, dan waktu konsultasi, sesuai persetujuan yang Anda centang di formulir. Hanya admin yang bisa melihat riwayatnya.',
    ke: { pathname: '/tentang', hash: '#data', label: 'Selengkapnya di Tentang' },
  },
]

/* ------------------------------------------------------------------ */
/* Ikon kecil                                                          */
/* ------------------------------------------------------------------ */

const IKON = {
  perisai: <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" />,
  timbang: (
    <>
      <path d="M12 4v16M6 20h12M5 7h14" />
      <path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7zM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7z" />
    </>
  ),
  naik: <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />,
  orang: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M17 14c2.5 0 4.5 2 4.5 4.5" />
    </>
  ),
  emas: (
    <>
      <path d="M3 17l2.5-5h13L21 17z" />
      <path d="M8 12l1.5-4h5L16 12" />
    </>
  ),
  saham: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 15l3-4 3 2 5-6" />
    </>
  ),
  reksa: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v8h8" />
    </>
  ),
  gedung: (
    <>
      <path d="M3 9l9-5 9 5" />
      <path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />
    </>
  ),
}

function Ikon({ nama, ukuran = 22 }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {IKON[nama]}
    </svg>
  )
}

function Panah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Tautan() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}

// Satu kartu berita. Fotonya diambil dari sumber yang diurutkan (lihat BERITA), dan bila tak satu pun berhasil
// dimuat, yang tampil adalah ilustrasi sesuai kategori.
function KartuBerita({ b, mulai }) {
  const [asal, setAsal] = useState('')
  const saatStatus = useCallback(({ status, indeks }) => setAsal(status === 'siap' ? b.foto[indeks] : ''), [b.foto])
  const fotoMilikMedia = /^https?:/.test(asal)

  return (
    <a className="kartu-berita" data-warna={b.warna} href={b.url} target="_blank" rel="noopener noreferrer" draggable={false}>
      <div className="kartu-berita__visual" aria-hidden="true">
        <GambarAman
          sumber={b.foto}
          alt=""
          mulai={mulai}
          minimum={60}
          className="kartu-berita__foto"
          saatStatus={saatStatus}
          cadangan={({ status }) => (status === 'gagal' ? <IlustrasiBerita ikon={b.ikon} /> : <span className="kartu-berita__memuat" />)}
        />
        <span className="kartu-berita__selaput" />
        <span className="kartu-berita__kategori">
          <Ikon nama={b.ikon} ukuran={15} />
          {b.kategori}
        </span>
        {fotoMilikMedia && <span className="kartu-berita__kredit">Foto: {b.sumber}</span>}
      </div>
      <div className="kartu-berita__isi">
        <p className="kartu-berita__meta">
          {b.sumber} <span aria-hidden="true">•</span> {b.tanggal}
        </p>
        <h3>{b.judul}</h3>
        <p className="kartu-berita__ringkas">{b.ringkas}</p>
        <span className="kartu-berita__baca">
          Baca di sumber <Tautan />
          <span className="sr-saja"> (membuka tab baru)</span>
        </span>
      </div>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default function Beranda() {
  const akar = useRef(null)
  const jalur = useRef(null)
  const seret = useRef({ sedang: false, awalX: 0, awalKiri: 0, bergeser: 0 })
  const [faqBuka, setFaqBuka] = useState(0)
  const [indeksBerita, setIndeksBerita] = useState(0)
  const [muatBerita, setMuatBerita] = useState(false)
  const { hash, key } = useLocation()
  const pertamaKali = useRef(true)
  // Pewaktu untuk animasi penarik perhatian pada tombol di bagian ajakan akhir.
  const sorot = useRef({ selesai: null, tunda: null, periksa: null, menunggu: false })

  /* Semua animasi dikelompokkan dalam satu context supaya otomatis bersih saat halaman ditinggalkan. */
  useLayoutEffect(() => {
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let batal = false

    const ctx = gsap.context(() => {
      const angka = gsap.utils.toArray('[data-hitung]')
      const isiAngka = (el, v) => {
        const d = parseInt(el.dataset.desimal || '0', 10)
        el.textContent = v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
      }

      // Pengguna yang meminta gerak dikurangi langsung melihat halaman jadi, tanpa animasi.
      if (kurangGerak) {
        angka.forEach((el) => isiAngka(el, parseFloat(el.dataset.hitung)))
        return
      }

      gsap.set('[data-muncul]', { autoAlpha: 0, y: 36 })

      // Angka menghitung naik saat pertama terlihat.
      angka.forEach((el) => {
        isiAngka(el, 0)
        const o = { v: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () =>
            gsap.to(o, {
              v: parseFloat(el.dataset.hitung),
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => isiAngka(el, o.v),
            }),
        })
      })

      // Animasi pembuka, berjalan saat tirai splash masih memudar.
      gsap
        .timeline({ delay: 0.35, defaults: { ease: 'power4.out' } })
        .from('.hero__label, .hero__lead, .hero__aksi, .hero__catatan', { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.1 })
        .from('.hero__baris-isi', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0)

      // Latar hero bergeser lebih lambat dari isinya, memberi kesan kedalaman.
      gsap.to('.hero__grid', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.hero__isi', { y: -50, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '55% top', end: 'bottom 25%', scrub: true } })

      // Elemen bertanda data-muncul naik dan memudar masuk, bergantian per kelompok.
      ScrollTrigger.batch('[data-muncul]', {
        start: 'top 88%',
        once: true,
        onEnter: (kelompok) => gsap.to(kelompok, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, overwrite: true, clearProps: 'transform' }),
      })

      // Garis langkah terisi mengikuti gulir, tiap langkah menyala saat tercapai.
      gsap.to('.langkah__garis-isi', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.langkah-daftar', start: 'top 65%', end: 'bottom 70%', scrub: 0.6 },
      })
      gsap.utils.toArray('.langkah').forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 62%',
          onEnter: () => el.classList.add('langkah--aktif'),
          onLeaveBack: () => el.classList.remove('langkah--aktif'),
        }),
      )

      // Grafik ilustrasi digambar saat section Pasar terlihat.
      gsap.fromTo('.grafik-garis', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.pasar', start: 'top 65%', once: true } })
      gsap.to('.grafik-area', { opacity: 1, duration: 1.6, delay: 0.8, scrollTrigger: { trigger: '.pasar', start: 'top 65%', once: true } })

      // Garis tangga risiko tergambar dari kiri ke kanan, simpulnya menyala satu per satu.
      gsap.fromTo('.tangga__garis', { '--p': 0 }, { '--p': 1, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: '.tangga__daftar', start: 'top 82%', once: true } })
      gsap.from('.tangga__simpul', { scale: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(2.2)', clearProps: 'transform', scrollTrigger: { trigger: '.tangga__daftar', start: 'top 82%', once: true } })
    }, akar)

    // Setelah font termuat, tinggi halaman bisa berubah, jadi posisi pemicu dihitung ulang.
    document.fonts?.ready.then(() => {
      if (!batal) ScrollTrigger.refresh()
    })

    return () => {
      batal = true
      ctx.revert()
    }
  }, [])

  /* Foto berita mulai dimuat saat bagian Berita hampir terlihat (atau paling lambat beberapa detik setelah halaman dibuka),
     supaya foto sudah siap ketika kartunya digulir ke layar dan halaman awal tidak terbebani delapan foto sekaligus. */
  useEffect(() => {
    const bagian = document.getElementById('berita')
    const mulai = () => setMuatBerita(true)
    const cadangan = setTimeout(mulai, 4000)
    let pengamat
    if (bagian && 'IntersectionObserver' in window) {
      pengamat = new IntersectionObserver(
        (daftar) => {
          if (daftar.some((d) => d.isIntersecting)) mulai()
        },
        { rootMargin: '0px 0px 1200px 0px' },
      )
      pengamat.observe(bagian)
    } else {
      mulai()
    }
    return () => {
      clearTimeout(cadangan)
      pengamat?.disconnect()
    }
  }, [])

  /* ---- Ajakan akhir: tombol Mulai Konsultasi dibuat menarik perhatian ----
     Dua kelas dipasang pada bagian #mulai. cta--terlihat menyalakan gerak pelan yang berulang selama bagian itu ada di
     layar (denyut cincin, kilau, panah). cta--sorot memutar sorotan yang lebih kuat sekitar 4,5 detik: tombol membesar
     sebentar disusul cincin yang menyebar. Sorotan ini berjalan saat bagian ajakan pertama kali terlihat, dan
     setiap kali pengguna tiba di sana lewat menu Konsultasi. Semua gerak ini dimatikan bila pengguna memilih
     mengurangi gerak (CSS). */
  const sorotkanAjakan = useCallback(() => {
    const seksi = document.getElementById('mulai')
    if (!seksi || seksi.classList.contains('cta--sorot')) return
    const w = sorot.current
    clearTimeout(w.selesai)
    void seksi.offsetWidth // memastikan animasi mulai dari awal
    seksi.classList.add('cta--sorot')
    w.selesai = setTimeout(() => seksi.classList.remove('cta--sorot'), 4600)
  }, [])

  // Setelah menggulir ke ajakan lewat menu, sorotan dimulai begitu gulir berhenti dan tombol terlihat penuh.
  const sorotkanSetelahTenang = useCallback(() => {
    const w = sorot.current
    clearTimeout(w.periksa)
    w.menunggu = true
    let yLalu = -1
    let percobaan = 0
    const periksa = () => {
      const tombol = document.querySelector('#mulai .tombol')
      if (!tombol) {
        w.menunggu = false
        return
      }
      const r = tombol.getBoundingClientRect()
      const terlihat = r.top >= 64 && r.bottom <= window.innerHeight
      const diam = Math.abs(window.scrollY - yLalu) < 1
      yLalu = window.scrollY
      if ((terlihat && diam) || ++percobaan >= 45) {
        w.menunggu = false
        // Di layar yang sangat pendek tombol mungkin tidak muat penuh. Selama sebagian terlihat, sorotan tetap diputar.
        if (terlihat || (r.bottom > 64 && r.top < window.innerHeight)) sorotkanAjakan()
        return
      }
      w.periksa = setTimeout(periksa, 120)
    }
    w.periksa = setTimeout(periksa, 250)
  }, [sorotkanAjakan])

  useEffect(() => {
    const seksi = document.getElementById('mulai')
    if (!seksi) return undefined
    const w = sorot.current
    if (typeof IntersectionObserver === 'undefined') {
      seksi.classList.add('cta--terlihat')
      return () => seksi.classList.remove('cta--terlihat')
    }
    let pernah = false
    const pengamat = new IntersectionObserver(
      ([e]) => {
        seksi.classList.toggle('cta--terlihat', e.isIntersecting)
        // Saat tiba lewat menu, sorotan menunggu gulir berhenti (sorotkanSetelahTenang), jadi tidak diputar dua kali.
        if (e.isIntersecting && !pernah && !w.menunggu) {
          pernah = true
          w.tunda = setTimeout(sorotkanAjakan, 350)
        }
      },
      { threshold: 0.5 },
    )
    pengamat.observe(seksi)
    return () => {
      pengamat.disconnect()
      clearTimeout(w.tunda)
      clearTimeout(w.selesai)
      clearTimeout(w.periksa)
      w.menunggu = false
      seksi.classList.remove('cta--terlihat', 'cta--sorot')
    }
  }, [sorotkanAjakan])

  /* ---- Tautan dengan #hash, misalnya /#berita atau /#faq dari menu header dan footer ---- */
  useEffect(() => {
    // Efek ini juga jalan saat Beranda baru dibuka. Beranda yang baru dibuka diberi waktu sedikit lebih lama, supaya
    // tata letaknya sudah stabil. Bila sudah terbuka (klik menu dari Beranda itu sendiri), gulirnya langsung.
    const tunda = pertamaKali.current ? 450 : 40
    pertamaKali.current = false
    if (!hash) return undefined
    // Alamat yang dibagikan bisa saja memuat #hash rusak (misalnya potongan %). Dibaca apa adanya bila tak bisa didekode,
    // supaya halaman tidak pernah gagal tampil karena sebuah tautan.
    let id = hash.slice(1)
    try {
      id = decodeURIComponent(id)
    } catch {
      /* biarkan apa adanya */
    }
    let pewaktu
    const coba = () => {
      // Selama layar pembuka masih tampil, halaman dikunci. Tunggu sampai terbuka.
      if (document.documentElement.style.overflow === 'hidden') {
        pewaktu = setTimeout(coba, 250)
        return
      }
      // getElementById (bukan querySelector) supaya hash aneh seperti #1 atau #a.b tidak menimbulkan galat selektor.
      const el = document.getElementById(id)
      if (el) gulirKe(el, -80)
      if (el && id === 'mulai') sorotkanSetelahTenang()
    }
    pewaktu = setTimeout(coba, tunda)
    return () => {
      clearTimeout(pewaktu)
      clearTimeout(sorot.current.periksa)
      sorot.current.menunggu = false
    }
    // key ikut dipantau supaya mengeklik tautan yang sama dua kali tetap menggulir.
  }, [hash, key, sorotkanSetelahTenang])

  /* ---- Karusel berita: geser dengan jari, mouse (tarik), tombol panah, atau titik ---- */
  const jarakKartu = () => {
    const kartu = jalur.current?.querySelector('.kartu-berita')
    return kartu ? kartu.getBoundingClientRect().width + 24 : 0
  }

  const saatGulirJalur = useCallback(() => {
    const el = jalur.current
    const jarak = jarakKartu()
    if (!el || !jarak) return
    const diUjung = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    const i = diUjung ? BERITA.length - 1 : Math.round(el.scrollLeft / jarak)
    setIndeksBerita(Math.min(BERITA.length - 1, Math.max(0, i)))
  }, [])

  const keBerita = (i) => jalur.current?.scrollTo({ left: i * jarakKartu(), behavior: 'smooth' })
  const geserBerita = (arah) => jalur.current?.scrollBy({ left: arah * jarakKartu(), behavior: 'smooth' })

  const mulaiSeret = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    seret.current = { sedang: true, awalX: e.clientX, awalKiri: jalur.current.scrollLeft, bergeser: 0 }
    jalur.current.classList.add('berita__jalur--seret')
  }
  const saatSeret = (e) => {
    const s = seret.current
    if (!s.sedang) return
    const dx = e.clientX - s.awalX
    s.bergeser = Math.max(s.bergeser, Math.abs(dx))
    jalur.current.scrollLeft = s.awalKiri - dx
  }
  const akhiriSeret = () => {
    const s = seret.current
    if (!s.sedang) return
    s.sedang = false
    const el = jalur.current
    el.classList.remove('berita__jalur--seret')
    const jarak = jarakKartu()
    if (jarak) el.scrollTo({ left: Math.round(el.scrollLeft / jarak) * jarak, behavior: 'smooth' })
  }
  // Setelah menarik karusel, lepas klik tidak boleh ikut membuka artikel.
  const cegahKlikSetelahSeret = (e) => {
    if (seret.current.bergeser > 6) {
      e.preventDefault()
      seret.current.bergeser = 0
    }
  }

  return (
    <div className="beranda" ref={akar}>
      {/* ============ HERO ============ */}
      <section className="hero" id="hero">
        <div className="hero__latar" aria-hidden="true">
          <div className="hero__cahaya hero__cahaya--emas" />
          <div className="hero__cahaya hero__cahaya--teal" />
          <div className="hero__grid" />
          <svg className="hero__grafik" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradGrafikHero" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#4db3c6" />
                <stop offset="0.55" stopColor="#ecb54e" />
                <stop offset="1" stopColor="#e8836b" />
              </linearGradient>
            </defs>
            <path
              className="hero__grafik-garis"
              pathLength="1"
              d="M0,260 C120,240 200,280 320,230 S520,180 640,205 S860,120 980,150 S1220,70 1440,40"
            />
          </svg>
        </div>

        <div className="pembungkus hero__isi">
          <div className="hero__teks">
            <p className="hero__label">Sistem pakar profil risiko investor</p>
            <h1 className="hero__judul">
              <span className="hero__baris">
                <span className="hero__baris-isi">Kenali seberapa besar</span>
              </span>
              <span className="hero__baris">
                <span className="hero__baris-isi">
                  risiko yang <em>nyaman</em>
                </span>
              </span>
              <span className="hero__baris">
                <span className="hero__baris-isi">Anda tanggung.</span>
              </span>
            </h1>
            <p className="hero__lead">
              TAKAR membaca jawaban Anda atas 40 pernyataan singkat, lalu menyimpulkan apakah Anda lebih cocok sebagai investor
              konservatif, moderat, atau agresif, lengkap dengan instrumen yang sesuai. Penilaiannya disusun bersama Certified Financial
              Planner dan dihitung dengan metode Naive Bayes dan Certainty Factor.
            </p>
            <div className="hero__aksi">
              <Link to="/konsultasi" className="tombol tombol--emas">
                Mulai Konsultasi <Panah />
              </Link>
              <button type="button" className="tombol tombol--garis" onClick={() => gulirKe('#cara-kerja')}>
                Lihat Cara Kerjanya
              </button>
            </div>
            <p className="hero__catatan">Gratis dan tanpa akun. Cukup luangkan beberapa menit.</p>
          </div>

          <div className="hero__visual">
            <FotoHero />
          </div>
        </div>

        <button type="button" className="hero__gulir" onClick={() => gulirKe('#angka')} aria-label="Gulir ke bawah">
          <span>Gulir</span>
          <i />
        </button>
      </section>

      {/* ============ ANGKA RINGKAS ============ */}
      <section className="angka" id="angka" aria-label="TAKAR dalam angka">
        <div className="pembungkus angka__daftar">
          {STATISTIK.map((s) => (
            <div className="angka__item" data-muncul key={s.label}>
              <p className="angka__nilai">{s.teks ? s.teks : <span data-hitung={s.nilai} data-desimal="0" />}</p>
              <p className="angka__label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MENGAPA PENTING ============ */}
      <section className="mengapa seksi" id="mengapa">
        <div className="mengapa__latar" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="pembungkus">
          <div className="kepala-seksi" data-muncul>
            <p className="label-seksi">Mengapa penting</p>
            <h2 className="judul-seksi">Investor makin banyak, pemahaman soal risiko belum tentu ikut naik</h2>
            <p className="lead-seksi">
              Banyak orang mulai berinvestasi karena melihat teman atau media sosial. Padahal tiap instrumen punya risiko yang berbeda,
              dan rasa nyaman terhadap risiko itu sangat pribadi.
            </p>
          </div>

          <div className="mengapa__angka">
            {ANGKA_PENTING.map((a) => (
              <div className="kartu-angka" data-muncul key={a.sumber}>
                <p className="kartu-angka__nilai">
                  <span data-hitung={a.nilai} data-desimal={a.desimal} />
                  <small>{a.sufiks}</small>
                </p>
                <p className="kartu-angka__uraian">{a.uraian}</p>
                <p className="kartu-angka__sumber">{a.sumber}</p>
              </div>
            ))}
          </div>

          <div className="mengapa__poin">
            {ALASAN.map((a, i) => (
              <div className="poin" data-muncul key={a.judul}>
                <span className="poin__nomor">0{i + 1}</span>
                <h3>{a.judul}</h3>
                <p>{a.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CARA KERJA ============ */}
      <section className="cara seksi" id="cara-kerja">
        <div className="pembungkus cara__grid">
          <div className="cara__kepala" data-muncul>
            <p className="label-seksi">Cara kerja</p>
            <h2 className="judul-seksi">Empat langkah sampai hasil di tangan Anda</h2>
            <p className="lead-seksi">Tidak perlu paham istilah investasi. Cukup jawab sesuai keadaan Anda yang sebenarnya, sisanya dikerjakan sistem.</p>
            <Link to="/konsultasi" className="tombol tombol--emas cara__tombol">
              Mulai Konsultasi <Panah />
            </Link>
          </div>

          <div className="langkah-daftar">
            <div className="langkah__garis" aria-hidden="true">
              <span className="langkah__garis-isi" />
            </div>
            <ol>
              {LANGKAH.map((l, i) => (
                <li className="langkah" key={l.judul}>
                  <span className="langkah__nomor">0{i + 1}</span>
                  <h3>{l.judul}</h3>
                  <p>{l.isi}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ============ TIGA PROFIL ============ */}
      <section className="profil seksi" id="profil">
        <div className="pembungkus">
          <div className="kepala-seksi" data-muncul>
            <p className="label-seksi">Profil risiko</p>
            <h2 className="judul-seksi">Tiga profil, tiga cara memandang risiko</h2>
            <p className="lead-seksi">Tidak ada profil yang lebih benar. Yang penting, pilihan investasi Anda sesuai dengan watak Anda sendiri.</p>
          </div>
          <div className="profil__grid">
            {PROFIL.map((p) => (
              <article className="kartu-profil" data-warna={p.warna} data-muncul key={p.nama}>
                <div className="kartu-profil__ikon">
                  <Ikon nama={p.ikon} ukuran={26} />
                </div>
                <p className="kartu-profil__kode">{p.kode}</p>
                <h3>{p.nama}</h3>
                <p className="kartu-profil__sub">{p.sub}</p>
                <p className="kartu-profil__isi">{p.isi}</p>
                <Link to={{ pathname: '/edukasi', hash: `#profil-${p.slug}` }} className="kartu-profil__lanjut" aria-label={`Baca selengkapnya tentang profil ${p.nama}`}>
                  Baca selengkapnya <Panah />
                </Link>
              </article>
            ))}
          </div>
          <p className="profil__catatan" data-muncul>
            Ingin tahu apa bedanya saat pasar turun, berapa lama waktu yang nyaman, dan apa yang perlu diwaspadai?{' '}
            <Link to={{ pathname: '/edukasi', hash: '#profil' }}>Lihat perbandingan lengkapnya</Link>
          </p>
        </div>
      </section>

      {/* ============ INSTRUMEN (ringkas, penjelasan lengkap ada di halaman Edukasi) ============ */}
      <section className="instrumen instrumen--ringkas seksi" id="instrumen">
        <div className="pembungkus">
          <div className="kepala-seksi" data-muncul>
            <p className="label-seksi">Instrumen investasi</p>
            <h2 className="judul-seksi">Dari deposito yang tenang sampai saham yang berani</h2>
            <p className="lead-seksi">Ini peta singkat tujuh instrumen yang dibahas TAKAR, diurutkan dari risiko terendah. Pilih salah satu untuk membaca cara kerjanya dan hal yang perlu dicek sebelum membeli.</p>
          </div>

          <div className="tangga">
            <div className="tangga__ujung" aria-hidden="true">
              <span className="tangga__ujung-kiri">Lebih tenang</span>
              <span className="tangga__ujung-kanan">Lebih berani</span>
            </div>
            <div className="tangga__rangka">
              <div className="tangga__garis" aria-hidden="true">
                <span className="tangga__garis-isi" />
              </div>
              <ol className="tangga__daftar">
                {DAFTAR_INSTRUMEN.map((it) => (
                  <li className="tangga__butir" data-warna={warnaRisiko(it.risiko)} data-muncul key={it.slug}>
                    <Link to={{ pathname: '/edukasi', hash: `#instrumen-${it.slug}` }} className="tangga__tautan">
                      <span className="tangga__simpul" aria-hidden="true" />
                      <span className="tangga__ikon">
                        <IkonEdukasi nama={it.ikon} ukuran={22} />
                      </span>
                      <span className="tangga__teks">
                        <span className="tangga__nama">{it.nama}</span>
                        <span className="tangga__risiko">Risiko {LABEL_RISIKO[it.risiko].toLowerCase()}</span>
                      </span>
                      <span className="tangga__panah" aria-hidden="true">
                        <Tautan />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="instrumen__aksi" data-muncul>
            <Link to={{ pathname: '/edukasi', hash: '#instrumen' }} className="tombol tombol--garis">
              Kenali tiap instrumen <Panah />
            </Link>
            <p>Tingkat risiko di sini bersifat relatif antar instrumen, bukan angka pasti.</p>
          </div>
        </div>
      </section>

      {/* ============ PASAR ============ */}
      <section className="pasar seksi" id="pasar">
        <div className="pembungkus pasar__grid">
          <div data-muncul>
            <p className="label-seksi">Pasar</p>
            <h2 className="judul-seksi">Pantau pergerakan pasar di satu tempat</h2>
            <p className="lead-seksi">
              Lihat grafik harga emas, IHSG, dan saham pilihan supaya keputusan Anda berpijak pada kondisi terkini, bukan kabar dari mulut ke mulut.
            </p>
            <div className="chip-daftar pasar__chip">
              <span className="chip">Emas</span>
              <span className="chip">IHSG</span>
              <span className="chip">Saham pilihan</span>
            </div>
            <Link to="/pasar" className="tombol tombol--garis pasar__tombol">
              Buka Halaman Pasar <Panah />
            </Link>
          </div>

          <div className="kartu-grafik" data-muncul>
            <span className="kartu-grafik__tanda">Ilustrasi</span>
            <svg viewBox="0 0 600 320" role="img" aria-label="Ilustrasi grafik harga yang bergerak naik">
              <defs>
                <linearGradient id="gradPasar" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#4db3c6" />
                  <stop offset="0.6" stopColor="#ecb54e" />
                  <stop offset="1" stopColor="#f0cd82" />
                </linearGradient>
                <linearGradient id="areaPasar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#ecb54e" stopOpacity="0.32" />
                  <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="grafik-grid">
                {[60, 130, 200, 270].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} />
                ))}
              </g>
              <path className="grafik-area" d="M0,250 C60,230 90,260 150,220 S250,150 310,175 S420,90 480,110 S560,50 600,40 L600,320 L0,320 Z" />
              <path className="grafik-garis" pathLength="1" d="M0,250 C60,230 90,260 150,220 S250,150 310,175 S420,90 480,110 S560,50 600,40" />
            </svg>
            <p className="kartu-grafik__catatan">Ini hanya ilustrasi. Grafik sungguhan ada di halaman Pasar.</p>
          </div>
        </div>
      </section>

      {/* ============ BERITA ============ */}
      <section className="berita seksi" id="berita">
        <div className="pembungkus berita__kepala" data-muncul>
          <div>
            <p className="label-seksi">Kabar terbaru</p>
            <h2 className="judul-seksi">Berita pasar modal yang perlu Anda ikuti</h2>
            <p className="lead-seksi">
              Delapan berita pilihan tentang SID, emas, saham, dan reksa dana. Geser untuk melihat lainnya, lalu klik kartu untuk membukanya di situs sumber.
            </p>
          </div>
          <div className="berita__panah">
            <button type="button" aria-label="Berita sebelumnya" onClick={() => geserBerita(-1)} disabled={indeksBerita === 0}>
              <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                <Panah />
              </span>
            </button>
            <button type="button" aria-label="Berita berikutnya" onClick={() => geserBerita(1)} disabled={indeksBerita === BERITA.length - 1}>
              <Panah />
            </button>
          </div>
        </div>

        <div
          className="berita__jalur"
          ref={jalur}
          data-muncul
          onScroll={saatGulirJalur}
          onPointerDown={mulaiSeret}
          onPointerMove={saatSeret}
          onPointerUp={akhiriSeret}
          onPointerLeave={akhiriSeret}
          onPointerCancel={akhiriSeret}
          onClickCapture={cegahKlikSetelahSeret}
        >
          {BERITA.map((b) => (
            <KartuBerita key={b.id} b={b} mulai={muatBerita} />
          ))}
        </div>

        <div className="pembungkus">
          <div className="titik-daftar">
            {BERITA.map((b, i) => (
              <button key={b.id} type="button" aria-label={`Ke berita ${i + 1}`} className={`titik ${i === indeksBerita ? 'titik--aktif' : ''}`} onClick={() => keBerita(i)} />
            ))}
          </div>
          <p className="berita__catatan">Berita dipilih per 4 Oktober 2026 dari media dan siaran pers resmi. Foto dan artikel adalah milik media sumbernya.</p>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="faq seksi" id="faq">
        <div className="pembungkus">
          <div className="kepala-seksi kepala-seksi--tengah" data-muncul>
            <p className="label-seksi">Pertanyaan umum</p>
            <h2 className="judul-seksi">Hal yang sering ditanyakan</h2>
          </div>
          <div className="faq__daftar" data-muncul>
            {FAQ.map((f, i) => (
              <div className={`faq__butir ${faqBuka === i ? 'faq__butir--buka' : ''}`} key={f.t}>
                <h3>
                  <button type="button" className="faq__tanya" aria-expanded={faqBuka === i} onClick={() => setFaqBuka(faqBuka === i ? -1 : i)}>
                    <span>{f.t}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </h3>
                <div className="faq__isi" inert={faqBuka !== i}>
                  <div className="faq__isi-dalam">
                    <p>{f.j}</p>
                    {f.ke && (
                      <Link to={{ pathname: f.ke.pathname, hash: f.ke.hash }} className="faq__lanjut">
                        {f.ke.label} <Panah />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AJAKAN AKHIR ============ */}
      <section className="cta" id="mulai">
        <div className="pembungkus cta__isi" data-muncul>
          <h2>Siap mengenali profil risiko Anda?</h2>
          <p>Luangkan beberapa menit, jawab dengan jujur, dan lihat instrumen mana yang paling sesuai untuk Anda.</p>
          <div className="cta__aksi">
            <Link to="/konsultasi" className="tombol tombol--navy tombol--sorot">
              Mulai Konsultasi <Panah />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}