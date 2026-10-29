import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { DAFTAR_INDIKATOR, PILIHAN_JAWABAN } from '../data/basisPengetahuan'
import { DAFTAR_PEKERJAAN, JUMLAH_PER_LANGKAH, LANGKAH_KONSULTASI } from '../data/profilRisiko'
import { hitungProfilRisiko } from '../lib/mesinInferensi'
import { simpanRiwayatKonsultasi } from '../lib/riwayatKonsultasi'
import { ambilAngka, periksaAwalanNoHp, periksaNoHp } from '../lib/noHp'
import { periksaKarakterNama, periksaNama, rapikanNama } from '../lib/validasiNama'
import { gulirKe } from '../hooks/useScrollHalus'
import usePenjagaKeluar from '../hooks/usePenjagaKeluar'
import ModalKonfirmasi from '../components/ModalKonfirmasi'
import HasilKonsultasi from './HasilKonsultasi'
import './Konsultasi.css'

const KUNCI_DRAF = 'takar_konsultasi_draf'
const JUMLAH_LANGKAH = LANGKAH_KONSULTASI.length
const JUMLAH_INDIKATOR = DAFTAR_INDIKATOR.length
const NILAI_SAH = new Set(PILIHAN_JAWABAN.map((p) => p.nilai))
const KODE_SAH = new Set(DAFTAR_INDIKATOR.map((i) => i.kode))
const INDIKATOR_PER_KODE = new Map(DAFTAR_INDIKATOR.map((i) => [i.kode, i]))

// Kode indikator per langkah, sesuai urutan tampil (lihat LANGKAH_KONSULTASI).
const KODE_PER_LANGKAH = LANGKAH_KONSULTASI.map((l) => l.kelompok.flatMap((k) => k.kode))

const IDENTITAS_KOSONG = { nama: '', usia: '', pekerjaan: '', pekerjaanLain: '', noHp: '', setuju: false }

// Nomor unik satu konsultasi. Dipakai supaya "coba simpan lagi" tidak membuat riwayat ganda.
function buatIdKonsultasi() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const FORMAT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/* ---------- Pemeriksaan data diri ---------- */

// Untuk isian teks bebas (pekerjaan). Nama memakai rapikanNama di lib/validasiNama.
function rapikanTeks(teks) {
  return teks.trim().replace(/\s+/g, ' ')
}

// Mengembalikan objek kesalahan per kolom. Objek kosong berarti semua kolom sudah benar.
function periksaIdentitas(d) {
  const galat = {}
  const galatNama = periksaNama(d.nama)
  if (galatNama) galat.nama = galatNama

  const usiaTeks = d.usia.trim()
  if (!usiaTeks) galat.usia = 'Usia belum diisi.'
  else if (!/^\d{1,3}$/.test(usiaTeks)) galat.usia = 'Usia ditulis dengan angka saja.'
  else if (Number(usiaTeks) < 17 || Number(usiaTeks) > 90) galat.usia = 'Usia harus antara 17 dan 90 tahun.'

  if (!d.pekerjaan) galat.pekerjaan = 'Pilih pekerjaan Anda.'
  else if (!DAFTAR_PEKERJAAN.includes(d.pekerjaan)) galat.pekerjaan = 'Pilih pekerjaan dari daftar.'
  else if (d.pekerjaan === 'Lainnya') {
    const lain = rapikanTeks(d.pekerjaanLain)
    if (lain.length < 3) galat.pekerjaanLain = 'Tuliskan pekerjaan Anda, minimal 3 huruf.'
    else if (lain.length > 50) galat.pekerjaanLain = 'Terlalu panjang, maksimal 50 karakter.'
  }

  const galatNoHp = periksaNoHp(d.noHp)
  if (galatNoHp) galat.noHp = galatNoHp

  if (d.setuju !== true) galat.setuju = 'Centang persetujuan ini untuk melanjutkan.'
  return galat
}

function bersihkanIdentitas(d) {
  return {
    nama: rapikanNama(d.nama),
    usia: Number(d.usia.trim()),
    pekerjaan: d.pekerjaan === 'Lainnya' ? rapikanTeks(d.pekerjaanLain) : d.pekerjaan,
    noHp: ambilAngka(d.noHp),
  }
}

/* ---------- Draf tersimpan di sesi browser, supaya refresh tidak menghapus isian ---------- */

function langkahPertamaBelumLengkap(jawaban) {
  for (let l = 0; l < JUMLAH_LANGKAH; l++) {
    if (!KODE_PER_LANGKAH[l].every((kode) => jawaban[kode] !== undefined)) return l
  }
  return JUMLAH_LANGKAH - 1
}

function keadaanAwal() {
  const kosong = {
    tahap: 'pembuka',
    identitas: IDENTITAS_KOSONG,
    langkah: 0,
    langkahTerbuka: 0,
    jawaban: {},
    statusSimpan: 'belum',
    idKonsultasi: null,
    waktuSelesai: null,
  }
  try {
    const mentah = sessionStorage.getItem(KUNCI_DRAF)
    if (!mentah) return kosong
    const d = JSON.parse(mentah)
    if (!d || d.v !== 1 || typeof d !== 'object') return kosong

    const jawaban = {}
    if (d.jawaban && typeof d.jawaban === 'object') {
      for (const [kode, nilai] of Object.entries(d.jawaban)) {
        if (KODE_SAH.has(kode) && NILAI_SAH.has(nilai)) jawaban[kode] = nilai
      }
    }
    const i = d.identitas && typeof d.identitas === 'object' ? d.identitas : {}
    const identitas = {
      nama: typeof i.nama === 'string' ? i.nama : '',
      usia: typeof i.usia === 'string' ? i.usia : '',
      pekerjaan: typeof i.pekerjaan === 'string' ? i.pekerjaan : '',
      pekerjaanLain: typeof i.pekerjaanLain === 'string' ? i.pekerjaanLain : '',
      noHp: typeof i.noHp === 'string' ? ambilAngka(i.noHp) : '',
      setuju: i.setuju === true,
    }
    const identitasSah = Object.keys(periksaIdentitas(identitas)).length === 0

    let tahap = d.tahap === 'pertanyaan' || d.tahap === 'hasil' ? d.tahap : 'pembuka'
    if (tahap !== 'pembuka' && !identitasSah) tahap = 'pembuka'

    const batasTerbuka = langkahPertamaBelumLengkap(jawaban)
    const lengkap = Object.keys(jawaban).length === JUMLAH_INDIKATOR
    if (tahap === 'hasil' && !lengkap) tahap = 'pertanyaan'

    const dugaTerbuka = Number.isInteger(d.langkahTerbuka) ? d.langkahTerbuka : 0
    const langkahTerbuka = Math.max(0, Math.min(dugaTerbuka, lengkap ? JUMLAH_LANGKAH - 1 : batasTerbuka))
    const dugaLangkah = Number.isInteger(d.langkah) ? d.langkah : 0
    const langkah = Math.max(0, Math.min(dugaLangkah, langkahTerbuka))

    // Simpan yang sempat "menyimpan" saat halaman dimuat ulang dianggap belum pasti berhasil.
    let statusSimpan = d.statusSimpan === 'tersimpan' ? 'tersimpan' : d.statusSimpan === 'menyimpan' || d.statusSimpan === 'gagal' ? 'gagal' : 'belum'
    if (tahap !== 'hasil') statusSimpan = 'belum'

    const idKonsultasi = typeof d.idKonsultasi === 'string' && FORMAT_ID.test(d.idKonsultasi) ? d.idKonsultasi : null

    // Saat hasil dihitung. Dipakai sebagai "Tanggal konsultasi" di laporan PDF, bukan saat PDF diunduh.
    const waktuSelesai = tahap === 'hasil' && typeof d.waktuSelesai === 'string' && !Number.isNaN(Date.parse(d.waktuSelesai)) ? d.waktuSelesai : null

    return { tahap, identitas, langkah, langkahTerbuka, jawaban, statusSimpan, idKonsultasi, waktuSelesai }
  } catch {
    return kosong
  }
}

/* ---------- Ikon kecil ---------- */

const Ikon = {
  centang: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  panah: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  kembali: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  peringatan: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5.5M12 16.6v.1" />
    </svg>
  ),
  segitiga: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5l9.2 16H2.8L12 3.5z" />
      <path d="M12 10v4.4M12 17.4v.1" />
    </svg>
  ),
  dataDiri: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6" />
    </svg>
  ),
  profil: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  ),
  instrumen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  ),
  hitung: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12.5h2M12 12.5h2M8 16.5h2M12 16.5h4" />
    </svg>
  ),
}

/* ---------- Pilihan jawaban satu pernyataan ---------- */

function PilihanJawaban({ kode, nilai, saatPilih, saatHapus, idGalat }) {
  return (
    <div className="kons__skala" role="radiogroup" aria-describedby={idGalat}>
      {PILIHAN_JAWABAN.map((p, indeks) => {
        const dipilih = nilai === p.nilai
        return (
          <label key={p.nilai} className={`kons__opsi${dipilih ? ' kons__opsi--pilih' : ''}`} title={dipilih ? 'Klik lagi untuk membatalkan jawaban' : undefined}>
            {/* Radio bawaan browser tidak bisa dilepas lewat klik. Klik pada opsi yang sudah terpilih (juga lewat
                spasi di keyboard) ditangani sendiri: jawabannya dihapus, jadi pernyataan kembali belum dijawab. */}
            <input
              type="radio"
              name={`jawab-${kode}`}
              value={p.nilai}
              checked={dipilih}
              onChange={() => saatPilih(kode, p.nilai)}
              onClick={() => {
                if (dipilih) saatHapus(kode)
              }}
              onKeyDown={(e) => {
                // Chrome tidak mengirim klik saat Spasi ditekan pada radio yang sudah terpilih, jadi keyboard ditangani langsung.
                if (e.key === ' ' && dipilih) {
                  e.preventDefault()
                  saatHapus(kode)
                }
              }}
            />
            <span className="kons__sinyal" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <i key={n} className={n <= indeks ? 'kons__sinyal-isi' : ''} />
              ))}
            </span>
            <span className="kons__opsi-teks">{p.label}</span>
          </label>
        )
      })}
    </div>
  )
}

/* ---------- Halaman ---------- */

export default function Konsultasi() {
  const awal = useRef(null)
  if (awal.current === null) awal.current = keadaanAwal()

  const [tahap, setTahap] = useState(awal.current.tahap)
  const [identitas, setIdentitas] = useState(awal.current.identitas)
  const [galat, setGalat] = useState({})
  const [langkah, setLangkah] = useState(awal.current.langkah)
  const [langkahTerbuka, setLangkahTerbuka] = useState(awal.current.langkahTerbuka)
  const [jawaban, setJawaban] = useState(awal.current.jawaban)
  const [sudahCoba, setSudahCoba] = useState(false)
  const [hitungCoba, setHitungCoba] = useState(0)
  const [statusSimpan, setStatusSimpan] = useState(awal.current.statusSimpan)
  const [pesanSimpan, setPesanSimpan] = useState('')
  const [modalKeluar, setModalKeluar] = useState(null) // { jenis: 'pergi' | 'kembali' | 'dataDiri', tujuan? }

  const akar = useRef(null)
  const sedangMenyimpan = useRef(false)
  const idKonsultasi = useRef(awal.current.idKonsultasi)
  const waktuSelesai = useRef(awal.current.waktuSelesai)

  const identitasFinal = useMemo(() => (Object.keys(periksaIdentitas(identitas)).length === 0 ? bersihkanIdentitas(identitas) : null), [identitas])
  const jumlahTerjawab = Object.keys(jawaban).length
  const hasil = useMemo(() => (tahap === 'hasil' && jumlahTerjawab === JUMLAH_INDIKATOR ? hitungProfilRisiko(jawaban) : null), [tahap, jawaban, jumlahTerjawab])

  // Pernyataan pada langkah yang sedang dibuka, dalam urutan tampil, dikelompokkan per topik.
  const kelompokLangkah = useMemo(() => {
    let nomor = langkah * JUMLAH_PER_LANGKAH
    return LANGKAH_KONSULTASI[langkah].kelompok.map((k) => ({
      judul: k.judul,
      butir: k.kode.map((kode) => ({ ...INDIKATOR_PER_KODE.get(kode), nomor: ++nomor })),
    }))
  }, [langkah])
  const daftarLangkah = useMemo(() => kelompokLangkah.flatMap((k) => k.butir), [kelompokLangkah])
  const terjawabLangkah = daftarLangkah.filter((i) => jawaban[i.kode] !== undefined).length
  const belumLangkah = JUMLAH_PER_LANGKAH - terjawabLangkah
  // Pernyataan berikutnya yang belum dijawab, disorot halus setelah pengguna mulai mengisi (tanpa menggulirkan halaman).
  const kodeGiliran = !sudahCoba && terjawabLangkah > 0 && belumLangkah > 0 ? daftarLangkah.find((i) => jawaban[i.kode] === undefined)?.kode : null

  /* ----- Penjaga keluar: pengguna yang sudah mulai mengisi diminta memastikan dulu sebelum pergi ----- */

  // Sudah "mulai" bila salah satu kolom data diri terisi. Di tahap pertanyaan data diri pasti sudah terisi.
  const adaIsian = Boolean(identitas.nama.trim() || identitas.usia || identitas.pekerjaan || identitas.pekerjaanLain.trim() || identitas.noHp || identitas.setuju)
  const penjagaAktif = (tahap === 'pembuka' && adaIsian) || tahap === 'pertanyaan'
  const { lanjutPergi, batalPergi } = usePenjagaKeluar({ aktif: penjagaAktif, saatMinta: setModalKeluar })

  const tetapDiSini = () => {
    const m = modalKeluar
    setModalKeluar(null)
    if (m) batalPergi(m)
  }
  const lanjutKeluar = () => {
    const m = modalKeluar
    setModalKeluar(null)
    if (!m) return
    if (m.jenis === 'dataDiri') {
      setSudahCoba(false)
      setTahap('pembuka')
      return
    }
    lanjutPergi(m)
  }

  /* Draf dicatat di sessionStorage. Bila browser menolak, halaman tetap berjalan normal. */
  useEffect(() => {
    try {
      sessionStorage.setItem(
        KUNCI_DRAF,
        JSON.stringify({ v: 1, tahap, identitas, langkah, langkahTerbuka, jawaban, statusSimpan, idKonsultasi: idKonsultasi.current, waktuSelesai: waktuSelesai.current }),
      )
    } catch {
      /* diabaikan */
    }
  }, [tahap, identitas, langkah, langkahTerbuka, jawaban, statusSimpan])

  /* Setiap pindah tahap atau langkah, halaman naik ke atas dan isinya muncul bergantian.
     Bar aksi di bawah hanya memudar (tanpa bergeser) supaya tombolnya tidak bergerak saat diklik. */
  useLayoutEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)

    // Halaman hasil mengatur animasi masuknya sendiri. Bila di sini ikut dijalankan, dua animasi berebut elemen yang sama.
    if (tahap === 'hasil' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('[data-masuk]:not(.kons__aksi)', {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        ease: 'power3.out',
        stagger: { each: 0.04, amount: 0.4 },
        clearProps: 'opacity,visibility,transform',
      })
      gsap.from('.kons__aksi', { autoAlpha: 0, duration: 0.5, delay: 0.3, ease: 'power2.out', clearProps: 'opacity,visibility' })
    }, akar)
    return () => ctx.revert()
  }, [tahap, langkah])

  /* Kartu yang belum dijawab bergetar sebentar saat tombol lanjut ditekan. */
  useEffect(() => {
    if (hitungCoba === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = akar.current?.querySelectorAll('.kons__kartu--galat, .kons__kolom--galat')
    if (!target || target.length === 0) return
    const tween = gsap.fromTo(target, { x: -9 }, { x: 0, duration: 0.55, ease: 'elastic.out(1, 0.35)', clearProps: 'transform', stagger: 0.04 })
    return () => tween.kill()
  }, [hitungCoba])

  /* ----- Data diri ----- */

  const ubahKolom = (kolom, nilai) => {
    setIdentitas((lama) => ({ ...lama, [kolom]: nilai }))
    if (galat[kolom]) setGalat((lama) => ({ ...lama, [kolom]: undefined }))
  }

  // Nama: karakter terlarang (angka, simbol) langsung diberi tahu saat diketik. Kesalahan lain baru ditampilkan
  // ketika kolom ditinggalkan atau tombol Mulai ditekan, supaya pengguna tidak ditegur saat nama belum selesai ditulis.
  const ubahNama = (teks) => {
    setIdentitas((lama) => ({ ...lama, nama: teks }))
    setGalat((lama) => ({ ...lama, nama: periksaKarakterNama(teks) || undefined }))
  }

  // Nomor HP hanya menerima angka. Awalan yang keliru langsung diberi tahu, dan peringatan hilang begitu awalannya benar.
  const ubahNoHp = (teks) => {
    const angka = ambilAngka(teks)
    setIdentitas((lama) => ({ ...lama, noHp: angka }))
    setGalat((lama) => ({ ...lama, noHp: periksaAwalanNoHp(angka) || undefined }))
  }

  const periksaSatuKolom = (kolom) => {
    const semua = periksaIdentitas(identitas)
    setGalat((lama) => ({ ...lama, [kolom]: semua[kolom] }))
  }

  const kirimIdentitas = (e) => {
    e.preventDefault()
    const semua = periksaIdentitas(identitas)
    setGalat(semua)
    const urutan = ['nama', 'usia', 'pekerjaan', 'pekerjaanLain', 'noHp', 'setuju']
    const pertama = urutan.find((k) => semua[k])
    if (pertama) {
      setHitungCoba((n) => n + 1)
      document.getElementById(`kons-${pertama}`)?.focus({ preventScroll: false })
      return
    }
    setIdentitas((lama) => ({ ...lama, nama: rapikanNama(lama.nama), usia: lama.usia.trim() }))
    setSudahCoba(false)
    setTahap('pertanyaan')
  }

  /* ----- Pertanyaan ----- */

  // Halaman sengaja tidak menggulir sendiri setelah sebuah jawaban dipilih. Kartu yang bergerak di bawah
  // kursor bisa membuat klik berikutnya mendarat di pernyataan yang salah tanpa disadari pengguna.
  const pilihJawaban = useCallback((kode, nilai) => {
    setJawaban((lama) => ({ ...lama, [kode]: nilai }))
  }, [])

  // Membatalkan jawaban: kuncinya dibuang (bukan diisi 0), supaya pernyataan benar-benar kembali belum dijawab.
  // Jawaban "Tidak" tetap jawaban yang sah dan berbeda dari pernyataan yang dikosongkan.
  const hapusJawaban = useCallback((kode) => {
    setJawaban((lama) => {
      if (lama[kode] === undefined) return lama
      const baru = { ...lama }
      delete baru[kode]
      return baru
    })
  }, [])

  // Gulir halus (inersia mouse) dihentikan begitu tombol di bar bawah ditekan, supaya tombol tidak bergeser
  // di antara tekan dan lepas.
  const bekukanGulir = () => {
    const l = window.__lenis
    if (l && l.isScrolling) l.scrollTo(l.scroll, { immediate: true })
  }

  const selesai = () => {
    // Pengaman: bila ada pernyataan yang terlewat, kembali ke langkah yang belum lengkap.
    if (Object.keys(jawaban).length < JUMLAH_INDIKATOR) {
      const l = langkahPertamaBelumLengkap(jawaban)
      setLangkah(l)
      setSudahCoba(true)
      setHitungCoba((n) => n + 1)
      return
    }
    const hitung = hitungProfilRisiko(jawaban)
    setTahap('hasil')
    if (!hitung.dapatDitentukan) {
      idKonsultasi.current = null
      waktuSelesai.current = null
      setStatusSimpan('belum')
      return
    }
    // Pengenal baru untuk setiap hasil yang dihitung. Pengenal yang sama dipakai lagi bila pengguna menekan "coba simpan lagi".
    idKonsultasi.current = buatIdKonsultasi()
    waktuSelesai.current = new Date().toISOString()
    kirimRiwayat(hitung)
  }

  const kirimRiwayat = async (hitung) => {
    if (sedangMenyimpan.current || !identitasFinal) return
    if (!idKonsultasi.current) idKonsultasi.current = buatIdKonsultasi()
    sedangMenyimpan.current = true
    setStatusSimpan('menyimpan')
    setPesanSimpan('')
    const balasan = await simpanRiwayatKonsultasi({ idKonsultasi: idKonsultasi.current, identitas: identitasFinal, jawaban, hasil: hitung })
    sedangMenyimpan.current = false
    if (balasan.berhasil) {
      setStatusSimpan('tersimpan')
    } else {
      setStatusSimpan('gagal')
      setPesanSimpan(balasan.pesan)
    }
  }

  const lanjut = () => {
    if (belumLangkah > 0) {
      setSudahCoba(true)
      setHitungCoba((n) => n + 1)
      const pertama = daftarLangkah.find((i) => jawaban[i.kode] === undefined)
      const el = pertama && document.getElementById(`kons-q-${pertama.kode}`)
      if (el) gulirKe(el, -Math.round(window.innerHeight * 0.26))
      return
    }
    setSudahCoba(false)
    if (langkah < JUMLAH_LANGKAH - 1) {
      setLangkahTerbuka((t) => Math.max(t, langkah + 1))
      setLangkah(langkah + 1)
    } else {
      selesai()
    }
  }

  const kembali = () => {
    if (langkah > 0) {
      setSudahCoba(false)
      setLangkah(langkah - 1)
      return
    }
    // Dari langkah pertama, kembali ke data diri. Bila sudah ada jawaban, pengguna diminta memastikan dulu agar tidak salah tekan.
    if (jumlahTerjawab > 0) {
      setModalKeluar({ jenis: 'dataDiri' })
      return
    }
    setSudahCoba(false)
    setTahap('pembuka')
  }

  const keLangkah = (indeks) => {
    if (indeks > langkahTerbuka || indeks === langkah) return
    setSudahCoba(false)
    setLangkah(indeks)
  }

  /* ----- Hasil ----- */

  const ulangiKonsultasi = () => {
    try {
      sessionStorage.removeItem(KUNCI_DRAF)
    } catch {
      /* diabaikan */
    }
    idKonsultasi.current = null
    waktuSelesai.current = null
    setJawaban({})
    setLangkah(0)
    setLangkahTerbuka(0)
    setSudahCoba(false)
    setStatusSimpan('belum')
    setPesanSimpan('')
    setTahap('pertanyaan')
  }

  const tinjauJawaban = () => {
    setLangkah(0)
    setLangkahTerbuka(JUMLAH_LANGKAH - 1)
    setSudahCoba(false)
    setTahap('pertanyaan')
  }

  /* ---------- Pop up konfirmasi keluar ---------- */

  const persenTotalModal = (jumlahTerjawab / JUMLAH_INDIKATOR) * 100
  let modalEl = null
  if (modalKeluar) {
    const dataDiri = modalKeluar.jenis === 'dataDiri'
    const sedangTanya = tahap === 'pertanyaan'
    let isi
    if (dataDiri) {
      isi = 'Anda akan meninggalkan daftar pernyataan untuk memeriksa data diri. Jawaban yang sudah Anda isi tetap tersimpan, dan bisa dilanjutkan setelah Anda menekan Mulai konsultasi.'
    } else if (sedangTanya && jumlahTerjawab > 0) {
      isi = `Anda baru menjawab ${jumlahTerjawab} dari ${JUMLAH_INDIKATOR} pernyataan, jadi profil risiko Anda belum bisa dihitung. Jawaban Anda tersimpan sementara selama tab ini terbuka, tetapi akan hilang bila tab ditutup.`
    } else if (sedangTanya) {
      isi = 'Anda belum menjawab satu pun pernyataan, jadi profil risiko Anda belum bisa dihitung. Data diri Anda tersimpan sementara selama tab ini terbuka, tetapi akan hilang bila tab ditutup.'
    } else {
      isi = 'Data diri Anda belum lengkap dan konsultasi belum dimulai. Isian ini tersimpan sementara selama tab ini terbuka, tetapi akan hilang bila tab ditutup.'
    }
    modalEl = (
      <ModalKonfirmasi
        judul={dataDiri ? 'Kembali ke data diri?' : 'Tinggalkan konsultasi sekarang?'}
        ikon={dataDiri ? Ikon.dataDiri : Ikon.segitiga}
        nada="emas"
        saatBatal={tetapDiSini}
        tombol={[
          { label: dataDiri ? 'Ya, ke data diri' : 'Ya, tinggalkan', aksi: lanjutKeluar, gaya: dataDiri ? 'garis' : 'bahaya' },
          { label: dataDiri ? 'Tetap di sini' : sedangTanya ? 'Lanjutkan konsultasi' : 'Lanjutkan mengisi', aksi: tetapDiSini, gaya: 'emas', autoFokus: true },
        ]}
      >
        <p>{isi}</p>
        {sedangTanya && (
          <div className="kons__modal-kemajuan">
            <div className="kons__modal-kemajuan-baris">
              <span>Kemajuan Anda</span>
              <strong>{jumlahTerjawab} dari {JUMLAH_INDIKATOR} pernyataan</strong>
            </div>
            <div className="kons__bar kons__bar--tipis" aria-hidden="true">
              <span style={{ width: `${persenTotalModal}%` }} />
            </div>
          </div>
        )}
      </ModalKonfirmasi>
    )
  }

  /* ---------- Tampilan ---------- */

  if (tahap === 'hasil' && hasil) {
    return (
      <div className="kons" ref={akar}>
        <HasilKonsultasi
          identitas={identitasFinal}
          hasil={hasil}
          jawaban={jawaban}
          waktuKonsultasi={waktuSelesai.current ? new Date(waktuSelesai.current) : null}
          statusSimpan={statusSimpan}
          pesanSimpan={pesanSimpan}
          saatSimpanUlang={() => kirimRiwayat(hasil)}
          saatUlangi={ulangiKonsultasi}
          saatTinjau={tinjauJawaban}
        />
      </div>
    )
  }

  if (tahap === 'pertanyaan' && identitasFinal) {
    const persenTotal = (jumlahTerjawab / JUMLAH_INDIKATOR) * 100
    const terakhir = langkah === JUMLAH_LANGKAH - 1
    return (
      <div className="kons kons--tanya" ref={akar}>
        <div className="pembungkus kons__tata">
          {/* Panel samping: posisi langkah dan ringkasan kemajuan */}
          <aside className="kons__samping">
            <p className="label-seksi">Konsultasi untuk</p>
            <p className="kons__pengguna">{identitasFinal.nama}</p>
            <p className="kons__pengguna-info">
              {identitasFinal.usia} tahun, {identitasFinal.pekerjaan}
            </p>

            <ol className="kons__daftar-langkah" aria-label="Daftar langkah">
              {LANGKAH_KONSULTASI.map((l, indeks) => {
                const jumlah = KODE_PER_LANGKAH[indeks].filter((kode) => jawaban[kode] !== undefined).length
                const lengkap = jumlah === JUMLAH_PER_LANGKAH
                const aktif = indeks === langkah
                const terkunci = indeks > langkahTerbuka
                return (
                  <li key={l.judul}>
                    <button
                      type="button"
                      className={`kons__langkah${aktif ? ' kons__langkah--aktif' : ''}${lengkap ? ' kons__langkah--lengkap' : ''}`}
                      onClick={() => keLangkah(indeks)}
                      disabled={terkunci}
                      aria-current={aktif ? 'step' : undefined}
                    >
                      <span className="kons__langkah-no">{lengkap && !aktif ? Ikon.centang : indeks + 1}</span>
                      <span className="kons__langkah-isi">
                        <strong>{l.judul}</strong>
                        <small>{jumlah} dari {JUMLAH_PER_LANGKAH} terjawab</small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="kons__total">
              <div className="kons__total-baris">
                <span>Seluruhnya</span>
                <strong>{jumlahTerjawab} dari {JUMLAH_INDIKATOR}</strong>
              </div>
              <div className="kons__bar" role="progressbar" aria-valuemin={0} aria-valuemax={JUMLAH_INDIKATOR} aria-valuenow={jumlahTerjawab} aria-label="Kemajuan pengisian">
                <span style={{ width: `${persenTotal}%` }} />
              </div>
            </div>
          </aside>

          {/* Daftar pernyataan */}
          <section className="kons__utama" key={langkah}>
            <header className="kons__kepala" data-masuk>
              <p className="label-seksi">Langkah {langkah + 1} dari {JUMLAH_LANGKAH}</p>
              <h1 className="kons__judul">{LANGKAH_KONSULTASI[langkah].judul}</h1>
              <p className="kons__sub">
                Pilih seberapa sesuai setiap pernyataan dengan diri Anda. Tidak ada jawaban benar atau salah, jawab seperti apa adanya.
              </p>
            </header>

            <div className="kons__kartu-daftar">
              {kelompokLangkah.map((k) => (
                <section key={k.judul} className="kons__kelompok" aria-label={k.judul}>
                  <h2 className="kons__kelompok-judul" data-masuk>
                    <span>{k.judul}</span>
                    <small>{k.butir.length} pernyataan</small>
                  </h2>
                  {k.butir.map((i) => {
                    const nilai = jawaban[i.kode]
                    const dijawab = nilai !== undefined
                    const bermasalah = sudahCoba && !dijawab
                    const giliran = i.kode === kodeGiliran
                    return (
                      <article
                        key={i.kode}
                        id={`kons-q-${i.kode}`}
                        className={`kons__kartu${dijawab ? ' kons__kartu--jawab' : ''}${bermasalah ? ' kons__kartu--galat' : ''}${giliran ? ' kons__kartu--giliran' : ''}`}
                        data-masuk
                      >
                        <div className="kons__kartu-atas">
                          <span className="kons__nomor">Pernyataan {i.nomor}</span>
                          {giliran && <span className="kons__giliran">Berikutnya</span>}
                          <span className="kons__tanda" aria-hidden="true">{dijawab ? Ikon.centang : null}</span>
                        </div>
                        <p className="kons__tanya" id={`kons-t-${i.kode}`}>{i.pertanyaan}</p>
                        <PilihanJawaban kode={i.kode} nilai={nilai} saatPilih={pilihJawaban} saatHapus={hapusJawaban} idGalat={bermasalah ? `kons-g-${i.kode}` : undefined} />
                        {bermasalah && (
                          <p className="kons__pesan-galat" id={`kons-g-${i.kode}`} role="alert">
                            {Ikon.peringatan} Pernyataan ini belum dijawab.
                          </p>
                        )}
                      </article>
                    )
                  })}
                </section>
              ))}
            </div>

            {/* Bar aksi menempel di bawah layar selama daftar dibaca */}
            <div className={`kons__aksi${sudahCoba && belumLangkah > 0 ? ' kons__aksi--galat' : ''}`} onPointerDown={bekukanGulir} data-masuk>
              <div className="kons__aksi-info" aria-live="polite">
                {sudahCoba && belumLangkah > 0 ? (
                  <p className="kons__aksi-teks kons__aksi-teks--galat">
                    {Ikon.peringatan} Masih ada {belumLangkah} pernyataan yang belum dijawab
                  </p>
                ) : (
                  <p className="kons__aksi-teks">
                    {terjawabLangkah} dari {JUMLAH_PER_LANGKAH} terjawab
                  </p>
                )}
                <div className="kons__bar kons__bar--tipis" aria-hidden="true">
                  <span style={{ width: `${(terjawabLangkah / JUMLAH_PER_LANGKAH) * 100}%` }} />
                </div>
              </div>
              <div className="kons__aksi-tombol">
                <button type="button" className="tombol tombol--garis kons__tombol-kembali" onClick={kembali}>
                  {Ikon.kembali} {langkah === 0 ? 'Data diri' : 'Kembali'}
                </button>
                <button
                  type="button"
                  className={`tombol tombol--emas kons__tombol-lanjut${belumLangkah > 0 ? ' kons__tombol-lanjut--tertahan' : ''}`}
                  onClick={lanjut}
                  aria-disabled={belumLangkah > 0}
                >
                  {terakhir ? 'Lihat hasil profil' : 'Lanjut'} {Ikon.panah}
                </button>
              </div>
            </div>
          </section>
        </div>
        {modalEl}
      </div>
    )
  }

  /* Tahap pembuka: perkenalan dan formulir data diri */
  const lainnya = identitas.pekerjaan === 'Lainnya'
  return (
    <div className="kons kons--pembuka" ref={akar}>
      <div className="pembungkus kons__pembuka">
        <div className="kons__salam">
          <p className="label-seksi" data-masuk>Konsultasi profil risiko</p>
          <h1 className="kons__judul-besar" data-masuk>
            Kenali dulu seberapa kuat Anda menghadapi risiko, baru tentukan ke mana uang Anda berjalan.
          </h1>
          <p className="kons__pengantar" data-masuk>
            Anda cukup menanggapi 40 pernyataan singkat tentang kebiasaan dan cara pandang Anda soal uang. Sistem pakar TAKAR lalu menghitung profil risiko Anda dan menunjukkan instrumen yang masuk akal untuk dipertimbangkan.
          </p>

          <ul className="kons__angka" data-masuk>
            <li><strong>40</strong><span>pernyataan</span></li>
            <li><strong>4</strong><span>langkah</span></li>
            <li><strong>±7</strong><span>menit</span></li>
          </ul>
        </div>

        <ul className="kons__manfaat">
            <li data-masuk>
              <span className="kons__manfaat-ikon" data-warna="teal">{Ikon.profil}</span>
              <div>
                <h2>Profil risiko beserta persentasenya</h2>
                <p>Konservatif, Moderat, atau Agresif, lengkap dengan seberapa yakin sistem pada hasilnya.</p>
              </div>
            </li>
            <li data-masuk>
              <span className="kons__manfaat-ikon" data-warna="emas">{Ikon.instrumen}</span>
              <div>
                <h2>Instrumen yang layak dipertimbangkan</h2>
                <p>Daftar instrumen yang sejalan dengan profil Anda, dengan penjelasan singkat tiap jenisnya.</p>
              </div>
            </li>
            <li data-masuk>
              <span className="kons__manfaat-ikon" data-warna="terakota">{Ikon.hitung}</span>
              <div>
                <h2>Rincian perhitungan yang bisa diperiksa</h2>
                <p>Anda bisa melihat bagaimana tiap jawaban memengaruhi hasil, jadi tidak ada angka yang muncul begitu saja.</p>
              </div>
            </li>
        </ul>

        <form className="kons__formulir" onSubmit={kirimIdentitas} noValidate data-masuk>
          <div className="kons__formulir-kepala">
            <h2>Sebelum mulai, kenalan dulu</h2>
            <p>Empat data singkat ini membantu kami mencatat riwayat konsultasi. Hanya pengelola TAKAR yang dapat melihatnya.</p>
          </div>

          <div className={`kons__kolom${galat.nama ? ' kons__kolom--galat' : ''}`}>
            <label htmlFor="kons-nama">Nama lengkap</label>
            <input
              id="kons-nama"
              type="text"
              autoComplete="name"
              placeholder="Contoh: Alfian Afandy"
              maxLength={80}
              value={identitas.nama}
              onChange={(e) => ubahNama(e.target.value)}
              onBlur={() => identitas.nama && periksaSatuKolom('nama')}
              aria-invalid={galat.nama ? 'true' : 'false'}
              aria-describedby={galat.nama ? 'kons-nama-galat' : undefined}
            />
            {galat.nama && <p className="kons__pesan-galat" id="kons-nama-galat" role="alert">{Ikon.peringatan} {galat.nama}</p>}
          </div>

          <div className={`kons__kolom${galat.usia ? ' kons__kolom--galat' : ''}`}>
            <label htmlFor="kons-usia">Usia</label>
            <input
              id="kons-usia"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Contoh: 24"
              maxLength={3}
              value={identitas.usia}
              onChange={(e) => ubahKolom('usia', e.target.value.replace(/[^\d]/g, ''))}
              onBlur={() => identitas.usia && periksaSatuKolom('usia')}
              aria-invalid={galat.usia ? 'true' : 'false'}
              aria-describedby={galat.usia ? 'kons-usia-galat' : undefined}
            />
            {galat.usia && <p className="kons__pesan-galat" id="kons-usia-galat" role="alert">{Ikon.peringatan} {galat.usia}</p>}
          </div>

          <div className={`kons__kolom${galat.pekerjaan ? ' kons__kolom--galat' : ''}`}>
            <label htmlFor="kons-pekerjaan">Pekerjaan</label>
            <div className="kons__pilih">
              <select
                id="kons-pekerjaan"
                value={identitas.pekerjaan}
                onChange={(e) => ubahKolom('pekerjaan', e.target.value)}
                aria-invalid={galat.pekerjaan ? 'true' : 'false'}
                aria-describedby={galat.pekerjaan ? 'kons-pekerjaan-galat' : undefined}
              >
                <option value="" disabled>Pilih pekerjaan Anda</option>
                {DAFTAR_PEKERJAAN.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            {galat.pekerjaan && <p className="kons__pesan-galat" id="kons-pekerjaan-galat" role="alert">{Ikon.peringatan} {galat.pekerjaan}</p>}
          </div>

          {lainnya && (
            <div className={`kons__kolom${galat.pekerjaanLain ? ' kons__kolom--galat' : ''}`}>
              <label htmlFor="kons-pekerjaanLain">Tuliskan pekerjaan Anda</label>
              <input
                id="kons-pekerjaanLain"
                type="text"
                maxLength={50}
                placeholder="Contoh: Petani, Pengemudi, Seniman"
                value={identitas.pekerjaanLain}
                onChange={(e) => ubahKolom('pekerjaanLain', e.target.value)}
                aria-invalid={galat.pekerjaanLain ? 'true' : 'false'}
                aria-describedby={galat.pekerjaanLain ? 'kons-pekerjaanLain-galat' : undefined}
              />
              {galat.pekerjaanLain && <p className="kons__pesan-galat" id="kons-pekerjaanLain-galat" role="alert">{Ikon.peringatan} {galat.pekerjaanLain}</p>}
            </div>
          )}

          <div className={`kons__kolom${galat.noHp ? ' kons__kolom--galat' : ''}`}>
            <label htmlFor="kons-noHp">Nomor HP / WhatsApp</label>
            <input
              id="kons-noHp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Contoh: 081234567890"
              maxLength={20}
              value={identitas.noHp}
              onChange={(e) => ubahNoHp(e.target.value)}
              onBlur={() => identitas.noHp && periksaSatuKolom('noHp')}
              aria-invalid={galat.noHp ? 'true' : 'false'}
              aria-describedby={galat.noHp ? 'kons-noHp-galat' : undefined}
            />
            {galat.noHp && <p className="kons__pesan-galat" id="kons-noHp-galat" role="alert">{Ikon.peringatan} {galat.noHp}</p>}
          </div>

          <div className={`kons__setuju${galat.setuju ? ' kons__kolom--galat' : ''}`}>
            <label className="kons__centang">
              <input
                id="kons-setuju"
                type="checkbox"
                checked={identitas.setuju}
                onChange={(e) => ubahKolom('setuju', e.target.checked)}
                aria-invalid={galat.setuju ? 'true' : 'false'}
                aria-describedby={galat.setuju ? 'kons-setuju-galat' : undefined}
              />
              <span className="kons__kotak" aria-hidden="true">{Ikon.centang}</span>
              <span className="kons__centang-teks">
                Saya setuju data diri, nomor HP, dan jawaban saya disimpan sebagai riwayat konsultasi untuk keperluan penelitian dan evaluasi sistem.
              </span>
            </label>
            {galat.setuju && <p className="kons__pesan-galat" id="kons-setuju-galat" role="alert">{Ikon.peringatan} {galat.setuju}</p>}
          </div>

          {/* Mouse down tidak memindahkan fokus dari kolom yang sedang diisi. Tanpa ini, pesan galat kolom itu muncul saat fokus
              lepas, menggeser tombol ke bawah sebelum klik selesai, dan klik pertama pengguna meleset. */}
          <button type="submit" className="tombol tombol--emas kons__mulai" onMouseDown={(e) => e.preventDefault()}>
            Mulai konsultasi {Ikon.panah}
          </button>
          <p className="kons__catatan">Hasil konsultasi nantinya berupa skrining awal profil risiko Anda, disusun dari pengetahuan seorang pakar. Hasilnya tidak menggantikan konsultasi langsung, tetapi menjadi bekal yang berguna untuk melangkah.</p>
        </form>
      </div>
      {modalEl}
    </div>
  )
}