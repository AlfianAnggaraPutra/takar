// Isi halaman Tentang. Teks diubah di sini, tidak perlu menyentuh JSX.
//
// Angka dan pengelompokan indikator diambil langsung dari basis pengetahuan TAKAR
// (basisPengetahuan.js dan profilRisiko.js), jadi tidak perlu diketik ulang di sini.

import { DAFTAR_INDIKATOR, PARAMETER_LAPLACE, PROBABILITAS_PRIOR } from './basisPengetahuan.js'
import { LANGKAH_KONSULTASI } from './profilRisiko.js'

/* ---------- Orang di balik TAKAR ---------- */
// Kolom nama atau uraian yang dikosongkan tidak ditampilkan, dan kartunya hanya memuat bagian yang terisi.
export const ORANG = [
  {
    peran: 'Peneliti dan pengembang',
    nama: 'Alfian Anggara Putra Afandy',
    ikon: 'topi',
    warna: 'emas',
    uraian: 'Mahasiswa S-1 Matematika Universitas Airlangga. Merancang metode, menyusun data, dan membangun website ini sebagai bagian dari skripsinya.',
  },
  {
    // Pakar sengaja tanpa nama, atas permintaan beliau.
    peran: 'Pakar rujukan',
    nama: '',
    ikon: 'pakar',
    warna: 'teal',
    uraian: 'Seorang Certified Financial Planner (CFP) yang diwawancarai. Beliau menilai probabilitas prior (bobot awal tiap profil), probabilitas likelihood (bobot tiap indikator), dan pemetaan profil ke instrumen. Namanya tidak dicantumkan atas permintaan beliau.',
  },
  {
    peran: 'Dosen pembimbing I',
    nama: 'Drs. Edi Winarko, M.Cs',
    ikon: 'buku',
    warna: 'terakota',
    uraian: '',
  },
  {
    peran: 'Dosen pembimbing II',
    nama: 'Auli Damayanti, S.Si., M.Si',
    ikon: 'buku',
    warna: 'emas',
    uraian: '',
  },
]

/* ---------- Perjalanan penelitian ---------- */
export const PERJALANAN = [
  {
    judul: 'Bertanya kepada pakar',
    isi: 'Seorang perencana keuangan bersertifikat diminta menilai seberapa khas tiap sikap dan kondisi bagi investor konservatif, moderat, dan agresif.',
    ikon: 'pakar',
  },
  {
    judul: 'Menyusun basis pengetahuan',
    isi: 'Jawabannya dirapikan menjadi 40 indikator beserta bobotnya, bobot awal tiga profil, dan daftar instrumen yang cocok untuk tiap profil.',
    ikon: 'daftar',
  },
  {
    judul: 'Menghitung dengan tangan',
    isi: 'Metode dicoba lebih dulu pada contoh kasus secara manual, supaya setiap angkanya bisa diperiksa langkah demi langkah.',
    ikon: 'hitung',
  },
  {
    judul: 'Memindahkannya ke website',
    isi: 'Perhitungan yang sama dibangun menjadi TAKAR, lalu hasilnya dicocokkan dengan hitungan manual tadi sampai angkanya persis sama.',
    ikon: 'timbang',
  },
]

/* ---------- Tiga pegangan ---------- */
export const PEGANGAN = [
  {
    judul: 'Pertanyaan yang manusiawi',
    isi: 'Empat puluh pernyataan ditulis dengan bahasa sehari-hari, jadi Anda tidak perlu paham istilah keuangan untuk menjawabnya.',
    ikon: 'formulir',
  },
  {
    judul: 'Bobot dari praktisi',
    isi: 'Angka-angkanya datang dari wawancara dengan perencana keuangan bersertifikat, bukan dari tebakan pembuat website.',
    ikon: 'pakar',
  },
  {
    judul: 'Hitungan yang bisa diperiksa',
    isi: 'Metode dan rumusnya dibuka di halaman ini, dan hasil sistem sudah dicocokkan dengan perhitungan manual.',
    ikon: 'hitung',
  },
]

/* ---------- Tiga bahan hitungan ---------- */
export const BAHAN = [
  {
    judul: 'Penilaian pakar',
    isi: 'Bagi pakar, ada sikap yang sangat khas untuk investor agresif, misalnya sanggup mengunci dana bertahun-tahun, dan ada yang justru khas untuk investor konservatif. Penilaian itu dituliskan sebagai angka antara 0 dan 1 untuk tiap indikator.',
    ikon: 'pakar',
  },
  {
    judul: 'Keyakinan Anda',
    isi: 'Setiap jawaban punya bobot: Tidak bernilai 0, Sedikit Sesuai 0,4, Cukup Sesuai 0,6, Sesuai 0,8, dan Sangat Sesuai 1. Makin yakin Anda, makin besar pengaruh jawaban itu.',
    ikon: 'penggeser',
  },
  {
    judul: 'Perkalian dan perbandingan',
    isi: 'Untuk tiap profil, bobot awalnya dikalikan dengan bobot dari semua pernyataan yang Anda tandai sesuai. Ketiga hasilnya diubah menjadi persentase, dan yang tertinggi menjadi profil Anda.',
    ikon: 'hitung',
  },
]

/* ---------- Simulator: empat pernyataan asli ---------- */
// Kode indikator diambil dari basis pengetahuan, jadi kalimat dan angkanya sama dengan yang dipakai mesin hitung.
export const KODE_SIMULATOR = ['E10', 'E8', 'E11', 'E31']

// Contoh jawaban siap pakai. Hasilnya sudah diperiksa dengan mesin hitung asli.
export const CONTOH_JAWABAN = [
  { id: 'cemas', label: 'Mudah cemas', jawaban: { E10: 1, E8: 0, E11: 0, E31: 0 } },
  { id: 'seimbang', label: 'Seimbang', jawaban: { E10: 0.4, E8: 1, E11: 0.4, E31: 0 } },
  { id: 'berani', label: 'Berani', jawaban: { E10: 0, E8: 0, E11: 1, E31: 1 } },
]

// Satu kata per pilihan agar muat di layar sempit. Nama lengkapnya dipakai sebagai label bagi pembaca layar.
export const SINGKAT_JAWABAN = { 0: 'Tidak', 0.4: 'Sedikit', 0.6: 'Cukup', 0.8: 'Sesuai', 1: 'Sangat' }

export const BOBOT_AWAL = PROBABILITAS_PRIOR

// Contoh pada penjelasan koreksi Laplace: E3 untuk profil Konservatif, bobot pakar 0.
export const CONTOH_LAPLACE = (() => {
  const { n, k } = PARAMETER_LAPLACE
  const e3 = DAFTAR_INDIKATOR.find((i) => i.kode === 'E3')
  const hasil = (e3.likelihood.H1 * n + 1) / (n + k)
  return { n, k, kode: 'E3', nama: e3.nama, awal: e3.likelihood.H1, hasil }
})()

/* ---------- Indikator per topik ---------- */
const URAIAN_TOPIK = {
  'Modal dan usia': 'Besar dana dan tahap hidup menentukan seberapa leluasa Anda menanggung naik turunnya nilai.',
  'Jangka waktu dan rasa tenang': 'Kapan uangnya dibutuhkan, dan seberapa tenang Anda saat harus menunggu.',
  'Sikap terhadap risiko': 'Cara Anda bereaksi ketika nilai turun, dan risiko sebesar apa yang masih terasa wajar.',
  'Tujuan berinvestasi': 'Apa yang sebenarnya dikejar: dana darurat, pensiun, atau pertumbuhan kekayaan.',
  'Pengalaman dan pemahaman': 'Seberapa sering Anda bersinggungan dengan produk berisiko, dan seberapa paham konsepnya.',
  'Cara mengelola investasi': 'Ingin memantau sendiri tiap hari, atau lebih suka menyerahkannya kepada profesional.',
  'Likuiditas dan dana terkunci': 'Seberapa cepat uang harus bisa diambil, dan berapa lama Anda sanggup mengunci dana.',
  'Keamanan dana dan kondisi keuangan': 'Seberapa penting modal pokok tetap utuh, dan seberapa longgar keuangan Anda saat ini.',
}
const IKON_TOPIK = {
  'Modal dan usia': 'koin',
  'Jangka waktu dan rasa tenang': 'jam',
  'Sikap terhadap risiko': 'denyut',
  'Tujuan berinvestasi': 'sasaran',
  'Pengalaman dan pemahaman': 'topi',
  'Cara mengelola investasi': 'penggeser',
  'Likuiditas dan dana terkunci': 'gembok',
  'Keamanan dana dan kondisi keuangan': 'dompet',
}

// Topik yang sama di langkah berbeda digabung, urutannya mengikuti urutan pengisian di halaman Konsultasi.
export const TOPIK_INDIKATOR = (() => {
  const urut = []
  const peta = new Map()
  for (const langkah of LANGKAH_KONSULTASI) {
    for (const kel of langkah.kelompok) {
      if (!peta.has(kel.judul)) {
        peta.set(kel.judul, [])
        urut.push(kel.judul)
      }
      peta.get(kel.judul).push(...kel.kode)
    }
  }
  return urut.map((judul, i) => ({
    id: `topik-${i + 1}`,
    judul,
    ikon: IKON_TOPIK[judul] ?? 'daftar',
    uraian: URAIAN_TOPIK[judul] ?? '',
    indikator: peta.get(judul).map((kode) => {
      const ind = DAFTAR_INDIKATOR.find((x) => x.kode === kode)
      return { kode, nama: ind.nama }
    }),
  }))
})()

/* ---------- Keterbatasan ---------- */
export const KETERBATASAN = [
  {
    judul: 'Ini skrining awal, bukan nasihat',
    isi: 'Hasilnya membantu Anda mengenali diri sendiri. Keputusan yang besar tetap sebaiknya dibicarakan dengan perencana keuangan berlisensi.',
    ikon: 'info',
    warna: 'emas',
  },
  {
    judul: 'Hasil bergantung pada kejujuran Anda',
    isi: 'TAKAR hanya membaca apa yang Anda isi. Jawaban yang dibuat-buat akan menghasilkan profil yang tidak mencerminkan Anda.',
    ikon: 'pena',
    warna: 'teal',
  },
  {
    judul: 'Bobotnya dari satu pakar',
    isi: 'Penilaiannya matang, tetapi tetap satu sudut pandang profesional. Pakar lain bisa saja memberi angka yang sedikit berbeda.',
    ikon: 'orang',
    warna: 'terakota',
  },
  {
    judul: 'Pernyataan dianggap berdiri sendiri',
    isi: 'Naive Bayes memperlakukan tiap pernyataan sebagai hal yang terpisah, padahal dalam hidup nyata sebagian saling berkaitan. Karena itu, baca persentase sebagai kecenderungan, bukan kepastian.',
    ikon: 'terpisah',
    warna: 'emas',
  },
  {
    judul: 'Tidak membaca pasar',
    isi: 'TAKAR menilai watak Anda sebagai investor. Harga tidak diramalkan, dan tidak ada produk tertentu yang dinobatkan sebagai yang terbaik.',
    ikon: 'grafik',
    warna: 'teal',
  },
  {
    judul: 'Profil bisa berubah',
    isi: 'Usia, pekerjaan, dan keadaan keuangan berubah dari waktu ke waktu. Ulangi konsultasi ketika hidup Anda berubah.',
    ikon: 'jam',
    warna: 'terakota',
  },
]

/* ---------- Data pengguna ---------- */
export const DATA_DISIMPAN = [
  'Nama, sesuai yang Anda ketik',
  'Usia dan pekerjaan',
  'Jawaban atas 40 pernyataan',
  'Profil hasil dan persentase keyakinannya',
  'Waktu konsultasi',
]
export const DATA_TIDAK_DIMINTA = ['Alamat email', 'Nomor telepon', 'Alamat tempat tinggal', 'Nomor rekening, saldo, atau data keuangan pribadi']

export const JAMINAN_DATA = [
  {
    judul: 'Hanya admin yang bisa melihat',
    isi: 'Riwayat konsultasi tersimpan di basis data yang dilindungi, dan hanya akun admin yang dapat membukanya.',
    ikon: 'mata',
  },
  {
    judul: 'Dipakai untuk penelitian dan evaluasi',
    isi: 'Sesuai persetujuan yang Anda centang di formulir. Data membantu pengembang menilai apakah hasil TAKAR masuk akal, lalu memperbaikinya bila perlu.',
    ikon: 'sasaran',
  },
  {
    judul: 'PDF dibuat di perangkat Anda',
    isi: 'Laporan PDF disusun langsung di peramban Anda. Unduhan itu tidak melewati pihak ketiga.',
    ikon: 'unduh',
  },
]

/* ---------- Alur satu konsultasi (kartu di bagian atas halaman) ---------- */
export const ALUR = [
  { judul: 'Anda menjawab', isi: '40 pernyataan, masing-masing dari Tidak sampai Sangat Sesuai.', ikon: 'formulir' },
  { judul: 'Bobot pakar ikut bicara', isi: 'Setiap indikator sudah dinilai lebih dulu oleh seorang CFP.', ikon: 'pakar' },
  { judul: 'Mesin menghitung', isi: 'Naive Bayes dan Certainty Factor bekerja bersama.', ikon: 'hitung' },
  { judul: 'Profil Anda muncul', isi: 'Lengkap dengan persentase keyakinan dan daftar instrumen.', ikon: 'timbang' },
]

/* ---------- Menu bagian ---------- */
export const BAGIAN = [
  { id: 'latar', label: 'Latar belakang' },
  { id: 'cara', label: 'Cara kerja' },
  { id: 'indikator', label: 'Indikator' },
  { id: 'pakar', label: 'Pakar' },
  { id: 'batasan', label: 'Batasan' },
  { id: 'data', label: 'Data Anda' },
]