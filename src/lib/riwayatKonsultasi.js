import { supabase } from '../supabaseClient'

// Menyimpan satu konsultasi yang sudah selesai ke tabel riwayat_konsultasi.
// Mengembalikan { berhasil: true } atau { berhasil: false, pesan }.
//
// idKonsultasi dibuat sekali per hasil. Kolom id_konsultasi di database bersifat unik, jadi bila
// pengguna menekan "coba simpan lagi" padahal penyimpanan sebelumnya sebenarnya sudah masuk,
// database menolak data yang sama (kode 23505) dan itu kita anggap berhasil, bukan galat.
export async function simpanRiwayatKonsultasi({ idKonsultasi, identitas, jawaban, hasil }) {
  if (!supabase) {
    return { berhasil: false, pesan: 'Koneksi database belum diatur, sehingga riwayat belum bisa disimpan.' }
  }

  const posteriorDetail = Object.fromEntries(hasil.hasilPerProfil.map((p) => [p.kode, p.posterior]))
  const baris = {
    id_konsultasi: idKonsultasi,
    nama: identitas.nama,
    usia: identitas.usia,
    pekerjaan: identitas.pekerjaan,
    jawaban_indikator: jawaban,
    hasil_profil: hasil.profilTertinggi.nama,
    persentase_keyakinan: Number(hasil.persentase.toFixed(4)),
    posterior_detail: posteriorDetail,
  }

  try {
    const { error } = await supabase.from('riwayat_konsultasi').insert(baris)
    if (!error) return { berhasil: true }
    if (error.code === '23505') return { berhasil: true }
    // Rincian galat dicatat di konsol untuk pengembang. Pengguna cukup melihat pesan ramah.
    console.error('Gagal menyimpan riwayat_konsultasi:', error.code, error.message)
    return { berhasil: false, pesan: 'Riwayat belum bisa disimpan. Hasil Anda tetap aman di halaman ini.' }
  } catch (galat) {
    console.error('Gagal menyimpan riwayat_konsultasi (jaringan):', galat)
    return { berhasil: false, pesan: 'Koneksi terputus saat menyimpan riwayat. Periksa internet Anda lalu coba lagi.' }
  }
}