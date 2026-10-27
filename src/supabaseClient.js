import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sesi login admin hanya boleh hidup selama admin berada di halaman riwayat konsultasi.
// Aturannya ada dua lapis:
// 1. Di dalam aplikasi, berpindah halaman dari panel admin memunculkan pop up lalu keluar otomatis (lihat RiwayatAdmin).
// 2. Di sini: sesi disimpan di sessionStorage (hilang saat tab ditutup), dan setiap kali aplikasi dimuat di alamat
//    selain /admin/riwayat (misalnya admin mengetik alamat lain di address bar), sesi yang tersisa dibuang.
//    Memuat ulang halaman riwayat sendiri tidak mengeluarkan admin.
export const KUNCI_SESI_ADMIN = 'takar-sesi-admin'
const ALAMAT_PANEL_ADMIN = /^\/admin\/riwayat\/?$/

function bersihkanSesiAdmin() {
  if (typeof window === 'undefined') return
  try {
    // Versi sebelumnya menyimpan sesi permanen di localStorage. Sisa itu dibuang agar tidak ada login yang "menempel".
    for (const kunci of Object.keys(window.localStorage)) {
      if (/^sb-.+-auth-token/.test(kunci)) window.localStorage.removeItem(kunci)
    }
    if (!ALAMAT_PANEL_ADMIN.test(window.location.pathname)) {
      for (const kunci of Object.keys(window.sessionStorage)) {
        if (kunci.startsWith(KUNCI_SESI_ADMIN)) window.sessionStorage.removeItem(kunci)
      }
    }
  } catch {
    /* penyimpanan browser tidak bisa diakses: tidak ada sesi yang perlu dibuang */
  }
}
bersihkanSesiAdmin()

// Bila variabel lingkungan belum diisi (misalnya .env belum dibuat), aplikasi tetap bisa dibuka
// dan halaman yang butuh database menampilkan pesan yang jelas, bukan layar putih.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
          storageKey: KUNCI_SESI_ADMIN,
        },
      })
    : null

// Klien khusus pengunjung umum, TANPA sesi login. Dipakai untuk menyimpan hasil konsultasi.
// Klien utama di atas memakai sesi login admin bila ada. Dengan sesi itu, permintaan dikirim sebagai akun admin,
// padahal izin menambah riwayat di database diberikan untuk pengunjung umum, sehingga penyimpanan ditolak.
// Klien ini tidak menyimpan dan tidak membaca sesi apa pun, jadi hasil konsultasi selalu tersimpan dengan
// cara yang sama, baik pengguna sedang login admin maupun tidak.
export const supabasePublik =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'takar-pengunjung-tanpa-sesi',
        },
      })
    : null

if (!supabase) {
  console.warn('Supabase belum dikonfigurasi: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env')
}