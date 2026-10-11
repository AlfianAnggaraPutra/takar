import {
  DAFTAR_INDIKATOR,
  DAFTAR_PROFIL,
  PARAMETER_LAPLACE,
  PILIHAN_JAWABAN,
  PROBABILITAS_PRIOR,
} from '../data/basisPengetahuan.js'

// Mesin inferensi TAKAR: Naive Bayes dengan koreksi Laplace, dikombinasikan
// dengan Certainty Factor dari pengguna.
//
//   P(Ei|Hj) baru = (P(Ei|Hj) x n + 1) / (n + k)
//   Numerator j   = P(Hj) x hasil kali [ P(Ei|Hj) baru x CF pengguna,i ]   untuk Ei yang teramati (CF > 0)
//   Posterior j   = Numerator j / jumlah seluruh Numerator

const NILAI_CF_SAH = new Set(PILIHAN_JAWABAN.map((p) => p.nilai))

// Menerapkan koreksi Laplace pada satu nilai likelihood.
export function koreksiLaplace(likelihoodAwal) {
  const { n, k } = PARAMETER_LAPLACE
  return (likelihoodAwal * n + 1) / (n + k)
}

// Pengecekan jawaban sebelum dihitung. Mengembalikan daftar kesalahan (kosong bila aman).
export function periksaJawaban(jawaban) {
  const kesalahan = []
  if (jawaban === null || typeof jawaban !== 'object') {
    return ['Jawaban harus berupa objek berisi kode indikator dan nilai keyakinan.']
  }
  const kodeSah = new Set(DAFTAR_INDIKATOR.map((i) => i.kode))
  for (const [kode, nilai] of Object.entries(jawaban)) {
    if (!kodeSah.has(kode)) kesalahan.push(`Kode indikator tidak dikenal: ${kode}`)
    else if (!NILAI_CF_SAH.has(nilai)) kesalahan.push(`Nilai ${String(nilai)} pada ${kode} tidak ada dalam skala jawaban.`)
  }
  return kesalahan
}

// Menghitung profil risiko dari jawaban pengguna.
// jawaban: { E1: 0, E2: 1, E7: 0.8, ... }  (indikator yang tidak ditulis dianggap 0 / "Tidak").
export function hitungProfilRisiko(jawaban) {
  const kesalahan = periksaJawaban(jawaban)
  if (kesalahan.length > 0) throw new Error(kesalahan.join(' '))

  // E_obs: hanya indikator dengan CF pengguna lebih dari 0.
  const indikatorTeramati = DAFTAR_INDIKATOR.filter((i) => (jawaban[i.kode] ?? 0) > 0)

  // Kasus tidak ada satu pun indikator yang sesuai: profil belum bisa ditentukan.
  if (indikatorTeramati.length === 0) {
    return {
      dapatDitentukan: false,
      alasan: 'Tidak ada pernyataan yang Anda tandai sesuai, sehingga profil risiko belum dapat ditentukan.',
      jumlahIndikatorTeramati: 0,
    }
  }

  // Numerator tiap profil, lengkap dengan rincian faktor supaya bisa ditampilkan di halaman hasil.
  const rincian = DAFTAR_PROFIL.map((profil) => {
    const prior = PROBABILITAS_PRIOR[profil.kode]
    const faktor = indikatorTeramati.map((indikator) => {
      const likelihoodBaru = koreksiLaplace(indikator.likelihood[profil.kode])
      const cf = jawaban[indikator.kode]
      return {
        kode: indikator.kode,
        nama: indikator.nama,
        cf,
        likelihoodAwal: indikator.likelihood[profil.kode],
        likelihoodBaru,
        nilai: likelihoodBaru * cf,
      }
    })
    const numerator = faktor.reduce((hasil, f) => hasil * f.nilai, prior)
    const logNumerator = faktor.reduce((hasil, f) => hasil + Math.log(f.nilai), Math.log(prior))
    return { ...profil, prior, faktor, numerator, logNumerator }
  })

  // Penyebut = jumlah seluruh numerator. Bila hasil kali sangat kecil hingga dianggap 0 oleh
  // komputer, normalisasi dialihkan ke skala logaritma (hasilnya setara secara matematis).
  const penyebut = rincian.reduce((jumlah, r) => jumlah + r.numerator, 0)
  let posterior
  if (Number.isFinite(penyebut) && penyebut > 0) {
    posterior = rincian.map((r) => r.numerator / penyebut)
  } else {
    const terbesar = Math.max(...rincian.map((r) => r.logNumerator))
    const eksponen = rincian.map((r) => Math.exp(r.logNumerator - terbesar))
    const total = eksponen.reduce((a, b) => a + b, 0)
    posterior = eksponen.map((e) => e / total)
  }

  const hasilPerProfil = rincian.map((r, indeks) => ({
    kode: r.kode,
    nama: r.nama,
    prior: r.prior,
    numerator: r.numerator,
    posterior: posterior[indeks],
    faktor: r.faktor,
  }))

  const urutan = [...hasilPerProfil].sort((a, b) => b.posterior - a.posterior)
  const tertinggi = urutan[0]
  // Dua profil dengan nilai posterior yang sama persis dianggap seri.
  const seri = urutan.length > 1 && urutan[1].posterior === tertinggi.posterior

  return {
    dapatDitentukan: true,
    jumlahIndikatorTeramati: indikatorTeramati.length,
    indikatorTeramati: indikatorTeramati.map((i) => ({ kode: i.kode, nama: i.nama, cf: jawaban[i.kode] })),
    penyebut: Number.isFinite(penyebut) && penyebut > 0 ? penyebut : null,
    hasilPerProfil,
    urutan,
    profilTertinggi: tertinggi,
    persentase: tertinggi.posterior * 100,
    seri,
  }
}