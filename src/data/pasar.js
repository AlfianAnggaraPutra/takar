// Data dan teks halaman Pasar. Semua angka emas dan simbol widget ada di sini, jadi memperbarui
// halaman cukup mengubah berkas ini, tanpa menyentuh tampilan.

/* ---------- Widget TradingView ---------- */

export const SKRIP_TV = {
  grafik: 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
  pita: 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js',
}

// Warna latar widget disamakan dengan --laut-900 di index.css supaya menyatu dengan bingkai.
export const LATAR_WIDGET = '#0a1f33'

// Daftar instrumen yang bisa dipilih di ruang grafik.
//  simbol : penulisan simbol di TradingView (BURSA:KODE). Dipakai untuk widget grafik sekaligus untuk
//           tautan "Buka di TradingView", yang langsung membuka grafik instrumen ini. Bila satu simbol
//           ternyata tidak tampil di widget, cukup ganti nilainya di sini.
//  tunda  : true bila data gratisnya tertunda (bursa Indonesia).
//  edukasi: bagian di halaman Edukasi yang menjelaskan instrumennya (atau null).
export const INSTRUMEN_PASAR = [
  {
    id: 'ihsg',
    nama: 'IHSG',
    panjang: 'Indeks Harga Saham Gabungan',
    kategori: 'Indeks',
    simbol: 'IDX:COMPOSITE',
    tunda: true,
    uraian:
      'Satu angka yang merangkum naik turunnya seluruh saham di Bursa Efek Indonesia. Saat IHSG hijau, sebagian besar saham sedang menguat. IHSG sendiri tidak bisa dibeli, tetapi arahnya sering dipakai sebagai pembanding kinerja reksa dana saham.',
    edukasi: { ke: '/edukasi#instrumen-reksa-dana-saham', label: 'Reksa dana saham di Edukasi' },
  },
  {
    id: 'bbca',
    nama: 'BBCA',
    panjang: 'Bank Central Asia',
    kategori: 'Saham',
    simbol: 'IDX:BBCA',
    tunda: true,
    uraian: 'Bank swasta besar di Indonesia. Sahamnya termasuk berkapitalisasi besar dan sering dipantau sebagai gambaran sektor perbankan.',
    edukasi: { ke: '/edukasi#instrumen-saham', label: 'Saham di Edukasi' },
  },
  {
    id: 'bbri',
    nama: 'BBRI',
    panjang: 'Bank Rakyat Indonesia',
    kategori: 'Saham',
    simbol: 'IDX:BBRI',
    tunda: true,
    uraian: 'Bank BUMN yang dikenal lewat jaringan unit hingga ke daerah dan pembiayaan usaha mikro. Sahamnya termasuk berkapitalisasi besar.',
    edukasi: { ke: '/edukasi#instrumen-saham', label: 'Saham di Edukasi' },
  },
  {
    id: 'bmri',
    nama: 'BMRI',
    panjang: 'Bank Mandiri',
    kategori: 'Saham',
    simbol: 'IDX:BMRI',
    tunda: true,
    uraian: 'Salah satu bank BUMN terbesar, melayani nasabah korporasi sekaligus ritel. Berguna sebagai pembanding bila Anda ingin melihat sesama bank besar.',
    edukasi: { ke: '/edukasi#instrumen-saham', label: 'Saham di Edukasi' },
  },
  {
    id: 'tlkm',
    nama: 'TLKM',
    panjang: 'Telkom Indonesia',
    kategori: 'Saham',
    simbol: 'IDX:TLKM',
    tunda: true,
    uraian: 'Perusahaan telekomunikasi BUMN dengan layanan seluler, internet, dan data. Contoh baik untuk melihat saham di luar perbankan.',
    edukasi: { ke: '/edukasi#instrumen-saham', label: 'Saham di Edukasi' },
  },
  {
    id: 'asii',
    nama: 'ASII',
    panjang: 'Astra International',
    kategori: 'Saham',
    simbol: 'IDX:ASII',
    tunda: true,
    uraian: 'Grup usaha besar yang bergerak di otomotif, alat berat dan pertambangan, jasa keuangan, serta agribisnis. Gerakannya sering ikut dipengaruhi harga komoditas.',
    edukasi: { ke: '/edukasi#instrumen-saham', label: 'Saham di Edukasi' },
  },
  {
    id: 'emas',
    nama: 'Emas',
    panjang: 'Emas dunia (XAU/USD)',
    kategori: 'Emas',
    simbol: 'OANDA:XAUUSD',
    tunda: false,
    uraian:
      'Harga emas dunia dalam dolar AS per troy ounce, sekitar 31,1 gram. Inilah patokan pasar global. Harga emas batangan di Indonesia mengikutinya, lalu dikonversi ke rupiah per gram dan ditambah selisih jual beli.',
    edukasi: { ke: '/edukasi#instrumen-emas', label: 'Emas di Edukasi' },
  },
  {
    id: 'kurs',
    nama: 'USD/IDR',
    panjang: 'Dolar AS terhadap rupiah',
    kategori: 'Kurs',
    simbol: 'FX_IDC:USDIDR',
    tunda: false,
    uraian:
      'Berapa rupiah yang dibutuhkan untuk satu dolar AS. Rupiah melemah berarti angkanya naik. Kurs ikut menggerakkan harga emas dalam rupiah dan saham perusahaan yang banyak mengimpor atau mengekspor.',
    edukasi: null,
  },
]

export const CATATAN_DATA = {
  tunda: 'Data saham Indonesia di TradingView gratis tertunda sekitar 15 menit. Cukup untuk belajar dan memantau arah.',
  dekat: 'Bergerak hampir sepanjang hari kerja. Data dari penyedia TradingView, jadi bisa terlambat beberapa saat dari aplikasi broker Anda.',
}

// Strip harga berjalan di bawah hero.
export const SIMBOL_PITA = [
  { proName: 'IDX:COMPOSITE', title: 'IHSG' },
  { proName: 'FX_IDC:USDIDR', title: 'USD/IDR' },
  { proName: 'OANDA:XAUUSD', title: 'Emas' },
  { proName: 'IDX:BBCA', title: 'BBCA' },
  { proName: 'IDX:BBRI', title: 'BBRI' },
  { proName: 'IDX:BMRI', title: 'BMRI' },
  { proName: 'IDX:TLKM', title: 'TLKM' },
  { proName: 'IDX:ASII', title: 'ASII' },
]

/* ---------- Jam bursa (WIB) ---------- */

// Jam reguler Bursa Efek Indonesia, dalam menit sejak tengah malam waktu Jakarta.
// Senin sampai Kamis: sesi I 09.00 sampai 12.00, sesi II 13.30 sampai 15.49. Jumat: 09.00 sampai 11.30 dan 14.00 sampai 15.49.
// Pra-pembukaan 08.45 sampai 08.59, pra-penutupan 15.50 sampai 16.15. Hari libur bursa tidak dihitung.
const m = (jam, menit = 0) => jam * 60 + menit
const JADWAL = {
  reguler: [
    [m(8, 45), m(9), 'pra-buka'],
    [m(9), m(12), 'buka'],
    [m(12), m(13, 30), 'istirahat'],
    [m(13, 30), m(15, 50), 'buka'],
    [m(15, 50), m(16, 15), 'pra-tutup'],
  ],
  jumat: [
    [m(8, 45), m(9), 'pra-buka'],
    [m(9), m(11, 30), 'buka'],
    [m(11, 30), m(14), 'istirahat'],
    [m(14), m(15, 50), 'buka'],
    [m(15, 50), m(16, 15), 'pra-tutup'],
  ],
}

const JUDUL_STATUS = {
  buka: 'Bursa sedang buka',
  istirahat: 'Istirahat siang',
  'pra-buka': 'Menjelang pembukaan',
  'pra-tutup': 'Menjelang penutupan',
  tutup: 'Bursa sedang tutup',
}

const HARI = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }

// Hari (0 = Minggu) dan menit sejak tengah malam, dibaca dengan zona waktu Jakarta
// di mana pun perangkat Anda berada.
export function waktuJakarta(waktu = new Date()) {
  const bagian = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(waktu)
  const ambil = (jenis) => bagian.find((b) => b.type === jenis)?.value
  return { hari: HARI[ambil('weekday')], menit: Number(ambil('hour')) * 60 + Number(ambil('minute')) }
}

const dua = (n) => String(n).padStart(2, '0')
export const teksJam = (menit) => `${dua(Math.floor(menit / 60))}.${dua(menit % 60)}`

const NAMA_SESI = { 'pra-buka': 'Pra-pembukaan', 'pra-tutup': 'Pra-penutupan', istirahat: 'Istirahat' }

// Susunan sesi hari itu untuk digambar sebagai garis waktu. Batas akhir yang ditulis untuk pra-pembukaan
// dan sesi terakhir adalah menit sebelum angka tepat (08.59 dan 15.49), sesuai penulisan resmi bursa.
export function jadwalHari(waktu = new Date()) {
  const { hari, menit } = waktuJakarta(waktu)
  const akhirPekan = hari === 0 || hari === 6
  const dasar = hari === 5 ? JADWAL.jumat : JADWAL.reguler
  let sesiKe = 0
  const sesi = dasar.map(([dari, sampai, kode]) => {
    const nama = kode === 'buka' ? (++sesiKe === 1 ? 'Sesi I' : 'Sesi II') : NAMA_SESI[kode]
    const akhirTampil = kode === 'pra-buka' || (kode === 'buka' && sampai === m(15, 50)) ? sampai - 1 : sampai
    return { kode, nama, dari, sampai, teksDari: teksJam(dari), teksSampai: teksJam(akhirTampil) }
  })
  return { hari, menit, akhirPekan, sesi, awal: dasar[0][0], akhir: dasar[dasar.length - 1][1] }
}

// Mengembalikan { kode, judul, rinci } untuk waktu tertentu (bawaan: sekarang).
export function statusBursa(waktu = new Date()) {
  const { hari, menit } = waktuJakarta(waktu)
  const akhirPekan = hari === 0 || hari === 6

  if (!akhirPekan) {
    const jadwal = hari === 5 ? JADWAL.jumat : JADWAL.reguler
    const sesi = jadwal.find(([dari, sampai]) => menit >= dari && menit < sampai)
    if (sesi) {
      const kode = sesi[2]
      const rinci = {
        buka: 'Harga saham sedang diperdagangkan.',
        istirahat: hari === 5 ? 'Sesi II dimulai pukul 14.00 WIB.' : 'Sesi II dimulai pukul 13.30 WIB.',
        'pra-buka': 'Perdagangan dimulai pukul 09.00 WIB.',
        'pra-tutup': 'Harga penutupan sedang dibentuk.',
      }[kode]
      return { kode, judul: JUDUL_STATUS[kode], rinci }
    }
  }

  // Di luar jam: tulis kapan buka lagi.
  let rinci
  if (!akhirPekan && menit < m(8, 45)) rinci = 'Buka hari ini pukul 09.00 WIB.'
  else if (hari === 5 || hari === 6 || hari === 0) rinci = 'Buka lagi Senin pukul 09.00 WIB.'
  else rinci = 'Buka lagi besok pukul 09.00 WIB.'
  return { kode: 'tutup', judul: JUDUL_STATUS.tutup, rinci }
}

/* ---------- Emas per kuartal ---------- */

// Rata-rata harga LBMA Gold Price PM tiap kuartal, dalam dolar AS per troy ounce.
// Sumber: World Gold Council, laporan Gold Demand Trends (Tabel 1 tiap laporan). Angka yang muncul di lebih
// dari satu laporan sudah dicocokkan. Untuk menambah kuartal baru, tambahkan satu baris di akhir daftar.
export const EMAS_KUARTAL = [
  { tahun: 2022, kuartal: 1, nilai: 1877.2 },
  { tahun: 2022, kuartal: 2, nilai: 1870.6 },
  { tahun: 2022, kuartal: 3, nilai: 1728.9 },
  { tahun: 2022, kuartal: 4, nilai: 1725.9 },
  { tahun: 2023, kuartal: 1, nilai: 1889.9 },
  { tahun: 2023, kuartal: 2, nilai: 1975.9 },
  { tahun: 2023, kuartal: 3, nilai: 1928.5 },
  { tahun: 2023, kuartal: 4, nilai: 1971.5 },
  { tahun: 2024, kuartal: 1, nilai: 2069.8 },
  { tahun: 2024, kuartal: 2, nilai: 2338.2 },
  { tahun: 2024, kuartal: 3, nilai: 2474.3 },
  { tahun: 2024, kuartal: 4, nilai: 2663.4 },
  { tahun: 2025, kuartal: 1, nilai: 2859.6 },
  { tahun: 2025, kuartal: 2, nilai: 3280.4 },
  { tahun: 2025, kuartal: 3, nilai: 3456.5 },
  { tahun: 2025, kuartal: 4, nilai: 4135.2 },
  { tahun: 2026, kuartal: 1, nilai: 4872.9 },
  { tahun: 2026, kuartal: 2, nilai: 4506.3 },
]

// Kuartal yang sedang atau baru berjalan dan belum punya rata-rata resmi. Bukan rata-rata, jadi tidak digambar di grafik.
export const EMAS_KUARTAL_BERJALAN = {
  judul: 'Q3 2026',
  periode: 'Juli sampai September 2026',
  akhir: 4176.3,
  tertinggi: 4663.7,
  tanggalTertinggi: '24 Agustus',
  terendah: 3978.55,
  tanggalTerendah: '1 Juli',
  terbit: '14 Oktober 2026',
}

export const SUMBER_EMAS = [
  { label: 'World Gold Council, Gold Demand Trends Q2 2026', url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-q2-2026' },
  { label: 'World Gold Council, Gold Demand Trends Q1 2025', url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-q1-2025' },
  { label: 'World Gold Council, Gold Demand Trends Q1 2023', url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-q1-2023' },
  { label: 'LBMA, Precious Metals Market Report Q3 2026', url: 'https://www.lbma.org.uk/articles/lbma-precious-metals-market-report-q3-2026' },
]

/* ---------- Format dan hitungan ---------- */

const formatAngka = (digit) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: digit, maximumFractionDigits: digit })
const F1 = formatAngka(1)
const F2 = formatAngka(2)
const F0 = formatAngka(0)

export const angka = (v, digit = 1) => (digit === 0 ? F0 : digit === 2 ? F2 : F1).format(v)
export const dolar = (v, digit = 1) => `US$${angka(v, digit)}`
export const persen = (v, digit = 1) => `${v > 0 ? '+' : ''}${angka(v, digit)}%`
export const namaKuartal = (t) => `Q${t.kuartal} ${t.tahun}`
export const ubahPersen = (dari, ke) => ((ke - dari) / dari) * 100

// Perubahan tiap kuartal terhadap kuartal sebelumnya dan terhadap kuartal yang sama tahun lalu.
export function olahEmas(data = EMAS_KUARTAL) {
  return data.map((t, i) => {
    const sebelum = i > 0 ? data[i - 1] : null
    const tahunLalu = data.find((x) => x.tahun === t.tahun - 1 && x.kuartal === t.kuartal) ?? null
    return {
      ...t,
      indeks: i,
      label: namaKuartal(t),
      dariKuartal: sebelum ? ubahPersen(sebelum.nilai, t.nilai) : null,
      dariTahunLalu: tahunLalu ? ubahPersen(tahunLalu.nilai, t.nilai) : null,
      pembandingTahun: tahunLalu ? namaKuartal(tahunLalu) : null,
    }
  })
}

// Ringkasan angka yang dipakai kartu statistik dan kalimat penjelas, dihitung dari data supaya tidak pernah melenceng.
export function ringkasanEmas(data = EMAS_KUARTAL) {
  const olah = olahEmas(data)
  const pertama = olah[0]
  const terakhir = olah[olah.length - 1]
  const tertinggi = olah.reduce((a, b) => (b.nilai > a.nilai ? b : a))
  const terendah = olah.reduce((a, b) => (b.nilai < a.nilai ? b : a))
  const perubahan = olah.slice(1)
  const naik = perubahan.filter((t) => t.dariKuartal > 0).length
  const turun = perubahan.filter((t) => t.dariKuartal < 0).length
  return {
    olah,
    pertama,
    terakhir,
    tertinggi,
    terendah,
    naik,
    turun,
    jumlahPerubahan: perubahan.length,
    sejakAwal: ubahPersen(pertama.nilai, terakhir.nilai),
    kuartalTerakhirTurun: terakhir.dariKuartal !== null && terakhir.dariKuartal < 0,
  }
}

/* ---------- Teks halaman ---------- */

export const PANDUAN_BACA = [
  {
    id: 'lilin',
    judul: 'Satu lilin, satu periode',
    isi: 'Setiap lilin merangkum harga dalam satu periode: saat dibuka, saat ditutup, serta yang tertinggi dan terendah. Badan hijau berarti harga ditutup lebih tinggi dari pembukaan, merah berarti sebaliknya.',
    warna: 'teal',
  },
  {
    id: 'periode',
    judul: 'Jarak waktu mengubah cerita',
    isi: 'Dalam sehari, grafik bisa terlihat seperti wahana ekstrem. Dalam lima tahun, bentuknya sering jauh lebih tenang. Coba ganti dari harian ke mingguan lewat tombol di bawah grafik, lalu bandingkan sendiri.',
    warna: 'emas',
  },
  {
    id: 'volume',
    judul: 'Volume memberi tahu seberapa ramai',
    isi: 'Pada banyak instrumen, batang kecil di dasar grafik menunjukkan jumlah transaksi. Kenaikan yang disertai transaksi ramai biasanya terasa lebih meyakinkan daripada kenaikan di pasar yang sepi.',
    warna: 'terakota',
  },
  {
    id: 'tunda',
    judul: 'Tertunda bukan berarti salah',
    isi: 'Data saham Indonesia di sini terlambat sekitar 15 menit. Untuk belajar dan memantau arah, jeda itu tidak masalah. Sebelum memutuskan beli atau jual, cek dulu harga terbaru di aplikasi sekuritas Anda.',
    warna: 'teal',
  },
]