import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { bersihkanPenandaSesi, catatAktifTerakhir, hapusPesanSesi } from './batasSesi'

// Aturan kolom login admin. Dipakai di formulir dan bisa diuji tanpa browser.
export const BATAS_SANDI_MINIMAL = 8
export const BATAS_SANDI_MAKSIMAL = 72
const POLA_GMAIL = /^[a-z0-9][a-z0-9._+-]*@gmail\.com$/i

export function rapikanEmail(teks) {
  return String(teks ?? '').trim().toLowerCase()
}

// Mengembalikan pesan kesalahan, atau '' bila email sudah benar.
export function periksaEmail(teks) {
  const email = rapikanEmail(teks)
  if (!email) return 'Email belum diisi.'
  if (!email.includes('@')) return 'Email harus memuat tanda @, misalnya nama@gmail.com.'
  if (!email.endsWith('@gmail.com')) return 'Gunakan email yang berakhiran @gmail.com.'
  if (!POLA_GMAIL.test(email) || email.length > 64 || email.includes('..')) return 'Format email belum benar.'
  return ''
}

export function periksaSandi(teks) {
  const sandi = String(teks ?? '')
  if (!sandi) return 'Kata sandi belum diisi.'
  if (sandi.length < BATAS_SANDI_MINIMAL) return `Kata sandi minimal ${BATAS_SANDI_MINIMAL} karakter.`
  if (sandi.length > BATAS_SANDI_MAKSIMAL) return `Kata sandi maksimal ${BATAS_SANDI_MAKSIMAL} karakter.`
  return ''
}

// Masuk dengan email dan kata sandi lewat Supabase Auth.
// Pesan untuk pengguna sengaja umum: tidak dijelaskan apakah email atau sandi yang salah.
export async function masukAdmin(email, sandi) {
  if (!supabase) return { berhasil: false, jenis: 'konfigurasi', pesan: 'Koneksi database belum diatur, sehingga login belum bisa dipakai.' }
  if (periksaEmail(email) || periksaSandi(sandi)) return { berhasil: false, jenis: 'isian', pesan: 'Periksa kembali email dan kata sandi Anda.' }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: rapikanEmail(email), password: sandi })
    if (!error && data?.session) {
      // Masuk baru: hitungan batas diam dimulai dari nol dan pemberitahuan sesi berakhir yang lama tidak perlu tampil lagi.
      bersihkanPenandaSesi()
      hapusPesanSesi()
      catatAktifTerakhir()
      return { berhasil: true }
    }
    if (error?.status === 429 || /rate limit|too many/i.test(error?.message ?? '')) {
      return { berhasil: false, jenis: 'terlalu-sering', pesan: 'Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.' }
    }
    if (error?.status === 0 || /failed to fetch|network|fetch/i.test(error?.message ?? '')) {
      return { berhasil: false, jenis: 'jaringan', pesan: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.' }
    }
    if (error && error.status >= 500) {
      return { berhasil: false, jenis: 'server', pesan: 'Server sedang bermasalah. Coba lagi beberapa saat lagi.' }
    }
    return { berhasil: false, jenis: 'salah', pesan: 'Email atau kata sandi tidak sesuai.' }
  } catch (galat) {
    console.error('Gagal masuk admin:', galat)
    return { berhasil: false, jenis: 'jaringan', pesan: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.' }
  }
}

export async function keluarAdmin() {
  bersihkanPenandaSesi()
  if (!supabase) return
  try {
    await supabase.auth.signOut()
  } catch (galat) {
    console.error('Gagal keluar:', galat)
  }
  // Pastikan sesi lokal benar-benar hilang walaupun server tidak terjangkau.
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* diabaikan */
  }
}

// Sesi admin saat ini. memuat = true selama sesi dari penyimpanan browser belum selesai diperiksa.
// Dua sesi dianggap sama bila token dan penggunanya sama.
function samaSesi(a, b) {
  if (!a || !b) return !a && !b
  return a.access_token === b.access_token && a.user?.id === b.user?.id
}

export function useSesiAdmin() {
  const [keadaan, setKeadaan] = useState({ memuat: Boolean(supabase), sesi: null })

  useEffect(() => {
    if (!supabase) return
    let aktif = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (aktif) setKeadaan({ memuat: false, sesi: data?.session ?? null })
      })
      .catch(() => {
        if (aktif) setKeadaan({ memuat: false, sesi: null })
      })
    const { data: langganan } = supabase.auth.onAuthStateChange((_peristiwa, sesi) => {
      if (!aktif) return
      // Supabase mengirim ulang sesi yang sama (objek baru, isi sama) setiap kali tab kembali aktif. Keadaan lama
      // dipertahankan agar tampilan yang bergantung padanya tidak digambar ulang tanpa alasan.
      setKeadaan((k) => (!k.memuat && samaSesi(k.sesi, sesi) ? k : { memuat: false, sesi: sesi ?? null }))
    })
    // Halaman yang dipulihkan dari riwayat browser (tombol kembali) atau tab yang kembali aktif bisa saja sudah
    // kehilangan sesinya, karena halaman lain sudah membuangnya. Sesi diperiksa ulang dan, bila sudah tidak ada,
    // tampilan ikut keluar dari mode admin.
    const periksaUlang = () => {
      if (document.visibilityState === 'hidden') return
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (aktif && !data?.session) setKeadaan((k) => (k.sesi ? { memuat: false, sesi: null } : k))
        })
        .catch(() => {})
    }
    const saatTampilLagi = (e) => {
      if (e.persisted) periksaUlang()
    }
    window.addEventListener('pageshow', saatTampilLagi)
    window.addEventListener('focus', periksaUlang)
    document.addEventListener('visibilitychange', periksaUlang)
    return () => {
      aktif = false
      window.removeEventListener('pageshow', saatTampilLagi)
      window.removeEventListener('focus', periksaUlang)
      document.removeEventListener('visibilitychange', periksaUlang)
      langganan?.subscription?.unsubscribe()
    }
  }, [])

  return keadaan
}