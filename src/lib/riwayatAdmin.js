import { supabase } from '../supabaseClient'

export const UKURAN_HALAMAN = 10
export const DAFTAR_PROFIL_FILTER = ['Konservatif', 'Moderat', 'Agresif']

const KOLOM = 'id_konsultasi,waktu_konsultasi,nama,usia,pekerjaan,hasil_profil,persentase_keyakinan,jawaban_indikator'

// Mengubah galat Supabase menjadi pesan yang bisa dipahami pengelola.
function pesanGalat(error) {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.'
  if (error.code === '42703') return 'Kolom waktu_konsultasi belum ada di tabel. Jalankan SQL migrasi admin di Supabase terlebih dahulu.'
  if (error.code === '42501' || error.status === 401 || error.status === 403 || /jwt|permission denied|row-level/i.test(error.message ?? '')) {
    return 'Akses ditolak. Sesi Anda mungkin sudah berakhir, silakan masuk kembali.'
  }
  if (error.status === 0 || /failed to fetch|network/i.test(error.message ?? '')) return 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda.'
  return 'Riwayat belum bisa dimuat. Coba lagi beberapa saat lagi.'
}

export class GalatRiwayat extends Error {
  constructor(error) {
    super(pesanGalat(error))
    this.name = 'GalatRiwayat'
    this.perluMasukLagi = error?.code === '42501' || error?.status === 401 || error?.status === 403 || /jwt/i.test(error?.message ?? '')
  }
}

// Karakter khusus pola LIKE ditulis apa adanya, bukan sebagai pengganti.
const amankanPola = (teks) => teks.replace(/[\\%_]/g, (c) => `\\${c}`)

function terapkanFilter(kueri, { cari, profil }) {
  let k = kueri
  if (profil && DAFTAR_PROFIL_FILTER.includes(profil)) k = k.eq('hasil_profil', profil)
  const kata = (cari ?? '').trim()
  if (kata) k = k.ilike('nama', `%${amankanPola(kata)}%`)
  return k
}

// Mengambil satu halaman riwayat, urut dari yang terbaru. halaman dimulai dari 1.
export async function ambilRiwayat({ halaman, cari = '', profil = '' }) {
  if (!supabase) throw new GalatRiwayat({ message: 'Failed to fetch', status: 0 })
  const dari = (halaman - 1) * UKURAN_HALAMAN
  const sampai = dari + UKURAN_HALAMAN - 1
  const dasar = supabase.from('riwayat_konsultasi').select(KOLOM, { count: 'exact' })
  const { data, error, count } = await terapkanFilter(dasar, { cari, profil })
    .order('waktu_konsultasi', { ascending: false })
    .range(dari, sampai)
  if (error) throw new GalatRiwayat(error)
  return { baris: data ?? [], total: count ?? 0 }
}

// Ringkasan jumlah untuk kartu di atas tabel. Bila salah satu gagal, nilainya null.
export async function ambilStatistik() {
  if (!supabase) return { total: null, Konservatif: null, Moderat: null, Agresif: null }
  const hitung = async (profil) => {
    let k = supabase.from('riwayat_konsultasi').select('id_konsultasi', { count: 'exact', head: true })
    if (profil) k = k.eq('hasil_profil', profil)
    const { count, error } = await k
    return error ? null : count ?? 0
  }
  const [total, Konservatif, Moderat, Agresif] = await Promise.all([hitung(''), hitung('Konservatif'), hitung('Moderat'), hitung('Agresif')])
  return { total, Konservatif, Moderat, Agresif }
}

/* ---------- Tampilan waktu (zona WIB) ---------- */

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatWaktu(nilai) {
  const d = new Date(nilai)
  if (!nilai || Number.isNaN(d.getTime())) return { tanggal: '-', jam: '' }
  const bagian = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  const jam = bagian.hour === '24' ? '00' : bagian.hour
  return { tanggal: `${Number(bagian.day)} ${BULAN_SINGKAT[Number(bagian.month) - 1]} ${bagian.year}`, jam: `${jam}.${bagian.minute} WIB` }
}