// Aturan nomor HP / WhatsApp Indonesia yang dipakai di seluruh TAKAR (formulir, PDF, riwayat admin, Excel).
//
// Nomor disimpan hanya berupa angka tanpa spasi atau tanda hubung, misalnya 081234567890.
// Aturannya: diawali 08, angka ketiga bukan 0 (awalan 080 bukan nomor seluler), dan panjangnya 10 sampai 13 angka.

export const MIN_ANGKA = 10
export const MAX_ANGKA = 13

// Pola yang sama dipasang di database (lihat supabase/migrasi_no_hp.sql).
export const POLA_NO_HP = /^08[1-9]\d{7,10}$/

const PESAN_AWALAN = 'Nomor harus diawali 08, misalnya 081234567890. Tulis tanpa +62 atau 62.'
const PESAN_080 = 'Awalan 080 bukan nomor HP. Periksa kembali nomornya.'

// Membuang semua selain angka, jadi spasi, tanda hubung, tanda plus, dan huruf yang ikut tertempel hilang sendiri.
export function ambilAngka(teks) {
  return String(teks ?? '').replace(/\D/g, '')
}

// Pemeriksaan awalan saja. Dipakai saat mengetik: nomor yang belum selesai ditulis belum dianggap salah,
// tetapi awalan yang sudah pasti keliru langsung diberi tahu. Mengembalikan teks pesan, atau '' bila tidak ada masalah.
export function periksaAwalanNoHp(angka) {
  if (!angka) return ''
  if (angka[0] !== '0') return PESAN_AWALAN
  if (angka.length >= 2 && angka[1] !== '8') return PESAN_AWALAN
  if (angka.length >= 3 && angka[2] === '0') return PESAN_080
  return ''
}

// Pemeriksaan lengkap, dipakai saat kolom ditinggalkan dan saat formulir dikirim.
export function periksaNoHp(teks) {
  const angka = ambilAngka(teks)
  if (!angka) return 'Nomor HP atau WhatsApp belum diisi.'
  const awalan = periksaAwalanNoHp(angka)
  if (awalan) return awalan
  if (angka.length < MIN_ANGKA) return `Nomor terlalu pendek. Nomor HP terdiri dari ${MIN_ANGKA} sampai ${MAX_ANGKA} angka.`
  if (angka.length > MAX_ANGKA) return `Nomor terlalu panjang. Nomor HP terdiri dari ${MIN_ANGKA} sampai ${MAX_ANGKA} angka.`
  return ''
}

// Tampilan yang mudah dibaca: 081234567890 menjadi 0812-3456-7890. Nilai kosong atau tidak lazim ditampilkan apa adanya.
export function formatNoHp(nilai) {
  const angka = ambilAngka(nilai)
  if (!angka) return ''
  if (!POLA_NO_HP.test(angka)) return angka
  return angka.match(/\d{1,4}/g).join('-')
}