// Aturan batas waktu sesi admin dan penanda yang disimpan di tab ini.
//
// - Diam: bila tidak ada aktivitas selama BATAS_DIAM_MS, admin otomatis keluar. Satu menit sebelumnya
//   admin diberi peringatan dan bisa memilih "Tetap masuk".
// - Putus: bila koneksi internet terputus BATAS_PUTUS_MS atau lebih, admin diminta masuk kembali begitu koneksi pulih.
//
// Penanda waktu disimpan di sessionStorage supaya memuat ulang halaman tidak menghapus hitungannya. Nama kuncinya
// sengaja diawali "takar-sesi-admin", sehingga ikut dibuang bersama sesi admin saat halaman lain dimuat (supabaseClient).

export const BATAS_DIAM_MS = 30 * 60 * 1000
export const PERINGATAN_MS = 60 * 1000
export const BATAS_PUTUS_MS = 2 * 60 * 1000

const KUNCI_AKTIF = 'takar-sesi-admin-aktif-terakhir'
const KUNCI_PUTUS = 'takar-sesi-admin-putus-sejak'
const KUNCI_PESAN = 'takar-pesan-sesi'

const menit = (ms) => Math.round(ms / 60000)

// Isi pemberitahuan di halaman login setelah sesi berakhir. Kuncinya sama dengan alasan berakhirnya sesi.
export const PESAN_SESI = {
  diam: {
    judul: 'Sesi admin berakhir',
    isi: `Demi keamanan data pengguna, akun admin otomatis keluar setelah ${menit(BATAS_DIAM_MS)} menit tanpa aktivitas. Silakan masuk kembali untuk melanjutkan.`,
  },
  koneksi: {
    judul: 'Sesi admin berakhir',
    isi: `Koneksi internet Anda terputus lebih dari ${menit(BATAS_PUTUS_MS)} menit, sehingga akun admin otomatis keluar demi keamanan data pengguna. Silakan masuk kembali setelah koneksi stabil.`,
  },
  kedaluwarsa: {
    judul: 'Sesi admin berakhir',
    isi: 'Sesi login Anda sudah tidak berlaku. Silakan masuk kembali untuk melanjutkan.',
  },
}

function baca(kunci) {
  try {
    const nilai = Number(sessionStorage.getItem(kunci))
    return Number.isFinite(nilai) && nilai > 0 ? nilai : null
  } catch {
    return null
  }
}
function tulis(kunci, nilai) {
  try {
    sessionStorage.setItem(kunci, String(nilai))
  } catch {
    /* penyimpanan tidak tersedia: batas waktu tetap berjalan selama halaman terbuka */
  }
}
function hapus(kunci) {
  try {
    sessionStorage.removeItem(kunci)
  } catch {
    /* diabaikan */
  }
}

export const bacaAktifTerakhir = () => baca(KUNCI_AKTIF)
export const catatAktifTerakhir = (waktu = Date.now()) => tulis(KUNCI_AKTIF, waktu)
export const bacaPutusSejak = () => baca(KUNCI_PUTUS)
export const catatPutusSejak = (waktu = Date.now()) => tulis(KUNCI_PUTUS, waktu)
export const hapusPutusSejak = () => hapus(KUNCI_PUTUS)

export function bersihkanPenandaSesi() {
  hapus(KUNCI_AKTIF)
  hapus(KUNCI_PUTUS)
}

export function catatPesanSesi(alasan) {
  if (PESAN_SESI[alasan]) {
    try {
      sessionStorage.setItem(KUNCI_PESAN, alasan)
    } catch {
      /* diabaikan */
    }
  }
}
export function bacaPesanSesi() {
  try {
    const alasan = sessionStorage.getItem(KUNCI_PESAN)
    return PESAN_SESI[alasan] ? { alasan, ...PESAN_SESI[alasan] } : null
  } catch {
    return null
  }
}
export function hapusPesanSesi() {
  hapus(KUNCI_PESAN)
}