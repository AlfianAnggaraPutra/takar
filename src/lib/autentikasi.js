import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

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
    if (!error && data?.session) return { berhasil: true }
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
      if (aktif) setKeadaan({ memuat: false, sesi: sesi ?? null })
    })
    return () => {
      aktif = false
      langganan?.subscription?.unsubscribe()
    }
  }, [])

  return keadaan
}