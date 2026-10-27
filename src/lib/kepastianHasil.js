// Batas kelayakan hasil konsultasi TAKAR.
//
// Mesin inferensi selalu menghasilkan profil teratas, bahkan dari bukti yang sangat tipis. Modul ini menilai
// seberapa layak hasil itu dibaca sebagai kesimpulan, lalu menyusun catatan yang dipakai di halaman Hasil,
// laporan PDF, panel admin, dan ekspor Excel. Profil teratas tetap ditampilkan; yang berubah hanyalah catatan
// keandalannya. Tidak ada jawaban yang ditolak atau dihentikan di tengah jalan.
//
// Hanya ada empat aturan, semuanya dari arahan pemilik sistem:
//  1. Pernyataan yang dijawab selain "Tidak" kurang dari 5: kurang valid. Berapa pun jumlah di atasnya (5 sampai 40)
//     tidak dicatat karena jumlahnya saja.
//  2. Jawaban identik (seluruh 40 pernyataan dijawab dengan pilihan yang sama, mis. 40 kali "Sangat Sesuai"):
//     kurang valid, walau persentasenya tinggi.
//  3. Persentase profil teratas di bawah 50: kurang valid (ketiga profil saling bersaing).
//  4. Persentase profil teratas 50 sampai di bawah 70: perlu dicermati. Dari 70 ke atas: kuat.
//
// Dasar angka (simulasi 120.000 responden yang dibangkitkan dari bobot pakar di basisPengetahuan.js, dengan prior
// 0,55 / 0,35 / 0,10): profil teratas 50 sampai 60 persen benar sekitar 56 persen kasus, 60 sampai 70 persen sekitar
// 69 persen, 70 sampai 80 persen sekitar 80 persen, 80 sampai 90 persen sekitar 89 persen, dan 90 persen ke atas
// sekitar 98 sampai 99 persen. Responden wajar tidak ada yang menjawab selain "Tidak" pada kurang dari 10 pernyataan,
// jadi di bawah 5 pernyataan hasil lebih banyak ditentukan bobot awal pakar daripada jawaban pengguna. Bila semua 40
// pernyataan dijawab dengan pilihan yang sama, hasilnya selalu Moderat 100 persen, padahal itu bukan gambaran profil,
// melainkan akibat pernyataan yang saling berlawanan sama-sama dianggap cocok.
// Semua ambang ada di satu tempat ini, jadi mudah ditinjau ulang bila pakar atau dosen penguji menghendaki angka lain.

import { DAFTAR_INDIKATOR, PILIHAN_JAWABAN } from '../data/basisPengetahuan.js'

export const AMBANG_KEPASTIAN = {
  // Jumlah pernyataan yang dijawab selain "Tidak" (nilai keyakinan di atas nol). Di bawah ini: kurang valid.
  indikatorSangatSedikit: 5,
  // Jumlah pernyataan yang pilihannya persis sama (selain "Tidak"). Dari sini ke atas: kurang valid.
  // Diset 40 sesuai arahan: hanya jawaban yang identik pada seluruh pernyataan yang dicatat. Turunkan angka ini
  // (mis. 36) bila jawaban yang nyaris identik juga ingin ditangkap.
  jawabanSeragam: 40,
  // Persentase profil teratas.
  persenKuat: 70, // dari sini ke atas: tanpa catatan
  persenCukup: 50, // di bawah ini: kurang valid (ketiga profil saling bersaing); di antara keduanya: perlu dicermati
  // Profil ketiga ikut disebut di catatan "bersaing" bila persentasenya setidaknya segini.
  persenIkutDisebut: 10,
}

export const TINGKAT_KEPASTIAN = { kuat: 'kuat', sedang: 'sedang', rendah: 'rendah' }
const URUTAN = { kuat: 0, sedang: 1, rendah: 2 }
const TOTAL_PERNYATAAN = DAFTAR_INDIKATOR.length

const koma1 = (x) => {
  // Angka yang masih di bawah 100 tidak boleh tampil sebagai 100 karena pembulatan.
  if (x < 100 && x.toFixed(1) === '100.0') return '99,9'
  const s = x.toFixed(1).replace('.', ',')
  return s.endsWith(',0') ? s.slice(0, -2) : s
}

// Pilihan jawaban yang paling sering dipakai di antara pernyataan yang dijawab selain "Tidak".
function jawabanTerbanyak(indikatorTeramati) {
  if (!Array.isArray(indikatorTeramati) || indikatorTeramati.length === 0) return { jumlah: 0, label: '' }
  const hitung = new Map()
  for (const i of indikatorTeramati) hitung.set(i.cf, (hitung.get(i.cf) ?? 0) + 1)
  let nilai = null
  let jumlah = 0
  for (const [k, v] of hitung) {
    if (v > jumlah) {
      nilai = k
      jumlah = v
    }
  }
  const label = PILIHAN_JAWABAN.find((p) => p.nilai === nilai)?.label ?? ''
  return { jumlah, label }
}

// Menilai hasil dari hitungProfilRisiko. Mengembalikan null bila profil memang belum dapat ditentukan.
// Tiap alasan memuat teks lengkap (halaman Hasil, PDF) dan ringkas (satu kalimat pendek untuk kolom Catatan di Excel).
export function nilaiKepastian(hasil) {
  if (!hasil || !hasil.dapatDitentukan || !Array.isArray(hasil.urutan) || hasil.urutan.length < 2) return null

  const A = AMBANG_KEPASTIAN
  const n = hasil.jumlahIndikatorTeramati
  const [pertama, kedua, ketiga] = hasil.urutan
  const persenTeratas = pertama.posterior * 100
  const persenKedua = kedua.posterior * 100
  const persenKetiga = ketiga ? ketiga.posterior * 100 : 0
  const selisih = persenTeratas - persenKedua
  const seragam = jawabanTerbanyak(hasil.indikatorTeramati)

  const alasan = []
  const tambah = (kode, tingkat, teks, ringkas) => alasan.push({ kode, tingkat, teks, ringkas })

  // 1. Pernyataan yang dijawab selain "Tidak" terlalu sedikit.
  if (n < A.indikatorSangatSedikit) {
    tambah(
      'sedikit-sekali',
      TINGKAT_KEPASTIAN.rendah,
      `Anda hanya memilih jawaban selain "Tidak" pada ${n} dari ${TOTAL_PERNYATAAN} pernyataan, sedangkan ${TOTAL_PERNYATAAN - n} lainnya dijawab "Tidak". Jawaban sesedikit ini belum cukup untuk menggambarkan sikap Anda terhadap risiko, jadi profil yang muncul belum bisa dipercaya sepenuhnya.`,
      `Hanya ${n} dari ${TOTAL_PERNYATAAN} pernyataan dijawab selain "Tidak", terlalu sedikit untuk menyimpulkan profil.`,
    )
  }

  // 2. Jawaban identik.
  if (seragam.jumlah >= A.jawabanSeragam) {
    const semua = seragam.jumlah === TOTAL_PERNYATAAN
    const bagian = semua ? `Seluruh ${TOTAL_PERNYATAAN} pernyataan` : `${seragam.jumlah} dari ${TOTAL_PERNYATAAN} pernyataan`
    tambah(
      'seragam',
      TINGKAT_KEPASTIAN.rendah,
      `${bagian} Anda jawab "${seragam.label}". Di antara pernyataan itu ada yang saling bertentangan, misalnya satu menggambarkan sikap berhati-hati dan yang lain sikap berani mengambil risiko, jadi tidak mungkin semuanya cocok dengan Anda. Karena itu, persentase setinggi apa pun belum menggambarkan profil Anda.`,
      semua
        ? `Seluruh ${TOTAL_PERNYATAAN} pernyataan dijawab "${seragam.label}", padahal ada pernyataan yang saling bertentangan.`
        : `${seragam.jumlah} dari ${TOTAL_PERNYATAAN} pernyataan dijawab "${seragam.label}", padahal ada pernyataan yang saling bertentangan.`,
    )
  }

  // 3. Seberapa menonjol profil teratas. Batas persentasenya urusan sistem, jadi tidak disebut di catatan untuk pengguna.
  if (persenTeratas < A.persenCukup) {
    const banyak = persenKetiga >= A.persenIkutDisebut
    const lain = banyak
      ? `profil ${kedua.nama} (${koma1(persenKedua)}%) dan ${ketiga.nama} (${koma1(persenKetiga)}%) juga masih besar`
      : `profil ${kedua.nama} mendapat ${koma1(persenKedua)}%`
    tambah(
      'bersaing',
      TINGKAT_KEPASTIAN.rendah,
      `Profil ${pertama.nama} memiliki persentase tertinggi, yaitu ${koma1(persenTeratas)}%, sedangkan ${lain}. Jawaban Anda belum mengarah jelas ke satu profil, sehingga profil ${pertama.nama} belum bisa dianggap menggambarkan Anda secara pasti.`,
      `${pertama.nama} tertinggi dengan ${koma1(persenTeratas)}%, tetapi ${banyak ? `${kedua.nama} dan ${ketiga.nama}` : kedua.nama} masih besar, jadi belum mengarah jelas ke satu profil.`,
    )
  } else if (persenTeratas < A.persenKuat) {
    tambah(
      'cukup-menonjol',
      TINGKAT_KEPASTIAN.sedang,
      `Profil ${pertama.nama} memiliki persentase tertinggi, yaitu ${koma1(persenTeratas)}%, disusul profil ${kedua.nama} dengan ${koma1(persenKedua)}%. Jawaban Anda memang condong ke ${pertama.nama}, tetapi ciri profil ${kedua.nama} juga cukup terlihat, sehingga hasil ini lebih tepat dibaca sebagai kecenderungan, bukan kepastian.`,
      `${pertama.nama} tertinggi dengan ${koma1(persenTeratas)}%, disusul ${kedua.nama} ${koma1(persenKedua)}%, jadi hasil baru berupa kecenderungan.`,
    )
  }

  const tingkat = alasan.reduce((t, a) => (URUTAN[a.tingkat] > URUTAN[t] ? a.tingkat : t), TINGKAT_KEPASTIAN.kuat)

  let label = 'Kuat'
  let tanda = ''
  let judul = ''
  let pengantar = ''
  if (tingkat === TINGKAT_KEPASTIAN.rendah) {
    label = 'Kurang valid'
    tanda = 'Hasil kurang valid, lihat catatan di bawah.'
    judul = 'Hasil ini kurang valid sebagai kesimpulan'
    pengantar = `Profil ${pertama.nama} tetap ditampilkan sebagai gambaran awal, tetapi jangan dijadikan satu-satunya dasar keputusan investasi.`
  } else if (tingkat === TINGKAT_KEPASTIAN.sedang) {
    label = 'Perlu dicermati'
    tanda = 'Hasil perlu dicermati, lihat catatan di bawah.'
    judul = 'Hasil ini perlu dicermati'
    pengantar = `Profil ${pertama.nama} masih bisa dipakai sebagai gambaran awal, dengan beberapa catatan berikut.`
  }

  // Satu saran yang paling relevan dengan sumber masalahnya.
  const kode = new Set(alasan.map((a) => a.kode))
  let saran = ''
  if (kode.has('sedikit-sekali')) {
    saran = 'Silakan tinjau kembali jawaban Anda. Bila ada pernyataan yang sedikit saja menggambarkan diri Anda, pilih "Sedikit Sesuai", bukan "Tidak".'
  } else if (kode.has('seragam')) {
    saran = 'Silakan isi ulang sesuai kebiasaan Anda sehari-hari. Pernyataan yang tidak cocok dengan Anda cukup dijawab "Tidak", dan pilih tingkat kesesuaian yang berbeda sesuai seberapa mirip pernyataan itu dengan Anda.'
  } else if (kode.has('bersaing')) {
    saran = 'Tinjau lagi pernyataan yang sempat membuat Anda ragu, dan isi ulang bila perlu agar profil Anda terbaca lebih jelas.'
  } else if (kode.has('cukup-menonjol')) {
    saran = 'Bila ingin gambaran yang lebih tegas, tinjau lagi pernyataan yang sempat membuat Anda ragu. Untuk keputusan investasi, padukan juga dengan tujuan dan kondisi keuangan Anda.'
  }

  // Ringkasan satu atau dua kalimat pendek untuk kolom Catatan di Excel.
  const ringkasan = alasan.length > 0 ? alasan.map((a) => a.ringkas).join(' ') : `Profil teratas ${koma1(persenTeratas)}%, tidak ada catatan.`

  return {
    tingkat,
    label,
    tanda,
    judul,
    pengantar,
    alasan,
    saran,
    ringkasan,
    metrik: { jumlahIndikator: n, persenTeratas, persenKedua, selisih },
  }
}

// Untuk panel admin: menilai dari jawaban yang tersimpan. Mengembalikan null bila jawaban tidak bisa dihitung.
export function nilaiKepastianDariJawaban(jawaban, hitungProfilRisiko) {
  try {
    if (!jawaban || typeof jawaban !== 'object') return null
    return nilaiKepastian(hitungProfilRisiko(jawaban))
  } catch {
    return null
  }
}