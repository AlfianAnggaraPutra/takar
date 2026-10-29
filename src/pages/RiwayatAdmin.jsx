import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ModalKonfirmasi from '../components/ModalKonfirmasi'
import usePenjagaKeluar from '../hooks/usePenjagaKeluar'
import useBatasDiam from '../hooks/useBatasDiam'
import useKoneksi from '../hooks/useKoneksi'
import { BATAS_PUTUS_MS, PERINGATAN_MS, catatPesanSesi } from '../lib/batasSesi'
import { keluarAdmin, useSesiAdmin } from '../lib/autentikasi'
import { hitungProfilRisiko, periksaJawaban } from '../lib/mesinInferensi'
import { nilaiKepastianDariJawaban } from '../lib/kepastianHasil'
import { DAFTAR_PROFIL_FILTER, UKURAN_HALAMAN, ambilRiwayat, ambilSemuaRiwayat, ambilStatistik, formatWaktu } from '../lib/riwayatAdmin'
import { formatNoHp } from '../lib/noHp'
import './RiwayatAdmin.css'

// Pembuat PDF dimuat terpisah dan hanya sekali. Bila gagal dimuat, browser menyimpan kegagalannya,
// jadi satu-satunya cara mencoba lagi adalah memuat ulang halaman.
let modulLaporan = null
const muatModulLaporan = () => {
  if (!modulLaporan) modulLaporan = import('../lib/buatLaporanPdf')
  return modulLaporan
}

// Pembuat Excel (exceljs berukuran besar) juga dimuat terpisah dan hanya saat tombol ekspor ditekan.
let modulExcel = null
const muatModulExcel = () => {
  if (!modulExcel) {
    modulExcel = import('../lib/eksporExcel').catch((e) => {
      modulExcel = null
      throw e
    })
  }
  return modulExcel
}

const JEDA_CARI_MS = 350
// Selama panel terbuka dan tab terlihat, data disegarkan sendiri tiap beberapa detik tanpa mengganggu tampilan,
// supaya konsultasi yang baru masuk muncul tanpa perlu menekan Muat ulang.
const JEDA_SEGAR_MS = 15000
const WARNA_PROFIL = { Konservatif: 'teal', Moderat: 'emas', Agresif: 'terakota' }

/* ---------- Pembantu ---------- */

// 83 detik menjadi "1:23".
const formatDurasi = (detik) => `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`

/* ---------- Ikon ---------- */

const dasar = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const Ikon = {
  cari: (
    <svg {...dasar}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  ),
  segarkan: (
    <svg {...dasar}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" />
    </svg>
  ),
  unduh: (
    <svg {...dasar} width={16} height={16} strokeWidth={2.1}>
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  ),
  excel: (
    <svg {...dasar} width={16} height={16} strokeWidth={2}>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M4 9h16M4 14.5h16M10 9v11.5" />
    </svg>
  ),
  jam: (
    <svg {...dasar} width={28} height={28}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  putus: (
    <svg {...dasar} width={20} height={20}>
      <path d="M5 12.5a10 10 0 0 1 4-2.4M19 12.5a10 10 0 0 0-3.2-2M8.5 16a5 5 0 0 1 2.2-1.2M15.5 16a5 5 0 0 0-1.5-1M12 19.5h.01M4 4l16 16" />
    </svg>
  ),
  pulih: (
    <svg {...dasar} width={20} height={20}>
      <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />
    </svg>
  ),
  keluar: (
    <svg {...dasar} width={16} height={16}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
    </svg>
  ),
  kiri: (
    <svg {...dasar} width={16} height={16} strokeWidth={2.2}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  ),
  kanan: (
    <svg {...dasar} width={16} height={16} strokeWidth={2.2}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  kosong: (
    <svg {...dasar} width={30} height={30} strokeWidth={1.6}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h4" />
    </svg>
  ),
  peringatan: (
    <svg {...dasar} width={28} height={28} strokeWidth={1.8}>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 10v4.4M12 17.4v.1" />
    </svg>
  ),
  centang: (
    <svg {...dasar} width={17} height={17} strokeWidth={2.6}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
  tutup: (
    <svg {...dasar} width={15} height={15} strokeWidth={2.4}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  total: (
    <svg {...dasar} width={20} height={20}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
}

/* ---------- Angka yang naik pelan-pelan ---------- */

function Angka({ nilai }) {
  const [tampil, setTampil] = useState(nilai ?? 0)
  const terakhir = useRef(0)
  useEffect(() => {
    if (nilai === null || nilai === undefined) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      terakhir.current = nilai
      setTampil(nilai)
      return
    }
    const bantu = { v: terakhir.current }
    const tween = gsap.to(bantu, {
      v: nilai,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        terakhir.current = bantu.v
        setTampil(Math.round(bantu.v))
      },
      onComplete: () => {
        terakhir.current = nilai
        setTampil(nilai)
      },
    })
    return () => tween.kill()
  }, [nilai])
  if (nilai === null || nilai === undefined) return <>-</>
  return <>{tampil.toLocaleString('id-ID')}</>
}

/* ---------- Nomor halaman dengan titik-titik ---------- */

function nomorHalaman(sekarang, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const hasil = new Set([1, total, sekarang, sekarang - 1, sekarang + 1])
  if (sekarang <= 3) [2, 3, 4].forEach((n) => hasil.add(n))
  if (sekarang >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => hasil.add(n))
  const urut = [...hasil].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const keluar = []
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) keluar.push('...')
    keluar.push(n)
  })
  return keluar
}

/* ---------- Halaman ---------- */

export default function RiwayatAdmin() {
  const { memuat, sesi } = useSesiAdmin()
  const navigasi = useNavigate()

  const [halaman, setHalaman] = useState(1)
  const [cari, setCari] = useState('')
  const [cariTunda, setCariTunda] = useState('')
  const [profil, setProfil] = useState('')
  const [versi, setVersi] = useState(0)

  // "halaman" di dalam data mencatat halaman milik baris yang sedang tampil. Saat berpindah halaman,
  // baris lama sempat bertahan sampai data baru tiba, dan nomor urutnya harus tetap cocok dengan baris itu.
  const [data, setData] = useState({ baris: [], total: 0, halaman: 1 })
  const [status, setStatus] = useState('memuat') // memuat | siap | galat
  const [galat, setGalat] = useState(null)
  const [pernahMuat, setPernahMuat] = useState(false)
  const [statistik, setStatistik] = useState({ total: null, Konservatif: null, Moderat: null, Agresif: null })

  const [sedangUnduh, setSedangUnduh] = useState(() => new Set())
  const [sedangEkspor, setSedangEkspor] = useState(false)
  const [toast, setToast] = useState(null) // { jenis, pesan, muatUlang }
  const [modalKeluar, setModalKeluar] = useState(false)
  const [sedangKeluar, setSedangKeluar] = useState(false)
  // Permintaan pindah halaman yang dicegat (klik menu header atau tombol kembali) dan menunggu jawaban pop up.
  const [modalPindah, setModalPindah] = useState(null)
  const [sedangPindah, setSedangPindah] = useState(false)
  const emailTerakhir = useRef('')
  const diamDiam = useRef(false)
  const masihTerpasang = useRef(true)
  if (sesi?.user?.email) emailTerakhir.current = sesi.user.email

  useEffect(() => {
    masihTerpasang.current = true
    return () => {
      masihTerpasang.current = false
    }
  }, [])

  // Tombol Logout di header meminta pop up konfirmasi keluar dari halaman ini. Menandai permintaan sebagai
  // ditangani supaya header tidak mengeluarkan admin sendiri tanpa konfirmasi.
  useEffect(() => {
    const saatMinta = (e) => {
      if (e.detail) e.detail.ditangani = true
      if (sedangKeluar || sedangPindah) return
      setModalPindah(null)
      setModalKeluar(true)
    }
    window.addEventListener('takar:minta-keluar-admin', saatMinta)
    return () => window.removeEventListener('takar:minta-keluar-admin', saatMinta)
  }, [sedangKeluar, sedangPindah])

  const akar = useRef(null)
  const kartuTabel = useRef(null)
  const idPermintaan = useRef(0)
  const idToast = useRef(0)
  const gulirKeTabel = useRef(false)
  const cariBerlaku = useRef('')

  const totalHalaman = Math.max(1, Math.ceil(data.total / UKURAN_HALAMAN))
  const adaSaringan = Boolean(cariTunda.trim() || profil)
  const sudahMasuk = Boolean(sesi)
  const { lanjutPergi, batalPergi } = usePenjagaKeluar({
    aktif: sudahMasuk && !sedangPindah && !sedangKeluar,
    saatMinta: (permintaan) => {
      setModalKeluar(false)
      setModalPindah(permintaan)
    },
  })

  // Sesi berakhir bukan karena pilihan pengguna (diam terlalu lama, koneksi terputus terlalu lama, atau ditolak server).
  // Alasannya dicatat dulu agar halaman login bisa menjelaskannya, baru akun dikeluarkan.
  const sedangBerakhir = useRef(false)
  const akhiriSesi = useCallback(
    async (alasan) => {
      if (sedangBerakhir.current) return
      sedangBerakhir.current = true
      catatPesanSesi(alasan)
      setModalKeluar(false)
      setModalPindah(null)
      setSedangPindah(true)
      await keluarAdmin()
      if (masihTerpasang.current) navigasi('/admin', { replace: true })
    },
    [navigasi],
  )

  const segarkanSenyap = useCallback(() => {
    diamDiam.current = true
    setVersi((v) => v + 1)
  }, [])

  const penjagaSesiAktif = sudahMasuk && !sedangPindah && !sedangKeluar
  const { sisaDetik, perpanjang } = useBatasDiam({ aktif: penjagaSesiAktif, saatBerakhir: () => akhiriSesi('diam') })
  const koneksi = useKoneksi({
    aktif: penjagaSesiAktif,
    saatKadaluarsa: () => akhiriSesi('koneksi'),
    saatPulih: segarkanSenyap,
  })
  const peringatanTampil = sisaDetik !== null && penjagaSesiAktif
  const eksporBerjalan = useRef(false)

  /* ----- Pencarian: ditunda sebentar agar tidak menembak server di setiap ketukan ----- */
  useEffect(() => {
    const id = setTimeout(() => {
      if (cari === cariBerlaku.current) return
      cariBerlaku.current = cari
      setCariTunda(cari)
      setHalaman(1)
    }, JEDA_CARI_MS)
    return () => clearTimeout(id)
  }, [cari])

  /* ----- Memuat satu halaman riwayat. Hanya jawaban dari permintaan terbaru yang dipakai. ----- */
  useEffect(() => {
    if (!sudahMasuk) return
    const saya = ++idPermintaan.current
    const senyap = diamDiam.current
    diamDiam.current = false
    if (!senyap) setStatus('memuat')
    ambilRiwayat({ halaman, cari: cariTunda, profil })
      .then((hasil) => {
        if (saya !== idPermintaan.current) return
        // Halaman yang diminta sudah melewati data (misalnya data berkurang): mundur ke halaman terakhir.
        const terakhir = Math.max(1, Math.ceil(hasil.total / UKURAN_HALAMAN))
        if (hasil.baris.length === 0 && hasil.total > 0 && halaman > terakhir) {
          setHalaman(terakhir)
          return
        }
        setData({ ...hasil, halaman, cari: cariTunda, profil })
        setGalat(null)
        setStatus('siap')
        setPernahMuat(true)
        koneksi.laporBerhasil()
      })
      .catch(async (e) => {
        if (saya !== idPermintaan.current) return
        if (e?.perluMasukLagi) {
          akhiriSesi('kedaluwarsa')
          return
        }
        if (e?.jaringan) koneksi.laporGalatJaringan()
        // Penyegaran otomatis yang gagal diabaikan: data yang sudah tampil tetap dipakai dan dicoba lagi sebentar lagi.
        if (senyap) return
        setGalat(e?.message || 'Riwayat belum bisa dimuat. Coba lagi beberapa saat lagi.')
        setStatus('galat')
      })
  }, [sudahMasuk, halaman, cariTunda, profil, versi])

  /* ----- Penyegaran otomatis: tiap beberapa detik dan saat pengguna kembali ke tab ini ----- */
  useEffect(() => {
    if (!sudahMasuk) return
    let terakhir = Date.now()
    const segarkan = () => {
      if (document.visibilityState !== 'visible') return
      terakhir = Date.now()
      segarkanSenyap()
    }
    const saatTampil = () => {
      if (document.visibilityState === 'visible' && Date.now() - terakhir > 3000) segarkan()
    }
    const id = setInterval(segarkan, JEDA_SEGAR_MS)
    document.addEventListener('visibilitychange', saatTampil)
    window.addEventListener('focus', saatTampil)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', saatTampil)
      window.removeEventListener('focus', saatTampil)
    }
  }, [sudahMasuk, segarkanSenyap])

  /* ----- Ringkasan angka di atas ----- */
  useEffect(() => {
    if (!sudahMasuk) return
    let aktif = true
    ambilStatistik().then((s) => {
      if (aktif) setStatistik(s)
    })
    return () => {
      aktif = false
    }
  }, [sudahMasuk, versi])

  /* ----- Pembuat PDF disiapkan lebih awal agar tombol unduh terasa cepat ----- */
  useEffect(() => {
    if (!pernahMuat) return
    const id = setTimeout(() => muatModulLaporan().catch(() => {}), 1200)
    return () => clearTimeout(id)
  }, [pernahMuat])

  /* ----- Animasi masuk ----- */
  // Bergantung pada ada atau tidaknya sesi, bukan pada objek sesinya. Supabase mengirim objek sesi baru setiap kali tab
  // kembali aktif atau token diperbarui, dan itu tidak boleh membuat header, statistik, dan tabel memudar masuk lagi.
  useEffect(() => {
    if (memuat || !sudahMasuk || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const konteks = gsap.context(() => {
      gsap.from('[data-riw-masuk]', { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.1, clearProps: 'transform,opacity' })
    }, akar)
    return () => konteks.revert()
  }, [memuat, sudahMasuk])

  /* ----- Setelah ganti halaman, gulir ke atas tabel agar baris pertama langsung terlihat ----- */
  useEffect(() => {
    if (status !== 'siap' || !gulirKeTabel.current) return
    gulirKeTabel.current = false
    const el = kartuTabel.current
    if (!el) return
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -96, duration: 0.8 })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
  }, [status])

  /* ----- Toast hilang sendiri ----- */
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), toast.jenis === 'galat' ? 7000 : 3800)
    return () => clearTimeout(id)
  }, [toast])

  const tampilToast = useCallback((jenis, pesan, muatUlang = false) => {
    idToast.current += 1
    setToast({ id: idToast.current, jenis, pesan, muatUlang })
  }, [])

  const keHalaman = (n) => {
    if (n < 1 || n > totalHalaman || n === halaman || status === 'memuat') return
    gulirKeTabel.current = true
    setHalaman(n)
  }

  const pilihProfil = (p) => {
    if (p === profil) return
    setProfil(p)
    setHalaman(1)
  }

  const kosongkanCari = () => {
    cariBerlaku.current = ''
    setCari('')
    setCariTunda('')
    setHalaman(1)
  }

  const hapusSaringan = () => {
    cariBerlaku.current = ''
    setCari('')
    setCariTunda('')
    setProfil('')
    setHalaman(1)
  }

  const muatUlangData = () => setVersi((v) => v + 1)

  /* ----- Unduh PDF satu konsultasi. Laporan dibentuk ulang dari jawaban yang tersimpan. ----- */
  const unduh = async (b) => {
    const id = b.id_konsultasi
    if (sedangUnduh.has(id)) return
    setSedangUnduh((s) => new Set(s).add(id))
    try {
      let modul
      try {
        modul = await muatModulLaporan()
      } catch (e) {
        console.error('Gagal memuat pembuat laporan PDF:', e)
        tampilToast('galat', 'Pembuat PDF gagal dimuat. Muat ulang halaman lalu coba lagi.', true)
        return
      }
      let jawaban = b.jawaban_indikator
      if (typeof jawaban === 'string') {
        try {
          jawaban = JSON.parse(jawaban)
        } catch {
          jawaban = null
        }
      }
      if (!jawaban || typeof jawaban !== 'object' || periksaJawaban(jawaban).length > 0) {
        tampilToast('galat', `Data jawaban milik ${b.nama} tidak lengkap, jadi PDF belum bisa dibuat.`)
        return
      }
      const hasil = hitungProfilRisiko(jawaban)
      if (!hasil.dapatDitentukan) {
        tampilToast('galat', `Jawaban milik ${b.nama} belum memuat pernyataan yang sesuai, jadi PDF belum bisa dibuat.`)
        return
      }
      await modul.buatLaporanPdf({
        identitas: { nama: b.nama, usia: b.usia, pekerjaan: b.pekerjaan || '-', noHp: b.no_hp || '' },
        jawaban,
        hasil,
        waktu: new Date(b.waktu_konsultasi),
      })
      tampilToast('sukses', `PDF konsultasi ${b.nama} sudah diunduh.`)
    } catch (e) {
      console.error('Gagal membuat PDF riwayat:', e)
      tampilToast('galat', 'PDF belum bisa dibuat. Coba lagi beberapa saat lagi.')
    } finally {
      setSedangUnduh((s) => {
        const baru = new Set(s)
        baru.delete(id)
        return baru
      })
    }
  }

  /* ----- Unduh seluruh riwayat sebagai Excel (cadangan dan laporan) ----- */
  const unduhExcel = async () => {
    if (eksporBerjalan.current) return
    eksporBerjalan.current = true
    setSedangEkspor(true)
    try {
      let modul
      try {
        modul = await muatModulExcel()
      } catch (e) {
        console.error('Gagal memuat pembuat Excel:', e)
        tampilToast('galat', 'Pembuat Excel gagal dimuat. Muat ulang halaman lalu coba lagi.', true)
        return
      }
      let riwayat
      try {
        riwayat = await ambilSemuaRiwayat()
      } catch (e) {
        if (e?.perluMasukLagi) {
          akhiriSesi('kedaluwarsa')
          return
        }
        tampilToast('galat', e?.message || 'Data belum bisa diambil. Coba lagi beberapa saat lagi.')
        return
      }
      if (riwayat.length === 0) {
        tampilToast('galat', 'Belum ada riwayat konsultasi yang bisa diekspor.')
        return
      }
      const { buffer, nama, jumlah } = await modul.buatBerkasExcel(riwayat)
      modul.unduhBerkas(buffer, nama)
      tampilToast('sukses', `Excel berisi ${jumlah.toLocaleString('id-ID')} konsultasi sudah diunduh.`)
    } catch (e) {
      console.error('Gagal membuat Excel riwayat:', e)
      tampilToast('galat', 'Excel belum bisa dibuat. Coba lagi beberapa saat lagi.')
    } finally {
      eksporBerjalan.current = false
      setSedangEkspor(false)
    }
  }

  const konfirmasiKeluar = async () => {
    if (sedangKeluar) return
    setSedangKeluar(true)
    await keluarAdmin()
    navigasi('/admin', { replace: true })
  }

  // Pengguna memilih pindah halaman: keluar dari akun admin dulu, baru berpindah. Halaman tetap tampil selama proses
  // keluar supaya tidak sempat dialihkan ke halaman login.
  const konfirmasiPindah = async () => {
    const permintaan = modalPindah
    if (!permintaan || sedangPindah) return
    setSedangPindah(true)
    await keluarAdmin()
    lanjutPergi(permintaan)
    // Bila tombol kembali ternyata tidak punya halaman tujuan, jangan biarkan pengguna tertahan di panel tanpa sesi.
    if (permintaan.jenis === 'kembali') {
      window.setTimeout(() => {
        if (masihTerpasang.current) navigasi('/admin', { replace: true })
      }, 1200)
    }
  }

  const batalPindah = () => {
    if (sedangPindah) return
    batalPergi(modalPindah)
    setModalPindah(null)
  }

  // Peringatan sesi hampir berakhir. Menutup pop up dengan cara apa pun (tombol, Esc, klik di luar) berarti tetap masuk.
  const tetapMasuk = () => {
    perpanjang()
    tampilToast('sukses', 'Sesi diperpanjang. Anda tetap masuk sebagai admin.')
  }
  const keluarSekarang = () => {
    perpanjang()
    konfirmasiKeluar()
  }

  // Peringatan sesi didahulukan: pop up lain yang sedang terbuka ditutup agar tidak bertumpuk.
  useEffect(() => {
    if (!peringatanTampil) return
    setModalKeluar(false)
    if (modalPindah) {
      batalPergi(modalPindah)
      setModalPindah(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peringatanTampil])

  /* ----- Penjaga akses ----- */
  if (memuat) {
    return (
      <section className="riw riw--muat">
        <div className="riw__periksa" role="status">
          <span className="riw__putar riw__putar--besar" aria-hidden="true" />
          Memeriksa sesi admin...
        </div>
      </section>
    )
  }
  if (!sesi && !sedangPindah) return <Navigate to="/admin" replace />

  const awal = data.total === 0 ? 0 : (data.halaman - 1) * UKURAN_HALAMAN + 1
  const akhir = Math.min(data.halaman * UKURAN_HALAMAN, data.total)
  const pertamaMemuat = status === 'memuat' && data.baris.length === 0
  const kartuStatistik = [
    { kunci: 'total', label: 'Total konsultasi', nilai: statistik.total, warna: 'netral', ikon: Ikon.total },
    { kunci: 'Konservatif', label: 'Konservatif', nilai: statistik.Konservatif, warna: 'teal' },
    { kunci: 'Moderat', label: 'Moderat', nilai: statistik.Moderat, warna: 'emas' },
    { kunci: 'Agresif', label: 'Agresif', nilai: statistik.Agresif, warna: 'terakota' },
  ]

  return (
    <section className="riw" ref={akar}>
      {/* Status koneksi internet */}
      {koneksi.status !== 'baik' && (
        <div
          className={`riw__koneksi riw__koneksi--${koneksi.status === 'pulih' ? 'pulih' : koneksi.detikPutus * 1000 >= BATAS_PUTUS_MS ? 'lama' : 'putus'}`}
          role="status"
          aria-live="polite"
        >
          <span className="riw__koneksi-ikon">{koneksi.status === 'pulih' ? Ikon.pulih : Ikon.putus}</span>
          <div className="riw__koneksi-teks">
            {koneksi.status === 'pulih' ? (
              <>
                <strong>Koneksi pulih</strong>
                <span>Data riwayat diperbarui otomatis, dan sesi admin Anda tetap aktif.</span>
              </>
            ) : koneksi.detikPutus * 1000 >= BATAS_PUTUS_MS ? (
              <>
                <strong>Koneksi terputus lebih dari {Math.round(BATAS_PUTUS_MS / 60000)} menit</strong>
                <span>Demi keamanan data pengguna, Anda akan diminta masuk kembali begitu koneksi pulih.</span>
              </>
            ) : (
              <>
                <strong>Koneksi internet terputus</strong>
                <span>
                  Data yang tampil mungkin belum terbaru. Kami menyambung kembali otomatis, dan sesi Anda tetap aman bila koneksi pulih dalam {Math.round(BATAS_PUTUS_MS / 60000)} menit.
                </span>
              </>
            )}
          </div>
          {koneksi.status === 'putus' && <span className="riw__koneksi-waktu">{formatDurasi(koneksi.detikPutus)}</span>}
        </div>
      )}

      <div className="pembungkus">
        {/* Kepala halaman */}
        <div className="riw__kepala" data-riw-masuk>
          <div className="riw__judul-bungkus">
            <p className="label-seksi">Panel admin</p>
            <h1 className="riw__judul">Riwayat Konsultasi</h1>
            <p className="riw__uraian">Daftar semua konsultasi pengguna, urut dari yang terbaru. Rincian jawaban tiap pengguna ada di PDF, dan seluruh data bisa diunduh sebagai Excel.</p>
          </div>
          <div className="riw__akun">
            <span className="riw__email" title={emailTerakhir.current}>
              <span className="riw__titik" aria-hidden="true" />
              <span className="riw__email-teks">{emailTerakhir.current || 'Admin'}</span>
            </span>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="riw__statistik" data-riw-masuk>
          {kartuStatistik.map((k) => (
            <div key={k.kunci} className={`riw__stat riw__stat--${k.warna}`} data-uji-statistik={k.kunci}>
              <span className="riw__stat-label">
                {k.ikon && <span className="riw__stat-ikon">{k.ikon}</span>}
                {k.label}
              </span>
              <span className="riw__stat-nilai">
                <Angka nilai={k.nilai} />
              </span>
            </div>
          ))}
        </div>

        {/* Tabel */}
        <div className="riw__tabel-kartu" ref={kartuTabel} data-riw-masuk>
          <div className="riw__alat">
            <label className="riw__cari">
              <span className="riw__cari-ikon">{Ikon.cari}</span>
              <input
                type="search"
                placeholder="Cari nama pengguna"
                aria-label="Cari nama pengguna"
                value={cari}
                maxLength={60}
                autoComplete="off"
                onChange={(e) => setCari(e.target.value)}
              />
              {cari && (
                <button
                  type="button"
                  className="riw__cari-hapus"
                  aria-label="Hapus pencarian"
                  onClick={kosongkanCari}
                >
                  {Ikon.tutup}
                </button>
              )}
            </label>

            <div className="riw__saring" role="group" aria-label="Saring berdasarkan profil risiko">
              {['', ...DAFTAR_PROFIL_FILTER].map((p) => (
                <button
                  key={p || 'semua'}
                  type="button"
                  className={`riw__chip ${profil === p ? 'riw__chip--aktif' : ''}`}
                  aria-pressed={profil === p}
                  onClick={() => pilihProfil(p)}
                >
                  {p || 'Semua'}
                </button>
              ))}
            </div>

            <div className="riw__aksi-alat">
              <button type="button" className="riw__segarkan" onClick={muatUlangData} disabled={status === 'memuat'} aria-label="Muat ulang data">
                <span className={status === 'memuat' ? 'riw__segarkan-ikon riw__segarkan-ikon--putar' : 'riw__segarkan-ikon'}>{Ikon.segarkan}</span>
                <span className="riw__segarkan-teks">Muat ulang</span>
              </button>

              <button type="button" className="riw__excel" onClick={unduhExcel} disabled={sedangEkspor} aria-busy={sedangEkspor}>
                {sedangEkspor ? <span className="riw__putar" aria-hidden="true" /> : Ikon.excel}
                <span>{sedangEkspor ? 'Menyiapkan...' : 'Unduh Excel'}</span>
              </button>
            </div>
          </div>

          {/* Galat */}
          {status === 'galat' && (
            <div className="riw__keadaan riw__keadaan--galat" role="alert">
              <span className="riw__keadaan-ikon">{Ikon.peringatan}</span>
              <h2>Riwayat belum bisa dimuat</h2>
              <p>{galat}</p>
              <button type="button" className="tombol tombol--emas" onClick={muatUlangData}>
                Coba lagi
              </button>
            </div>
          )}

          {/* Kerangka saat pertama memuat */}
          {status !== 'galat' && pertamaMemuat && (
            <div className="riw__kerangka" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
          )}

          {/* Kosong */}
          {status === 'siap' && data.baris.length === 0 && (
            <div className="riw__keadaan">
              <span className="riw__keadaan-ikon">{Ikon.kosong}</span>
              {adaSaringan ? (
                <>
                  <h2>Tidak ada hasil</h2>
                  <p>
                    {cariTunda.trim() ? `Tidak ditemukan konsultasi dengan nama "${cariTunda.trim()}"` : 'Belum ada konsultasi'}
                    {profil ? ` pada profil ${profil}.` : '.'}
                  </p>
                  <button type="button" className="tombol tombol--garis" onClick={hapusSaringan}>
                    Hapus pencarian dan saringan
                  </button>
                </>
              ) : (
                <>
                  <h2>Belum ada riwayat konsultasi</h2>
                  <p>Riwayat akan muncul di sini setelah pengguna menyelesaikan konsultasi.</p>
                </>
              )}
            </div>
          )}

          {/* Daftar */}
          {status !== 'galat' && data.baris.length > 0 && (
            <div className={`riw__tabel-gulir ${status === 'memuat' ? 'riw__tabel-gulir--muat' : ''}`}>
              <table className="riw__tabel">
                <caption className="riw__sr">Riwayat konsultasi pengguna</caption>
                <thead>
                  <tr>
                    <th scope="col" className="riw__k-no">No</th>
                    <th scope="col">Waktu konsultasi</th>
                    <th scope="col">Nama</th>
                    <th scope="col">Usia</th>
                    <th scope="col">Pekerjaan</th>
                    <th scope="col">No. HP / WA</th>
                    <th scope="col">Profil risiko</th>
                    <th scope="col">Keyakinan</th>
                    <th scope="col" className="riw__k-aksi">Laporan</th>
                  </tr>
                </thead>
                {/* Kunci mengikuti data yang sudah termuat, bukan permintaan yang sedang berjalan. Saat pengguna berpindah halaman,
                    mencari, atau menyaring, baris lama tetap diam (agak redup) sampai data baru tiba, lalu baris baru masuk satu kali.
                    Bila kunci mengikuti permintaan, baris lama ikut dibuat ulang dan bergerak masuk sebentar sebelum diganti, yang tampak sebagai kedipan.
                    Penyegaran otomatis memperbarui isi baris yang sama tanpa membuatnya ulang, dan hanya baris yang benar-benar baru yang bergerak masuk. */}
                <tbody key={`${data.halaman}|${data.cari ?? ''}|${data.profil ?? ''}`}>
                  {data.baris.map((b, i) => {
                    const waktu = formatWaktu(b.waktu_konsultasi)
                    const warna = WARNA_PROFIL[b.hasil_profil] ?? 'netral'
                    const persen = Number.isFinite(Number(b.persentase_keyakinan)) ? Math.max(0, Math.min(100, Number(b.persentase_keyakinan))) : null
                    const unduhIni = sedangUnduh.has(b.id_konsultasi)
                    // Hasil yang kurang kuat diberi keterangan singkat di bawah keyakinannya, dinilai dari jawaban yang tersimpan.
                    const kepastian = persen === null ? null : nilaiKepastianDariJawaban(b.jawaban_indikator, hitungProfilRisiko)
                    return (
                      <tr key={b.id_konsultasi} style={{ '--i': i }} data-uji-baris>
                        <td className="riw__k-no" data-label="No">
                          {(data.halaman - 1) * UKURAN_HALAMAN + i + 1}
                        </td>
                        <td data-label="Waktu">
                          <span className="riw__tgl">{waktu.tanggal}</span>
                          <span className="riw__jam">{waktu.jam}</span>
                        </td>
                        <td data-label="Nama" className="riw__sel-nama">
                          <span className="riw__nama" title={b.nama}>{b.nama}</span>
                        </td>
                        <td data-label="Usia">{b.usia ?? '-'}{b.usia != null ? ' tahun' : ''}</td>
                        <td data-label="Pekerjaan" className="riw__pekerjaan">{b.pekerjaan || '-'}</td>
                        <td data-label="No. HP / WA" className="riw__hp">{b.no_hp ? formatNoHp(b.no_hp) : '-'}</td>
                        <td data-label="Profil" className="riw__sel-profil">
                          <span className={`riw__lencana riw__lencana--${warna}`}>{b.hasil_profil || '-'}</span>
                        </td>
                        <td data-label="Keyakinan" className="riw__sel-yakin">
                          {persen === null ? (
                            '-'
                          ) : (
                            <span className="riw__yakin">
                              <span className="riw__yakin-angka">{persen.toFixed(1).replace('.', ',')}%</span>
                              <span className="riw__yakin-bar" aria-hidden="true">
                                <span style={{ width: `${persen}%` }} className={`riw__yakin-isi riw__yakin-isi--${warna}`} />
                              </span>
                            </span>
                          )}
                          {kepastian && kepastian.tingkat !== 'kuat' && (
                            <span className={`riw__kepastian riw__kepastian--${kepastian.tingkat}`}>{kepastian.label}</span>
                          )}
                        </td>
                        <td className="riw__k-aksi" data-label="Laporan">
                          <button
                            type="button"
                            className="riw__unduh"
                            onClick={() => unduh(b)}
                            disabled={unduhIni}
                            aria-label={`Unduh PDF konsultasi ${b.nama}`}
                          >
                            {unduhIni ? <span className="riw__putar" aria-hidden="true" /> : Ikon.unduh}
                            <span>{unduhIni ? 'Membuat...' : 'Unduh PDF'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Halaman */}
          {status !== 'galat' && data.total > 0 && (
            <div className="riw__kaki">
              <p className="riw__info" aria-live="polite">
                Menampilkan {awal} sampai {akhir} dari {data.total} konsultasi
              </p>
              {totalHalaman > 1 && (
                <nav className="riw__halaman" aria-label="Halaman riwayat">
                  <button type="button" className="riw__nav" aria-label="Halaman sebelumnya" onClick={() => keHalaman(halaman - 1)} disabled={halaman <= 1 || status === 'memuat'}>
                    {Ikon.kiri}
                    <span>Sebelumnya</span>
                  </button>
                  <span className="riw__nomor-bungkus">
                    {nomorHalaman(halaman, totalHalaman).map((n, i) =>
                      n === '...' ? (
                        <span key={`t${i}`} className="riw__titik-halaman" aria-hidden="true">...</span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          className={`riw__nomor ${n === halaman ? 'riw__nomor--aktif' : ''}`}
                          aria-current={n === halaman ? 'page' : undefined}
                          aria-label={`Halaman ${n}`}
                          onClick={() => keHalaman(n)}
                          disabled={status === 'memuat' && n !== halaman}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  </span>
                  <button type="button" className="riw__nav" aria-label="Halaman berikutnya" onClick={() => keHalaman(halaman + 1)} disabled={halaman >= totalHalaman || status === 'memuat'}>
                    <span>Berikutnya</span>
                    {Ikon.kanan}
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div key={toast.id} className={`riw__toast riw__toast--${toast.jenis}`} role={toast.jenis === 'galat' ? 'alert' : 'status'}>
          <span className="riw__toast-ikon">{toast.jenis === 'galat' ? Ikon.peringatan : Ikon.centang}</span>
          <span className="riw__toast-teks">{toast.pesan}</span>
          {toast.muatUlang && (
            <button type="button" className="riw__toast-aksi" onClick={() => window.location.reload()}>
              Muat ulang
            </button>
          )}
          <button type="button" className="riw__toast-tutup" aria-label="Tutup pemberitahuan" onClick={() => setToast(null)}>
            {Ikon.tutup}
          </button>
        </div>
      )}

      {/* Konfirmasi keluar */}
      {modalKeluar && (
        <ModalKonfirmasi
          judul="Keluar dari panel admin?"
          ikon={Ikon.keluar}
          nada="teal"
          saatBatal={() => !sedangKeluar && setModalKeluar(false)}
          tombol={[
            { label: 'Batal', aksi: () => setModalKeluar(false), gaya: 'garis', autoFokus: true, nonaktif: sedangKeluar },
            { label: sedangKeluar ? 'Keluar...' : 'Ya, keluar', aksi: konfirmasiKeluar, gaya: 'emas', nonaktif: sedangKeluar },
          ]}
        >
          <p>Anda perlu memasukkan email dan kata sandi lagi untuk membuka riwayat konsultasi.</p>
        </ModalKonfirmasi>
      )}

      {/* Peringatan sesi hampir berakhir karena tidak ada aktivitas */}
      {peringatanTampil && (
        <ModalKonfirmasi
          judul="Sesi admin akan segera berakhir"
          ikon={Ikon.jam}
          nada="emas"
          saatBatal={tetapMasuk}
          tombol={[
            { label: 'Keluar sekarang', aksi: keluarSekarang, gaya: 'garis', nonaktif: sedangKeluar },
            { label: 'Tetap masuk', aksi: tetapMasuk, gaya: 'emas', autoFokus: true },
          ]}
        >
          <p>
            Tidak ada aktivitas dalam beberapa waktu terakhir. Demi keamanan data pengguna, akun admin otomatis keluar dalam{' '}
            <span className="riw__hitung-angka">{sisaDetik} detik</span>.
          </p>
          <div className="riw__hitung" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (sisaDetik * 1000 * 100) / PERINGATAN_MS)}%` }} />
          </div>
          <p className="riw__hitung-ket">Pilih Tetap masuk bila Anda masih menggunakan panel ini.</p>
        </ModalKonfirmasi>
      )}

      {/* Konfirmasi pindah halaman (otomatis keluar dari akun admin) */}
      {modalPindah && (
        <ModalKonfirmasi
          judul="Pindah halaman dan keluar dari panel admin?"
          ikon={Ikon.keluar}
          nada="teal"
          saatBatal={batalPindah}
          tombol={[
            { label: 'Tetap di panel', aksi: batalPindah, gaya: 'garis', autoFokus: true, nonaktif: sedangPindah },
            { label: sedangPindah ? 'Keluar...' : 'Ya, pindah dan keluar', aksi: konfirmasiPindah, gaya: 'emas', nonaktif: sedangPindah },
          ]}
        >
          <p>Bila Anda berpindah halaman, akun admin otomatis keluar demi keamanan data pengguna. Untuk membuka riwayat konsultasi lagi, Anda perlu memasukkan email dan kata sandi kembali.</p>
        </ModalKonfirmasi>
      )}
    </section>
  )
}