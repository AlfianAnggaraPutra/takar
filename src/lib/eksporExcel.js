// Ekspor seluruh riwayat konsultasi ke berkas Excel (.xlsx) untuk cadangan data dan laporan.
//
// Tampilan sengaja polos dan rapi: huruf Times New Roman hitam, hanya baris judul yang berlatar biru muda,
// garis tipis hitam, rata kiri atau tengah menurut isi kolom, dan lebar kolom disesuaikan dengan isinya
// supaya tidak ada tulisan yang terpotong. Pustaka exceljs baru diunduh saat tombol ekspor ditekan.

import { ambilAngka } from './noHp.js'
import { hitungProfilRisiko } from './mesinInferensi.js'
import { nilaiKepastianDariJawaban } from './kepastianHasil.js'

const FONT = 'Times New Roman'
const UKURAN_FONT = 11
const HITAM = { argb: 'FF000000' }
const BIRU_MUDA = { argb: 'FFDDEBF7' }
const GARIS = { style: 'thin', color: HITAM }
const BINGKAI = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS }

const NAMA_SHEET = 'Riwayat Konsultasi'
const FORMAT_WAKTU = 'dd/mm/yyyy hh:mm'
const FORMAT_PERSEN = '0.00%'

// Urutan kolom sama dengan tabel di halaman riwayat, tanpa kolom unduh PDF.
const KOLOM = [
  { kunci: 'no', judul: 'No', rata: 'center' },
  { kunci: 'waktu', judul: 'Waktu Konsultasi (WIB)', rata: 'center' },
  { kunci: 'nama', judul: 'Nama', rata: 'left' },
  { kunci: 'usia', judul: 'Usia (tahun)', rata: 'center' },
  { kunci: 'pekerjaan', judul: 'Pekerjaan', rata: 'left' },
  { kunci: 'noHp', judul: 'No. HP / WhatsApp', rata: 'center' },
  { kunci: 'profil', judul: 'Profil Risiko', rata: 'center' },
  { kunci: 'yakin', judul: 'Keyakinan', rata: 'center' },
  { kunci: 'kepastian', judul: 'Tingkat Kepastian', rata: 'center' },
  { kunci: 'catatan', judul: 'Catatan', rata: 'left' },
]

const MIN_LEBAR = 6
const MAX_LEBAR = 60
const RUANG_TEPI = 3.5
const TINGGI_BARIS = 20
const TINGGI_PER_BARIS_TERBUNGKUS = 14.5

/* ---------- Perkiraan lebar teks ---------- */

// Lebar tiap huruf Times New Roman dalam satuan em (data metrik huruf itu sendiri). Satu em pada ukuran 11 pt
// setara kira-kira 2,1 satuan lebar kolom Excel.
const EM_TNR = {
  ' ': 0.25, '!': 0.333, '"': 0.408, '#': 0.5, $: 0.5, '%': 0.833, '&': 0.778, "'": 0.18, '(': 0.333, ')': 0.333, '*': 0.5, '+': 0.564,
  ',': 0.25, '-': 0.333, '.': 0.25, '/': 0.278, ':': 0.278, ';': 0.278, '<': 0.564, '=': 0.564, '>': 0.564, '?': 0.444, '@': 0.921,
  '[': 0.333, '\\': 0.278, ']': 0.333, '_': 0.5, '|': 0.2,
  a: 0.444, b: 0.5, c: 0.444, d: 0.5, e: 0.444, f: 0.333, g: 0.5, h: 0.5, i: 0.278, j: 0.278, k: 0.5, l: 0.278, m: 0.778, n: 0.5, o: 0.5,
  p: 0.5, q: 0.5, r: 0.333, s: 0.389, t: 0.278, u: 0.5, v: 0.5, w: 0.722, x: 0.5, y: 0.5, z: 0.444,
  A: 0.722, B: 0.667, C: 0.667, D: 0.722, E: 0.611, F: 0.556, G: 0.722, H: 0.722, I: 0.333, J: 0.389, K: 0.722, L: 0.611, M: 0.889,
  N: 0.722, O: 0.722, P: 0.556, Q: 0.722, R: 0.667, S: 0.556, T: 0.611, U: 0.722, V: 0.722, W: 0.944, X: 0.722, Y: 0.722, Z: 0.611,
}
const SATUAN_PER_EM = 2.1

function lebarTeks(teks, tebal = false) {
  let em = 0
  for (const c of String(teks)) {
    if (EM_TNR[c] !== undefined) em += EM_TNR[c]
    else if (c >= '0' && c <= '9') em += 0.5
    else if (c.codePointAt(0) > 0x2000) em += 1.05 // emoji, huruf non-Latin, dan sejenisnya dibuat longgar
    else em += 0.6
  }
  return em * SATUAN_PER_EM * (tebal ? 1.08 : 1)
}

/* ---------- Waktu ---------- */

const BAGIAN_WIB = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function bagianWib(tanggal) {
  const b = Object.fromEntries(BAGIAN_WIB.formatToParts(tanggal).map((p) => [p.type, p.value]))
  return { tahun: +b.year, bulan: +b.month, hari: +b.day, jam: +b.hour, menit: +b.minute, detik: +b.second }
}

// Excel tidak mengenal zona waktu. Jam dinding WIB dituliskan lewat tanggal UTC dengan angka yang sama,
// sehingga yang tampil di sel adalah jam WIB, berapa pun zona waktu komputer yang membukanya.
function kePenandaWib(nilai) {
  const d = new Date(nilai)
  if (!nilai || Number.isNaN(d.getTime())) return null
  const w = bagianWib(d)
  return new Date(Date.UTC(w.tahun, w.bulan - 1, w.hari, w.jam, w.menit, w.detik))
}

export function namaBerkasExcel(waktu = new Date()) {
  const w = bagianWib(waktu)
  const dua = (n) => String(n).padStart(2, '0')
  return `Riwayat-Konsultasi-TAKAR-${w.tahun}-${dua(w.bulan)}-${dua(w.hari)}.xlsx`
}

/* ---------- Mengubah baris database menjadi baris tabel ---------- */

function persenKePecahan(nilai) {
  const n = Number(nilai)
  if (nilai === null || nilai === undefined || nilai === '' || !Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, n)) / 100
}

// Tingkat kepastian hasil (Kuat, Perlu dicermati, atau Kurang valid) beserta catatan singkat alasannya, dinilai ulang
// dari jawaban yang tersimpan dengan aturan yang sama seperti tabel riwayat dan laporan PDF. Keduanya "-" bila
// jawabannya tidak ada atau tidak bisa dihitung.
function nilaiKepastianBaris(jawaban, yakin) {
  const kosong = { kepastian: '-', catatan: '-' }
  if (yakin === null) return kosong
  let isi = jawaban
  if (typeof isi === 'string') {
    try {
      isi = JSON.parse(isi)
    } catch {
      return kosong
    }
  }
  const k = nilaiKepastianDariJawaban(isi, hitungProfilRisiko)
  return k ? { kepastian: k.label, catatan: k.ringkasan } : kosong
}

export function siapkanBaris(riwayat) {
  return riwayat.map((b, i) => {
    const usia = Number(b.usia)
    const noHp = ambilAngka(b.no_hp)
    const yakin = persenKePecahan(b.persentase_keyakinan)
    return {
      no: i + 1,
      waktu: kePenandaWib(b.waktu_konsultasi),
      nama: String(b.nama ?? '').trim() || '-',
      usia: b.usia === null || b.usia === undefined || b.usia === '' || !Number.isFinite(usia) ? null : usia,
      pekerjaan: String(b.pekerjaan ?? '').trim() || '-',
      noHp: noHp || '-',
      profil: b.hasil_profil || '-',
      yakin,
      ...nilaiKepastianBaris(b.jawaban_indikator, yakin),
    }
  })
}

// Teks yang akan tampil di sel, dipakai untuk menghitung lebar kolom.
function teksTampil(kunci, nilai) {
  if (nilai === null || nilai === undefined) return '-'
  if (kunci === 'waktu') return '31/12/2026 23:59'
  if (kunci === 'yakin') return `${(nilai * 100).toFixed(2).replace('.', ',')}%`
  return String(nilai)
}

// Jumlah baris yang dibutuhkan sebuah teks bila dibungkus pada kolom selebar lebarKolom. Sedikit berlebih lebih baik
// daripada ada baris yang terpotong.
function jumlahBaris(teks, lebarKolom) {
  const tersedia = Math.max(4, lebarKolom - RUANG_TEPI)
  return Math.max(1, Math.ceil(lebarTeks(teks) / (tersedia * 0.88)))
}

export function hitungLebarKolom(baris) {
  return KOLOM.map((k) => {
    let maks = lebarTeks(k.judul, true)
    for (const b of baris) maks = Math.max(maks, lebarTeks(teksTampil(k.kunci, b[k.kunci])))
    return Math.min(MAX_LEBAR, Math.max(MIN_LEBAR, Math.ceil(maks + RUANG_TEPI)))
  })
}

/* ---------- Membuat berkas ---------- */

// Mengembalikan { buffer, nama, jumlah }. buffer berisi isi berkas .xlsx.
export async function buatBerkasExcel(riwayat, waktuEkspor = new Date()) {
  const modul = await import('exceljs')
  const ExcelJS = modul.default ?? modul
  const baris = siapkanBaris(riwayat)

  const buku = new ExcelJS.Workbook()
  buku.creator = 'TAKAR'
  buku.title = 'Riwayat Konsultasi TAKAR'
  buku.created = waktuEkspor
  buku.modified = waktuEkspor

  const lembar = buku.addWorksheet(NAMA_SHEET, {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.7, header: 0.3, footer: 0.3 },
    },
    headerFooter: { oddFooter: `&L&"${FONT},Regular"&9Riwayat Konsultasi TAKAR&R&"${FONT},Regular"&9Halaman &P dari &N` },
  })

  const lebar = hitungLebarKolom(baris)
  lembar.columns = KOLOM.map((k, i) => ({ key: k.kunci, width: lebar[i] }))

  // Baris judul
  const judul = lembar.getRow(1)
  KOLOM.forEach((k, i) => {
    const sel = judul.getCell(i + 1)
    sel.value = k.judul
    sel.font = { name: FONT, size: UKURAN_FONT, bold: true, color: HITAM }
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: BIRU_MUDA }
    sel.alignment = { horizontal: 'center', vertical: 'middle' }
    sel.border = BINGKAI
  })
  judul.height = 26

  // Isi
  baris.forEach((b, r) => {
    const row = lembar.getRow(r + 2)
    let barisTerbanyak = 1
    KOLOM.forEach((k, i) => {
      const sel = row.getCell(i + 1)
      const nilai = b[k.kunci]
      sel.value = nilai === null ? '-' : nilai
      sel.font = { name: FONT, size: UKURAN_FONT, color: HITAM }
      sel.border = BINGKAI
      if (k.rata === 'left') {
        // Nama atau pekerjaan yang lebih panjang daripada lebar kolom maksimum dibungkus ke baris berikutnya, bukan dipotong.
        const teks = String(sel.value)
        const bungkus = lebarTeks(teks) > lebar[i] - RUANG_TEPI
        if (bungkus) barisTerbanyak = Math.max(barisTerbanyak, jumlahBaris(teks, lebar[i]))
        sel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: bungkus }
      } else {
        sel.alignment = { horizontal: k.rata, vertical: 'middle' }
      }
      if (k.kunci === 'waktu' && nilai) sel.numFmt = FORMAT_WAKTU
      else if (k.kunci === 'yakin' && nilai !== null) sel.numFmt = FORMAT_PERSEN
      else if (k.kunci === 'noHp') sel.numFmt = '@' // teks, supaya angka 0 di depan tidak hilang
      else if (k.kunci === 'no' || k.kunci === 'usia') sel.numFmt = '0'
    })
    row.height = barisTerbanyak > 1 ? Math.ceil(barisTerbanyak * TINGGI_PER_BARIS_TERBUNGKUS + 8) : TINGGI_BARIS
  })

  if (baris.length > 0) lembar.autoFilter = { from: { row: 1, column: 1 }, to: { row: baris.length + 1, column: KOLOM.length } }
  // Baris judul diulang di setiap halaman saat dicetak.
  lembar.pageSetup.printTitlesRow = '1:1'

  const buffer = await buku.xlsx.writeBuffer()
  return { buffer, nama: namaBerkasExcel(waktuEkspor), jumlah: baris.length }
}

/* ---------- Menyerahkan berkas ke pengguna (hanya di browser) ---------- */

export function unduhBerkas(buffer, nama) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const alamat = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  tautan.href = alamat
  tautan.download = nama
  tautan.rel = 'noopener'
  tautan.style.display = 'none'
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  // Diberi jeda supaya browser sempat memulai unduhan sebelum alamatnya dicabut.
  setTimeout(() => URL.revokeObjectURL(alamat), 30000)
}