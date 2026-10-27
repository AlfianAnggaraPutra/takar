import { supabasePublik } from '../supabaseClient'

// Menyimpan satu konsultasi yang sudah selesai ke tabel riwayat_konsultasi.
// Mengembalikan { berhasil: true } atau { berhasil: false, pesan }.
//
// idKonsultasi dibuat sekali per hasil. Kolom id_konsultasi di database bersifat unik, jadi bila
// pengguna menekan "coba simpan lagi" padahal penyimpanan sebelumnya sebenarnya sudah masuk,
// database menolak data yang sama (kode 23505) dan itu kita anggap berhasil, bukan galat.
export async function simpanRiwayatKonsultasi({ idKonsultasi, identitas, jawaban, hasil }) {
  if (!supabasePublik) {
    return { berhasil: false, pesan: 'Koneksi database belum diatur, sehingga riwayat belum bisa disimpan.' }
  }

  const posteriorDetail = Object.fromEntries(hasil.hasilPerProfil.map((p) => [p.kode, p.posterior]))
  const baris = {
    id_konsultasi: idKonsultasi,
    nama: identitas.nama,
    usia: identitas.usia,
    pekerjaan: identitas.pekerjaan,
    no_hp: identitas.noHp,
    jawaban_indikator: jawaban,
    hasil_profil: hasil.profilTertinggi.nama,
    persentase_keyakinan: Number(hasil.persentase.toFixed(4)),
    posterior_detail: posteriorDetail,
  }

  // Gangguan jaringan sesaat dicoba ulang otomatis (hingga tiga kali percobaan) sebelum pengguna diberi tahu.
  // Bila percobaan sebelumnya ternyata sudah masuk, database menjawab 23505 dan itu dianggap berhasil.
  let galatTerakhir = null
  for (let percobaan = 0; percobaan < JEDA_ULANG_MS.length + 1; percobaan += 1) {
    if (percobaan > 0) await tunggu(JEDA_ULANG_MS[percobaan - 1])
    try {
      const { error } = await supabasePublik.from('riwayat_konsultasi').insert(baris)
      if (!error) return { berhasil: true }
      if (error.code === '23505') return { berhasil: true }
      galatTerakhir = error
      if (!bisaDicobaUlang(error)) break
    } catch (galat) {
      galatTerakhir = { jaringan: true, message: String(galat?.message ?? galat) }
    }
  }

  // Rincian galat dicatat di konsol untuk pengembang. Pengguna cukup melihat pesan ramah.
  console.error('Gagal menyimpan riwayat_konsultasi:', galatTerakhir?.code, galatTerakhir?.message)
  if (galatTerakhir?.jaringan || galatTerakhir?.status === 0 || /failed to fetch|network/i.test(galatTerakhir?.message ?? '')) {
    return { berhasil: false, pesan: 'Koneksi terputus saat menyimpan riwayat. Periksa internet Anda lalu coba lagi.' }
  }
  return { berhasil: false, pesan: 'Riwayat belum bisa disimpan. Hasil Anda tetap aman di halaman ini.' }
}

const JEDA_ULANG_MS = [700, 1800]
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms))

// Hanya gangguan sementara yang pantas dicoba ulang: jaringan putus dan galat gerbang server (502, 503, 504).
// Penolakan karena izin atau isi data (kode 4xx, 42501, dan sejenisnya) tidak akan berubah bila diulang.
function bisaDicobaUlang(error) {
  if (error.jaringan || error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) return true
  return /failed to fetch|network|load failed/i.test(error.message ?? '') && !error.code
}