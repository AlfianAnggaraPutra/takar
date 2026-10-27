// Pemeriksaan nama lengkap pada formulir Konsultasi.
//
// Yang diizinkan: huruf (besar maupun kecil, termasuk huruf bertanda umum seperti é dan ü), spasi, titik (M. Rafli),
// apostrof atau "koma atas" (Ma'ruf, D'Angelo), dan tanda hubung (Anne-Marie). Angka dan simbol lain ditolak.
// Aturan ini hanya memastikan isiannya berbentuk nama, bukan memastikan nama itu benar milik pengguna.
//
// Pemeriksaan sengaja tidak terlalu ketat: nama asli orang tidak selalu "rapi", jadi yang ditolak hanya yang jelas
// bukan nama (angka, simbol, tanda baca berserakan, atau tanpa huruf).

export const BATAS_NAMA = { minHuruf: 1, maksKarakter: 80 }

// Variasi tanda apostrof yang sering muncul dari papan ketik ponsel (’ ‘ ʼ ʻ ` ´ ′), disamakan menjadi ' agar data
// seragam dan tidak ada tampilan yang berubah di PDF maupun Excel. Penyamaan dilakukan sebelum normalisasi Unicode
// karena ´ akan berubah menjadi spasi bila dinormalisasi lebih dulu.
const APOSTROF_LAIN = /[‘’ʼʻ`´′]/g
const TANDA_BACA = new Set(['.', "'", '-'])

// Merapikan nama: apostrof diseragamkan, huruf lebar penuh dan sejenisnya diubah ke bentuk biasa, spasi berlebih dibuang.
export function rapikanNama(teks) {
  return String(teks ?? '')
    .replace(APOSTROF_LAIN, "'")
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

// Huruf yang diterima: A sampai Z (besar dan kecil) beserta huruf bertanda umum seperti é, ü, ñ, å (rentang Latin-1).
// Batasnya sengaja sampai di sini karena laporan PDF memakai huruf standar yang hanya memuat rentang itu, sehingga
// huruf di luarnya (mis. ş atau ł) akan hilang diam-diam dari laporan. Lebih baik pengguna diberi tahu sejak awal.
const adalahHuruf = (c) => /^[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(c)

// Hanya memeriksa karakter. Dipakai juga saat pengguna sedang mengetik, karena karakter terlarang pasti salah
// sedangkan hal lain (mis. nama yang belum selesai ditulis) belum boleh dianggap salah.
export function periksaKarakterNama(teks) {
  const terlarang = []
  for (const c of rapikanNama(teks)) {
    if (adalahHuruf(c) || c === ' ' || TANDA_BACA.has(c)) continue
    if (!terlarang.includes(c)) terlarang.push(c)
  }
  if (terlarang.length === 0) return ''
  if (terlarang.every((c) => /\p{Nd}/u.test(c))) return 'Nama tidak boleh memuat angka.'
  // Karakter yang tidak tampak (mis. spasi lebar nol) diberi keterangan agar pengguna tahu apa yang dimaksud.
  const tampil = (c) => (/[\p{C}\p{Z}]/u.test(c) ? '(karakter tak terlihat)' : c)
  const daftar = [...new Set(terlarang.map(tampil))].slice(0, 4).join(' ') + (terlarang.length > 4 ? ' dan lainnya' : '')
  return `Nama hanya boleh berisi huruf, spasi, titik, tanda hubung, dan apostrof ('). Karakter yang tidak diizinkan: ${daftar}`
}

// Pemeriksaan lengkap saat tombol Mulai ditekan atau kolom ditinggalkan. Mengembalikan pesan, atau '' bila nama sah.
export function periksaNama(teks) {
  const nama = rapikanNama(teks)
  if (!nama) return 'Nama lengkap belum diisi.'
  if (nama.length > BATAS_NAMA.maksKarakter) return `Nama terlalu panjang, maksimal ${BATAS_NAMA.maksKarakter} karakter.`

  const galatKarakter = periksaKarakterNama(nama)
  if (galatKarakter) return galatKarakter

  const karakter = [...nama]
  if (!adalahHuruf(karakter[0])) return 'Nama harus diawali huruf.'
  if (karakter.filter(adalahHuruf).length < BATAS_NAMA.minHuruf) return `Nama lengkap minimal memuat ${BATAS_NAMA.minHuruf} huruf.`

  // Titik harus langsung mengikuti huruf. Apostrof dan tanda hubung harus berada di antara dua huruf.
  // Pesannya menyebut tanda yang bermasalah saja, supaya pengguna langsung tahu apa yang perlu diperbaiki.
  for (let i = 0; i < karakter.length; i++) {
    const c = karakter[i]
    if (!TANDA_BACA.has(c)) continue
    const sebelum = i > 0 && adalahHuruf(karakter[i - 1])
    const sesudah = i < karakter.length - 1 && adalahHuruf(karakter[i + 1])
    if (c === '.' && !sebelum) return 'Titik harus langsung mengikuti huruf (contoh: M. Rafli).'
    if (c === "'" && !(sebelum && sesudah)) return "Apostrof harus berada di antara dua huruf (contoh: Ma'ruf)."
    if (c === '-' && !(sebelum && sesudah)) return 'Tanda hubung harus berada di antara dua huruf (contoh: Anne-Marie).'
  }
  return ''
}