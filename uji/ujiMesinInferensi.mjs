// Uji mesin inferensi TAKAR. Jalankan dari folder proyek:  node uji/ujiMesinInferensi.mjs
import { readFileSync } from 'node:fs'
import { hitungProfilRisiko, koreksiLaplace, periksaJawaban } from '../src/lib/mesinInferensi.js'
import { DAFTAR_INDIKATOR, DAFTAR_PROFIL } from '../src/data/basisPengetahuan.js'

let lulus = 0, gagal = 0
const cek = (nama, kondisi, info = '') => {
  if (kondisi) { lulus++; console.log('  LULUS', nama) } else { gagal++; console.log('  GAGAL', nama, info) }
}
const hampir = (a, b, toleransi = 1e-12) => Math.abs(a - b) <= toleransi * Math.max(1, Math.abs(b))

console.log('1. Koreksi Laplace sama dengan kolom "P(Ei|Hj)baru" di Excel (40 x 3 nilai)')
const baruExcel = JSON.parse(readFileSync(new URL('./likelihoodBaruExcel.json', import.meta.url))).baru_excel
let selisihMaks = 0
for (const i of DAFTAR_INDIKATOR) {
  DAFTAR_PROFIL.forEach((p, j) => {
    selisihMaks = Math.max(selisihMaks, Math.abs(koreksiLaplace(i.likelihood[p.kode]) - baruExcel[i.kode][j]))
  })
}
cek(`selisih terbesar ${selisihMaks.toExponential(2)}`, selisihMaks < 1e-15)

console.log('2. Contoh kasus manual (sheet MANUAL)')
const manual = { E2: 1, E7: 0.8, E13: 0.4, E15: 0.8, E21: 0.6, E24: 0.8, E25: 0.6, E34: 0.4, E38: 0.8 }
const h = hitungProfilRisiko(manual)
const [h1, h2, h3] = h.hasilPerProfil
cek('E_obs berjumlah 9', h.jumlahIndikatorTeramati === 9)
cek('Numerator1 = 5,48065521424938e-08', hampir(h1.numerator, 5.48065521424938e-08), h1.numerator)
cek('Numerator2 = 4,0471824285739395e-05', hampir(h2.numerator, 4.0471824285739395e-05), h2.numerator)
cek('Numerator3 = 1,4703754347597435e-08', hampir(h3.numerator, 1.4703754347597435e-08), h3.numerator)
cek('Penyebut = 4,054133459222949e-05', hampir(h.penyebut, 4.054133459222949e-05), h.penyebut)
cek('Posterior H1 = 0,0013518684743298634', hampir(h1.posterior, 0.0013518684743298634), h1.posterior)
cek('Posterior H2 = 0,9982854460222083', hampir(h2.posterior, 0.9982854460222083), h2.posterior)
cek('Posterior H3 = 0,0003626855034618344', hampir(h3.posterior, 0.0003626855034618344), h3.posterior)
cek('Profil tertinggi Moderat 99,82854%', h.profilTertinggi.nama === 'Moderat' && h.persentase.toFixed(5) === '99.82854', h.persentase)

console.log('3. Kasus tepi')
const semuaTidak = Object.fromEntries(DAFTAR_INDIKATOR.map((i) => [i.kode, 0]))
cek('semua "Tidak" -> belum dapat ditentukan', hitungProfilRisiko(semuaTidak).dapatDitentukan === false)
cek('objek kosong -> belum dapat ditentukan', hitungProfilRisiko({}).dapatDitentukan === false)
const satu = hitungProfilRisiko({ E3: 1 })
// Hitungan tangan: H1 0,85 x 0,0098039 = 0,0083333; H2 0,5 x 0,4019608 = 0,2009804; H3 0,15 x 0,8431373 = 0,1264706.
// Karena prior Moderat jauh lebih besar dari Agresif, satu indikator saja belum cukup membuat Agresif menang.
const hitungTangan = 0.2009803921568627 / (0.0083333333333333 + 0.2009803921568627 + 0.1264705882352941)
cek('satu indikator (E3 = 1) -> Moderat sekitar 59,86%', satu.dapatDitentukan && satu.profilTertinggi.nama === 'Moderat' && hampir(satu.profilTertinggi.posterior, hitungTangan, 1e-9), satu.profilTertinggi?.posterior)
const agresifMenang = hitungProfilRisiko({ E3: 1, E11: 1, E15: 1, E21: 1, E26: 1, E31: 1 })
cek('enam indikator khas Agresif -> Agresif menang', agresifMenang.profilTertinggi.nama === 'Agresif', agresifMenang.profilTertinggi.nama)
const konservatifMenang = hitungProfilRisiko({ E1: 1, E6: 1, E10: 1, E12: 1, E18: 1, E37: 1 })
cek('enam indikator khas Konservatif -> Konservatif menang', konservatifMenang.profilTertinggi.nama === 'Konservatif', konservatifMenang.profilTertinggi.nama)
const semuaSangat = hitungProfilRisiko(Object.fromEntries(DAFTAR_INDIKATOR.map((i) => [i.kode, 1])))
cek('40 indikator "Sangat Sesuai" -> tetap terhitung', semuaSangat.dapatDitentukan && Number.isFinite(semuaSangat.persentase), semuaSangat.persentase)
const sm = semuaSangat.hasilPerProfil.reduce((a, r) => a + r.posterior, 0)
cek('jumlah posterior = 1 pada 40 indikator', hampir(sm, 1), sm)
let gagalJenis = 0
for (const buruk of [{ E1: 0.5 }, { E1: '1' }, { E99: 1 }, { E1: null }, { E1: NaN }, null, 'abc']) {
  try { hitungProfilRisiko(buruk); gagalJenis++ } catch { /* diharapkan */ }
}
cek('masukan tidak sah ditolak semua (7 kasus)', gagalJenis === 0, `lolos tak semestinya: ${gagalJenis}`)
cek('periksaJawaban({E2:1}) kosong', periksaJawaban({ E2: 1 }).length === 0)

console.log('4. Pengujian acak (2000 kali): jumlah posterior 1, tidak ada NaN, urutan konsisten')
const skala = [0, 0.4, 0.6, 0.8, 1]
let masalah = 0, ditentukan = 0
let benih = 12345
const acak = () => { benih = (benih * 1664525 + 1013904223) % 4294967296; return benih / 4294967296 }
for (let r = 0; r < 2000; r++) {
  const jw = Object.fromEntries(DAFTAR_INDIKATOR.map((i) => [i.kode, skala[Math.floor(acak() * 5)]]))
  const hs = hitungProfilRisiko(jw)
  if (!hs.dapatDitentukan) continue
  ditentukan++
  const s = hs.hasilPerProfil.reduce((a, x) => a + x.posterior, 0)
  if (!hampir(s, 1, 1e-9) || hs.hasilPerProfil.some((x) => !Number.isFinite(x.posterior) || x.posterior < 0 || x.posterior > 1)) masalah++
  if (hs.urutan[0].posterior < hs.urutan[1].posterior) masalah++
}
cek(`${ditentukan} kasus terhitung, ${masalah} bermasalah`, masalah === 0 && ditentukan > 1900)

console.log('5. Struktur formulir: 4 langkah x 10 pernyataan, berurutan E1 sampai E40 seperti di Excel')
const { LANGKAH_KONSULTASI, JUMLAH_PER_LANGKAH } = await import('../src/data/profilRisiko.js')
const kodePerLangkah = LANGKAH_KONSULTASI.map((l) => l.kelompok.flatMap((k) => k.kode))
cek('ada 4 langkah', LANGKAH_KONSULTASI.length === 4)
cek(`setiap langkah berisi tepat ${JUMLAH_PER_LANGKAH} pernyataan`, kodePerLangkah.every((d) => d.length === JUMLAH_PER_LANGKAH), kodePerLangkah.map((d) => d.length).join(','))
cek('setiap langkah punya 2 atau 3 kelompok topik berjudul', LANGKAH_KONSULTASI.every((l) => l.kelompok.length >= 2 && l.kelompok.length <= 3 && l.kelompok.every((k) => k.judul && k.kode.length > 0)))
const semuaKode = kodePerLangkah.flat()
cek('total 40 kode, tanpa duplikat', semuaKode.length === 40 && new Set(semuaKode).size === 40)
cek('urutan tampil persis E1, E2, ..., E40 (sama dengan Excel)', semuaKode.every((k, n) => k === `E${n + 1}`), semuaKode.join(','))
cek('kode sama persis dengan E1 sampai E40 di basis pengetahuan', DAFTAR_INDIKATOR.every((i) => semuaKode.includes(i.kode)) && semuaKode.every((k) => DAFTAR_INDIKATOR.some((i) => i.kode === k)))

console.log(`\nRingkasan: ${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
