import { DAFTAR_INDIKATOR, PILIHAN_JAWABAN, REKOMENDASI_INSTRUMEN } from '../data/basisPengetahuan.js'
import { KETERANGAN_INSTRUMEN, LABEL_RISIKO, URAIAN_PROFIL } from '../data/profilRisiko.js'

// Pembuat laporan PDF hasil konsultasi TAKAR. Seluruh isi dibuat di browser pengguna dengan jsPDF,
// jadi tidak ada data yang dikirim ke server. Huruf yang dipakai Times (bawaan PDF) supaya tampil
// sama di semua perangkat. Perpustakaan jsPDF baru diunduh ketika tombol "Unduh" ditekan.

/* ---------- Warna dan ukuran ---------- */

const LAUT = [10, 31, 51]
const KRIM = [246, 243, 236]
const KUNYIT = [236, 181, 78]
const TEKS = [30, 34, 40]
const REDUP = [96, 104, 114]
const GARIS = [208, 215, 222]
const ZEBRA = [247, 248, 250]
const LATAR_KOTAK = [241, 244, 247]

const PALET = {
  teal: { isi: [31, 122, 140], teks: [23, 96, 111], lembut: [228, 242, 245] },
  emas: { isi: [227, 163, 43], teks: [138, 95, 12], lembut: [252, 243, 222] },
  terakota: { isi: [217, 105, 79], teks: [170, 66, 42], lembut: [251, 232, 226] },
}

const KIRI = 20
const KANAN = 190
const LEBAR = KANAN - KIRI
const ATAS = 24
const BAWAH = 280
const MM_PER_PT = 0.3528

/* ---------- Pemformatan ---------- */

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dua = (n) => String(n).padStart(2, '0')
const koma = (angka, desimal) => angka.toFixed(desimal).replace('.', ',')

function tanggalIndonesia(d) {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, pukul ${dua(d.getHours())}.${dua(d.getMinutes())}`
}

function persenUtama(x) {
  const bulat = Math.round(x * 100) / 100
  return bulat >= 100 && x < 100 ? 99.99 : bulat
}

function formatPersen(posterior) {
  const x = posterior * 100
  if (x > 0 && x < 0.01) return '< 0,01%'
  if (x > 99.99 && x < 100) return '> 99,99%'
  return `${koma(x, 2)}%`
}

// Bentuk ilmiah seperti di Excel, misalnya 5,4807E-08.
function ilmiah(nilai) {
  if (nilai === 0) return '0'
  const [mantisa, eksponen] = nilai.toExponential(4).split('e')
  const e = Number(eksponen)
  return `${mantisa.replace('.', ',')}E${e < 0 ? '-' : '+'}${dua(Math.abs(e))}`
}

// Font standar PDF hanya mengenal huruf Latin dasar. Tanda kutip dan strip melengkung diganti,
// karakter di luar jangkauan dibuang supaya tidak muncul kotak atau tanda tanya.
const PENGGANTI = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', ' ': ' ' }
function bersih(teks) {
  return String(teks)
    .replace(/[‘’“”–—… ]/g, (c) => PENGGANTI[c])
    .replace(/[^ -~¡-ÿ]/g, '')
}

const labelJawaban = (cf) => {
  const p = PILIHAN_JAWABAN.find((x) => x.nilai === cf)
  return p ? `${p.label} (${koma(cf, 1)})` : String(cf)
}

function namaBerkas(nama, waktu) {
  const potong = nama
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `Laporan-TAKAR-${potong || 'Konsultasi'}-${waktu.getFullYear()}${dua(waktu.getMonth() + 1)}${dua(waktu.getDate())}.pdf`
}

// Catatan keandalan, sama dengan yang tampil di halaman hasil.
function susunCatatan(hasil) {
  const catatan = []
  if (hasil.jumlahIndikatorTeramati < 5) {
    catatan.push(`Baru ${hasil.jumlahIndikatorTeramati} pernyataan yang ditandai sesuai. Hasil ini bisa bergeser bila pernyataan dijawab lebih lengkap, jadi anggap sebagai gambaran awal.`)
  }
  if (hasil.jumlahIndikatorTeramati >= 30) {
    catatan.push('Sebagian besar pernyataan ditandai sesuai, termasuk beberapa yang saling berlawanan. Untuk pola seperti ini sistem cenderung memberi profil Moderat.')
  }
  if (hasil.seri) {
    catatan.push('Dua profil memiliki nilai yang sama persis, sehingga hasil ini sebaiknya dibaca bersama profil lain di samping.')
  }
  return catatan
}

/* ---------- Perakit dokumen ---------- */

export function rakitLaporan(JsPDF, { identitas, jawaban, hasil, nomorKonsultasi, waktu = new Date() }) {
  const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({
    title: `Laporan Konsultasi TAKAR, ${identitas.nama}`,
    subject: 'Hasil konsultasi profil risiko investor',
    author: 'TAKAR, Tentukan Aset Bersama Pakar',
    creator: 'TAKAR',
  })

  const tertinggi = hasil.profilTertinggi
  const uraian = URAIAN_PROFIL[tertinggi.kode]
  const warna = PALET[uraian.warna]
  const nomor = nomorKonsultasi ? `TKR-${String(nomorKonsultasi).slice(0, 8).toUpperCase()}` : null
  let y = ATAS
  let nomorGambar = 0
  let nomorTabel = 0

  const gaya = (jenis, ukuran, warnaTeks = TEKS) => {
    doc.setFont('times', jenis)
    doc.setFontSize(ukuran)
    doc.setTextColor(...warnaTeks)
  }
  const tinggiBaris = (ukuran, faktor = 1.4) => ukuran * MM_PER_PT * faktor
  const halamanBaru = () => {
    doc.addPage()
    y = ATAS
  }
  const ruang = (tinggi) => {
    if (y + tinggi > BAWAH) halamanBaru()
  }

  /* ----- Kop halaman pertama ----- */
  doc.setFillColor(...LAUT)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setFillColor(...KUNYIT)
  doc.rect(0, 36, 210, 1.1, 'F')
  gaya('bold', 25, KRIM)
  doc.setCharSpace(1.2)
  doc.text('TAKAR', KIRI, 19)
  doc.setCharSpace(0)
  gaya('italic', 10.5, KUNYIT)
  doc.text('Tentukan Aset Bersama Pakar', KIRI, 26.5)
  gaya('bold', 12, KRIM)
  doc.text('LAPORAN HASIL KONSULTASI', KANAN, 17.5, { align: 'right' })
  gaya('normal', 10.5, KRIM)
  doc.text('Profil Risiko Investor', KANAN, 24, { align: 'right' })
  gaya('italic', 9, [190, 205, 218])
  doc.text('Sistem pakar Naive Bayes dan Certainty Factor', KANAN, 29.5, { align: 'right' })
  y = 47

  /* ----- Alat tulis ----- */

  function paragraf(teks, { ukuran = 10.5, jenis = 'normal', x = KIRI, lebar = LEBAR, rata = 'justify', warnaTeks = TEKS, jarakBawah = 2 } = {}) {
    gaya(jenis, ukuran, warnaTeks)
    const baris = doc.splitTextToSize(bersih(teks), lebar)
    const h = tinggiBaris(ukuran)
    baris.forEach((b, i) => {
      ruang(h)
      const terakhir = i === baris.length - 1
      if (rata === 'justify' && !terakhir && baris.length > 1) doc.text(b, x, y + h * 0.75, { align: 'justify', maxWidth: lebar })
      else if (rata === 'tengah') doc.text(b, x + lebar / 2, y + h * 0.75, { align: 'center' })
      else doc.text(b, x, y + h * 0.75)
      y += h
    })
    y += jarakBawah
  }

  // butuh = tinggi isi pertama yang harus ikut satu halaman dengan judulnya, supaya judul tidak tertinggal sendirian.
  function judulSeksi(huruf, teks, butuh = 18) {
    ruang(13 + butuh)
    gaya('bold', 12.5, LAUT)
    doc.text(`${huruf}.  ${bersih(teks)}`, KIRI, y + 5)
    doc.setDrawColor(...GARIS)
    doc.setLineWidth(0.3)
    doc.line(KIRI, y + 8, KANAN, y + 8)
    doc.setDrawColor(...KUNYIT)
    doc.setLineWidth(0.9)
    doc.line(KIRI, y + 8, KIRI + 16, y + 8)
    y += 13
  }

  function butirDaftar(daftar, { ukuran = 10.5, warnaTitik = warna.isi } = {}) {
    const h = tinggiBaris(ukuran)
    daftar.forEach((item) => {
      gaya('normal', ukuran, TEKS)
      const baris = doc.splitTextToSize(bersih(item), LEBAR - 7)
      ruang(h * Math.min(baris.length, 2))
      doc.setFillColor(...warnaTitik)
      doc.circle(KIRI + 2, y + h * 0.5, 0.9, 'F')
      baris.forEach((b) => {
        ruang(h)
        gaya('normal', ukuran, TEKS)
        doc.text(b, KIRI + 6, y + h * 0.75)
        y += h
      })
      y += 0.8
    })
    y += 1.5
  }

  // Tabel serbaguna. Sel boleh berupa teks atau { t, tebal, rata }. Baris boleh berupa array sel
  // atau { sel, tebal, sorot, span } dengan span untuk menggabungkan kolom.
  function tabel({ kolom, baris, ukuran = 9.5, keterangan }) {
    const padX = 2.2
    const padY = 1.7
    const h = tinggiBaris(ukuran, 1.3)
    const lebarKolom = kolom.map((k) => k.lebar)

    const ukurBaris = (sel, span, tebalBaris) => {
      let indeksKolom = 0
      return sel.map((s, i) => {
        const lebarSel = lebarKolom.slice(indeksKolom, indeksKolom + (span[i] ?? 1)).reduce((a, b) => a + b, 0)
        const awal = indeksKolom
        indeksKolom += span[i] ?? 1
        const obj = typeof s === 'object' && s !== null ? s : { t: s }
        const tebal = obj.tebal ?? tebalBaris
        gaya(tebal ? 'bold' : 'normal', ukuran)
        return { ...obj, tebal, lebarSel, awal, baris: doc.splitTextToSize(bersih(obj.t), lebarSel - 2 * padX) }
      })
    }

    // Tabel kecil dijaga utuh dalam satu halaman. Tabel panjang boleh berlanjut, kepalanya diulang.
    const tinggiBarisData = (brs) => {
      const sel = Array.isArray(brs) ? brs : brs.sel
      const span = (!Array.isArray(brs) && brs.span) || []
      const tebalBaris = !Array.isArray(brs) && brs.tebal
      return Math.max(...ukurBaris(sel, span, tebalBaris).map((c) => c.baris.length)) * h + 2 * padY
    }
    const tinggiSemuaBaris = baris.reduce((jumlah, brs) => jumlah + tinggiBarisData(brs), 0)
    const tinggiKepalaPerkiraan = h + 2 * padY + 1
    const tinggiKeterangan = keterangan ? 12 : 0
    if (tinggiSemuaBaris <= 80) ruang(tinggiKeterangan + tinggiKepalaPerkiraan + tinggiSemuaBaris + 2)

    if (keterangan) {
      nomorTabel += 1
      ruang(26)
      gaya('bold', 10, TEKS)
      const kalimat = doc.splitTextToSize(bersih(`Tabel ${nomorTabel}. ${keterangan}`), LEBAR)
      kalimat.forEach((b) => {
        doc.text(b, KIRI, y + 4)
        y += tinggiBaris(10, 1.25)
      })
      y += 1.5
    }

    const gambarKepala = () => {
      const tinggiKepala = Math.max(...kolom.map((k) => doc.splitTextToSize(bersih(k.judul), k.lebar - 2 * padX).length)) * h + 2 * padY
      doc.setFillColor(...LAUT)
      doc.rect(KIRI, y, LEBAR, tinggiKepala, 'F')
      let x = KIRI
      kolom.forEach((k) => {
        gaya('bold', ukuran, KRIM)
        const baru = doc.splitTextToSize(bersih(k.judul), k.lebar - 2 * padX)
        baru.forEach((b, i) => {
          const ty = y + padY + h * 0.78 + i * h
          if (k.rata === 'kanan') doc.text(b, x + k.lebar - padX, ty, { align: 'right' })
          else if (k.rata === 'tengah') doc.text(b, x + k.lebar / 2, ty, { align: 'center' })
          else doc.text(b, x + padX, ty)
        })
        x += k.lebar
      })
      y += tinggiKepala
    }

    // Kepala tabel selalu ditemani minimal satu baris data di halaman yang sama.
    const pertama = baris[0]
    const pertamaSel = Array.isArray(pertama) ? pertama : pertama.sel
    const tinggiPertama = Math.max(...ukurBaris(pertamaSel, pertama.span ?? [], false).map((c) => c.baris.length)) * h + 2 * padY
    ruang(14 + tinggiPertama)
    gambarKepala()

    baris.forEach((brs, nomorBaris) => {
      const sel = Array.isArray(brs) ? brs : brs.sel
      const span = (!Array.isArray(brs) && brs.span) || []
      const sorot = !Array.isArray(brs) && brs.sorot
      const tebalBaris = !Array.isArray(brs) && brs.tebal
      const ukuran_ = ukurBaris(sel, span, tebalBaris)
      const tinggi = Math.max(...ukuran_.map((c) => c.baris.length)) * h + 2 * padY
      if (y + tinggi > BAWAH) {
        halamanBaru()
        gambarKepala()
      }
      if (sorot) {
        doc.setFillColor(...warna.lembut)
        doc.rect(KIRI, y, LEBAR, tinggi, 'F')
      } else if (nomorBaris % 2 === 1) {
        doc.setFillColor(...ZEBRA)
        doc.rect(KIRI, y, LEBAR, tinggi, 'F')
      }
      let x = KIRI
      ukuran_.forEach((c) => {
        const k = kolom[c.awal]
        const rata = c.rata ?? k.rata
        gaya(c.tebal ? 'bold' : 'normal', ukuran, TEKS)
        c.baris.forEach((b, i) => {
          const ty = y + padY + h * 0.78 + i * h
          if (rata === 'kanan') doc.text(b, x + c.lebarSel - padX, ty, { align: 'right' })
          else if (rata === 'tengah') doc.text(b, x + c.lebarSel / 2, ty, { align: 'center' })
          else doc.text(b, x + padX, ty)
        })
        x += c.lebarSel
      })
      doc.setDrawColor(...GARIS)
      doc.setLineWidth(0.2)
      doc.line(KIRI, y + tinggi, KANAN, y + tinggi)
      y += tinggi
    })
    y += 5
  }

  /* ----- Pengantar ----- */
  paragraf(
    'Dokumen ini memuat hasil konsultasi Anda pada sistem pakar TAKAR. Profil risiko ditentukan dengan metode Naive Bayes yang dikombinasikan dengan Certainty Factor, berdasarkan 40 pernyataan yang telah Anda jawab. Simpan dokumen ini atau bawa saat Anda ingin membahas hasilnya bersama pakar.',
    { jarakBawah: 5 },
  )

  /* ----- A. Data pengguna ----- */
  judulSeksi('A', 'Data Pengguna', 40)
  const barisData = [
    ['Nama lengkap', identitas.nama],
    ['Usia', `${identitas.usia} tahun`],
    ['Pekerjaan', identitas.pekerjaan],
    ['Tanggal konsultasi', tanggalIndonesia(waktu)],
  ]
  if (nomor) barisData.push(['Nomor konsultasi', nomor])
  const hData = tinggiBaris(10.5, 1.3)
  const tinggiData = barisData.length * (hData + 2.8)
  ruang(tinggiData + 4)
  doc.setDrawColor(...GARIS)
  doc.setLineWidth(0.3)
  doc.roundedRect(KIRI, y, LEBAR, tinggiData, 1.5, 1.5, 'S')
  barisData.forEach(([label, isi], i) => {
    const by = y + i * (hData + 2.8)
    if (i > 0) doc.line(KIRI, by, KANAN, by)
    doc.setFillColor(...LATAR_KOTAK)
    if (i === 0) doc.roundedRect(KIRI, by, 46, hData + 2.8, 1.5, 1.5, 'F')
    else doc.rect(KIRI, by, 46, hData + 2.8, 'F')
    gaya('bold', 10.5, LAUT)
    doc.text(label, KIRI + 3.5, by + hData * 0.78 + 1.4)
    gaya('normal', 10.5, TEKS)
    doc.text(bersih(isi), KIRI + 50, by + hData * 0.78 + 1.4)
  })
  doc.setDrawColor(...GARIS)
  doc.line(KIRI + 46, y, KIRI + 46, y + tinggiData)
  y += tinggiData + 7

  /* ----- B. Hasil profil risiko ----- */
  judulSeksi('B', 'Hasil Profil Risiko', 42)
  doc.setFillColor(...warna.lembut)
  doc.setDrawColor(...warna.isi)
  doc.setLineWidth(0.5)
  doc.roundedRect(KIRI, y, LEBAR, 38, 2.5, 2.5, 'FD')
  gaya('bold', 8.5, REDUP)
  doc.setCharSpace(0.7)
  doc.text('PROFIL RISIKO ANDA', KIRI + 8, y + 9.5)
  doc.setCharSpace(0)
  gaya('bold', 30, warna.teks)
  doc.text(bersih(tertinggi.nama), KIRI + 8, y + 23)
  gaya('italic', 11.5, REDUP)
  doc.text(bersih(uraian.julukan), KIRI + 8, y + 31.5)
  doc.setDrawColor(...warna.isi)
  doc.setLineWidth(0.3)
  doc.line(KIRI + 100, y + 6, KIRI + 100, y + 32)
  const pusat = KIRI + 100 + (LEBAR - 100) / 2
  gaya('bold', 30, warna.teks)
  doc.text(`${koma(persenUtama(hasil.persentase), 2)}%`, pusat, y + 21.5, { align: 'center' })
  gaya('normal', 9.5, REDUP)
  doc.text('tingkat keyakinan sistem', pusat, y + 28.5, { align: 'center' })
  doc.text(`pada profil ${bersih(tertinggi.nama)}`, pusat, y + 33, { align: 'center' })
  y += 38 + 8

  /* ----- C. Distribusi probabilitas posterior ----- */
  const tinggiGrafik = 50
  judulSeksi('C', 'Distribusi Probabilitas Posterior', tinggiGrafik + 12)
  doc.setDrawColor(...GARIS)
  doc.setLineWidth(0.3)
  doc.roundedRect(KIRI, y, LEBAR, tinggiGrafik, 2, 2, 'S')
  const x0 = KIRI + 38
  const panjang = 100
  hasil.urutan.forEach((p, i) => {
    const w = PALET[URAIAN_PROFIL[p.kode].warna]
    const by = y + 7 + i * 12
    gaya('bold', 11, TEKS)
    doc.text(`${bersih(p.nama)} (${p.kode})`, KIRI + 5, by + 4.6)
    if (i === 0) {
      gaya('italic', 8.5, w.teks)
      doc.text('tertinggi', KIRI + 5, by + 8.6)
    }
    doc.setFillColor(234, 238, 242)
    doc.roundedRect(x0, by, panjang, 6.6, 3.3, 3.3, 'F')
    const lebarBatang = Math.max(p.posterior * panjang, 0.8)
    doc.setFillColor(...w.isi)
    if (lebarBatang >= 6.6) doc.roundedRect(x0, by, lebarBatang, 6.6, 3.3, 3.3, 'F')
    else doc.rect(x0, by, lebarBatang, 6.6, 'F')
    gaya('bold', 10.5, i === 0 ? w.teks : TEKS)
    doc.text(formatPersen(p.posterior), x0 + panjang + 4, by + 4.8)
  })
  // Sumbu persen di bawah batang
  const ySumbu = y + 7 + 3 * 12 + 0.5
  doc.setDrawColor(...REDUP)
  doc.setLineWidth(0.25)
  doc.line(x0, ySumbu, x0 + panjang, ySumbu)
  ;[0, 25, 50, 75, 100].forEach((t) => {
    const tx = x0 + (t / 100) * panjang
    doc.line(tx, ySumbu, tx, ySumbu + 1.3)
    gaya('normal', 8, REDUP)
    doc.text(`${t}%`, tx, ySumbu + 4.6, { align: 'center' })
  })
  y += tinggiGrafik + 2
  nomorGambar += 1
  paragraf(`Gambar ${nomorGambar}. Distribusi probabilitas posterior ketiga profil risiko berdasarkan jawaban Anda.`, { jenis: 'italic', ukuran: 9.5, rata: 'tengah', jarakBawah: 6 })

  /* ----- D. Karakteristik dan saran ----- */
  judulSeksi('D', 'Karakteristik dan Saran', 14)
  paragraf(uraian.ringkasan, { jarakBawah: 2.5 })
  susunCatatan(hasil).forEach((c) => paragraf(c, { jenis: 'italic', ukuran: 10, warnaTeks: REDUP, jarakBawah: 2 }))
  y += 1.5
  paragraf('Hal berikut tampak dari jawaban Anda:', { jarakBawah: 1.5 })
  butirDaftar(uraian.ciri)
  gaya('normal', 10.5)
  const barisSaran = doc.splitTextToSize(bersih(uraian.saran), LEBAR - 12)
  const hSaran = tinggiBaris(10.5)
  const tinggiSaran = barisSaran.length * hSaran + 14
  ruang(tinggiSaran + 4)
  doc.setFillColor(...warna.lembut)
  doc.roundedRect(KIRI, y, LEBAR, tinggiSaran, 2, 2, 'F')
  doc.setFillColor(...warna.isi)
  doc.rect(KIRI, y, 1.6, tinggiSaran, 'F')
  gaya('bold', 10.5, warna.teks)
  doc.text('Saran untuk Anda', KIRI + 7, y + 6.5)
  gaya('normal', 10.5, TEKS)
  barisSaran.forEach((b, i) => doc.text(b, KIRI + 7, y + 6.5 + hSaran * 0.95 + i * hSaran + 0.6))
  y += tinggiSaran + 7

  /* ----- E. Rekomendasi instrumen ----- */
  judulSeksi('E', 'Rekomendasi Instrumen Investasi', 50)
  const instrumen = REKOMENDASI_INSTRUMEN[tertinggi.kode] ?? []
  paragraf(`Instrumen berikut ditetapkan pakar untuk profil ${tertinggi.nama}. Pertimbangkan sebagai bahan diskusi, bukan sebagai perintah membeli.`, { jarakBawah: 2.5 })
  tabel({
    keterangan: `Instrumen investasi yang direkomendasikan untuk profil ${tertinggi.nama}.`,
    kolom: [
      { judul: 'No', lebar: 11, rata: 'tengah' },
      { judul: 'Instrumen', lebar: 46 },
      { judul: 'Tingkat risiko', lebar: 30 },
      { judul: 'Penjelasan singkat', lebar: 83 },
    ],
    baris: instrumen.map((nama, i) => {
      const info = KETERANGAN_INSTRUMEN[nama]
      return [String(i + 1), { t: nama, tebal: true }, info ? `${LABEL_RISIKO[info.risiko]} (${info.risiko} dari 5)` : '-', info ? info.uraian : '']
    }),
  })

  /* ----- F. Rincian perhitungan ----- */
  judulSeksi('F', 'Rincian Perhitungan', 40)
  paragraf(
    `Sistem memakai ${hasil.jumlahIndikatorTeramati} pernyataan yang Anda jawab dengan keyakinan lebih dari nol. Untuk setiap profil, nilai awalnya adalah probabilitas prior, lalu dikalikan hasil kali antara likelihood terkoreksi Laplace dan keyakinan Anda pada tiap pernyataan. Hasil kali ini disebut numerator. Posterior diperoleh dengan membagi numerator suatu profil dengan jumlah ketiga numerator.`,
    { jarakBawah: 2 },
  )
  paragraf('P(Ei|Hj) baru = (P(Ei|Hj) × 100 + 1) ÷ 102', { jenis: 'italic', rata: 'tengah', jarakBawah: 3.5 })
  const barisRingkas = hasil.hasilPerProfil.map((p) => ({
    sel: [`${p.kode} ${p.nama}`, koma(p.prior, 2), ilmiah(p.numerator), koma(p.posterior, 7)],
    sorot: p.kode === tertinggi.kode,
    tebal: p.kode === tertinggi.kode,
  }))
  if (hasil.penyebut !== null) {
    barisRingkas.push({ sel: ['Penyebut (jumlah numerator)', ilmiah(hasil.penyebut)], span: [2, 2], tebal: true })
  }
  tabel({
    keterangan: 'Ringkasan perhitungan untuk setiap profil risiko.',
    kolom: [
      { judul: 'Profil', lebar: 60 },
      { judul: 'Prior', lebar: 30, rata: 'kanan' },
      { judul: 'Numerator', lebar: 42, rata: 'kanan' },
      { judul: 'Posterior', lebar: 38, rata: 'kanan' },
    ],
    baris: barisRingkas,
  })
  tabel({
    keterangan: 'Pernyataan yang dipakai dan nilai likelihood terkoreksi Laplace.',
    ukuran: 9,
    kolom: [
      { judul: 'Kode', lebar: 12, rata: 'tengah' },
      { judul: 'Indikator', lebar: 51 },
      { judul: 'Jawaban', lebar: 31 },
      { judul: 'CF', lebar: 10, rata: 'tengah' },
      { judul: 'P(Ei|H1)', lebar: 22, rata: 'kanan' },
      { judul: 'P(Ei|H2)', lebar: 22, rata: 'kanan' },
      { judul: 'P(Ei|H3)', lebar: 22, rata: 'kanan' },
    ],
    baris: hasil.indikatorTeramati.map((i, indeks) => [
      i.kode,
      i.nama,
      PILIHAN_JAWABAN.find((p) => p.nilai === i.cf)?.label ?? String(i.cf),
      koma(i.cf, 1),
      ...hasil.hasilPerProfil.map((p) => koma(p.faktor[indeks].likelihoodBaru, 4)),
    ]),
  })

  /* ----- G. Daftar jawaban lengkap ----- */
  judulSeksi('G', 'Daftar Jawaban Lengkap', 50)
  paragraf('Seluruh jawaban Anda ditulis berurutan sesuai kode indikator E1 sampai E40, sehingga mudah dicocokkan kembali bila hasil ini perlu diperiksa.', { jarakBawah: 2.5 })
  tabel({
    keterangan: 'Jawaban untuk 40 pernyataan.',
    ukuran: 9,
    kolom: [
      { judul: 'Kode', lebar: 13, rata: 'tengah' },
      { judul: 'Pernyataan', lebar: 117 },
      { judul: 'Jawaban Anda', lebar: 40 },
    ],
    baris: DAFTAR_INDIKATOR.map((i) => {
      const cf = jawaban[i.kode] ?? 0
      return [i.kode, i.pertanyaan, { t: labelJawaban(cf), tebal: cf > 0 }]
    }),
  })

  /* ----- H. Catatan penting ----- */
  judulSeksi('H', 'Catatan Penting', 30)
  paragraf(
    'Hasil ini bersifat edukatif dan dihitung dari jawaban Anda saja. Hasil ini bukan nasihat keuangan pribadi, jadi tetap pertimbangkan tujuan dan kondisi keuangan Anda, serta konsultasikan dengan perencana keuangan berizin sebelum berinvestasi.',
    { jarakBawah: 2 },
  )

  /* ----- Kepala halaman lanjutan dan kaki setiap halaman ----- */
  const jumlahHalaman = doc.getNumberOfPages()
  for (let h = 1; h <= jumlahHalaman; h++) {
    doc.setPage(h)
    if (h > 1) {
      gaya('italic', 9, REDUP)
      doc.text('Laporan Hasil Konsultasi Profil Risiko', KIRI, 13)
      doc.text(bersih(identitas.nama), KANAN, 13, { align: 'right' })
      doc.setDrawColor(...GARIS)
      doc.setLineWidth(0.3)
      doc.line(KIRI, 15.5, KANAN, 15.5)
    }
    doc.setDrawColor(...GARIS)
    doc.setLineWidth(0.3)
    doc.line(KIRI, 285, KANAN, 285)
    gaya('normal', 8.5, REDUP)
    doc.text(nomor ? `TAKAR | Tentukan Aset Bersama Pakar | ${nomor}` : 'TAKAR | Tentukan Aset Bersama Pakar', KIRI, 290)
    doc.text(`Halaman ${h} dari ${jumlahHalaman}`, KANAN, 290, { align: 'right' })
  }

  return doc
}

// Dipanggil dari halaman hasil. jsPDF diunduh baru saat dibutuhkan agar halaman lain tetap ringan.
export async function buatLaporanPdf(data) {
  const { jsPDF } = await import('jspdf')
  // Dari halaman riwayat admin, waktu konsultasi asli dikirim agar PDF memuat tanggal saat konsultasi terjadi.
  const waktu = data.waktu instanceof Date && !Number.isNaN(data.waktu.getTime()) ? data.waktu : new Date()
  const doc = rakitLaporan(jsPDF, { ...data, waktu })
  const berkas = namaBerkas(data.identitas.nama, waktu)
  doc.save(berkas)
  return { namaBerkas: berkas, jumlahHalaman: doc.getNumberOfPages() }
}