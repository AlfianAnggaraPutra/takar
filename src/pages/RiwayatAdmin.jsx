import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ModalKonfirmasi from '../components/ModalKonfirmasi'
import { keluarAdmin, useSesiAdmin } from '../lib/autentikasi'
import { hitungProfilRisiko, periksaJawaban } from '../lib/mesinInferensi'
import { DAFTAR_PROFIL_FILTER, UKURAN_HALAMAN, ambilRiwayat, ambilStatistik, formatWaktu } from '../lib/riwayatAdmin'
import './RiwayatAdmin.css'

// Pembuat PDF dimuat terpisah dan hanya sekali. Bila gagal dimuat, browser menyimpan kegagalannya,
// jadi satu-satunya cara mencoba lagi adalah memuat ulang halaman.
let modulLaporan = null
const muatModulLaporan = () => {
  if (!modulLaporan) modulLaporan = import('../lib/buatLaporanPdf')
  return modulLaporan
}

const JEDA_CARI_MS = 350
const WARNA_PROFIL = { Konservatif: 'teal', Moderat: 'emas', Agresif: 'terakota' }

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

const inisial = (nama) => (String(nama ?? '').trim().charAt(0) || '?').toUpperCase()

/* ---------- Halaman ---------- */

export default function RiwayatAdmin() {
  const { memuat, sesi } = useSesiAdmin()
  const navigasi = useNavigate()

  const [halaman, setHalaman] = useState(1)
  const [cari, setCari] = useState('')
  const [cariTunda, setCariTunda] = useState('')
  const [profil, setProfil] = useState('')
  const [versi, setVersi] = useState(0)

  const [data, setData] = useState({ baris: [], total: 0 })
  const [status, setStatus] = useState('memuat') // memuat | siap | galat
  const [galat, setGalat] = useState(null)
  const [pernahMuat, setPernahMuat] = useState(false)
  const [statistik, setStatistik] = useState({ total: null, Konservatif: null, Moderat: null, Agresif: null })

  const [sedangUnduh, setSedangUnduh] = useState(() => new Set())
  const [toast, setToast] = useState(null) // { jenis, pesan, muatUlang }
  const [modalKeluar, setModalKeluar] = useState(false)
  const [sedangKeluar, setSedangKeluar] = useState(false)

  const akar = useRef(null)
  const kartuTabel = useRef(null)
  const idPermintaan = useRef(0)
  const idToast = useRef(0)
  const gulirKeTabel = useRef(false)
  const cariBerlaku = useRef('')

  const totalHalaman = Math.max(1, Math.ceil(data.total / UKURAN_HALAMAN))
  const adaSaringan = Boolean(cariTunda.trim() || profil)
  const sudahMasuk = Boolean(sesi)

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
    setStatus('memuat')
    ambilRiwayat({ halaman, cari: cariTunda, profil })
      .then((hasil) => {
        if (saya !== idPermintaan.current) return
        // Halaman yang diminta sudah melewati data (misalnya data berkurang): mundur ke halaman terakhir.
        const terakhir = Math.max(1, Math.ceil(hasil.total / UKURAN_HALAMAN))
        if (hasil.baris.length === 0 && hasil.total > 0 && halaman > terakhir) {
          setHalaman(terakhir)
          return
        }
        setData(hasil)
        setGalat(null)
        setStatus('siap')
        setPernahMuat(true)
      })
      .catch(async (e) => {
        if (saya !== idPermintaan.current) return
        if (e?.perluMasukLagi) {
          await keluarAdmin()
          return
        }
        setGalat(e?.message || 'Riwayat belum bisa dimuat. Coba lagi beberapa saat lagi.')
        setStatus('galat')
      })
  }, [sudahMasuk, halaman, cariTunda, profil, versi])

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
  useEffect(() => {
    if (memuat || !sesi || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const konteks = gsap.context(() => {
      gsap.from('[data-riw-masuk]', { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.1, clearProps: 'transform,opacity' })
    }, akar)
    return () => konteks.revert()
  }, [memuat, sesi])

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
        identitas: { nama: b.nama, usia: b.usia, pekerjaan: b.pekerjaan || '-' },
        jawaban,
        hasil,
        nomorKonsultasi: id,
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

  const konfirmasiKeluar = async () => {
    if (sedangKeluar) return
    setSedangKeluar(true)
    await keluarAdmin()
    navigasi('/admin', { replace: true })
  }

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
  if (!sesi) return <Navigate to="/admin" replace />

  const awal = data.total === 0 ? 0 : (halaman - 1) * UKURAN_HALAMAN + 1
  const akhir = Math.min(halaman * UKURAN_HALAMAN, data.total)
  const pertamaMemuat = status === 'memuat' && data.baris.length === 0
  const kartuStatistik = [
    { kunci: 'total', label: 'Total konsultasi', nilai: statistik.total, warna: 'netral', ikon: Ikon.total },
    { kunci: 'Konservatif', label: 'Konservatif', nilai: statistik.Konservatif, warna: 'teal' },
    { kunci: 'Moderat', label: 'Moderat', nilai: statistik.Moderat, warna: 'emas' },
    { kunci: 'Agresif', label: 'Agresif', nilai: statistik.Agresif, warna: 'terakota' },
  ]

  return (
    <section className="riw" ref={akar}>
      <div className="pembungkus">
        {/* Kepala halaman */}
        <div className="riw__kepala" data-riw-masuk>
          <div className="riw__judul-bungkus">
            <p className="label-seksi">Panel admin</p>
            <h1 className="riw__judul">Riwayat Konsultasi</h1>
            <p className="riw__uraian">Daftar semua konsultasi pengguna, urut dari yang terbaru. Rincian jawaban tiap pengguna ada di PDF.</p>
          </div>
          <div className="riw__akun">
            <span className="riw__email" title={sesi.user?.email}>
              <span className="riw__titik" aria-hidden="true" />
              <span className="riw__email-teks">{sesi.user?.email ?? 'Admin'}</span>
            </span>
            <button type="button" className="riw__keluar" onClick={() => setModalKeluar(true)}>
              {Ikon.keluar}
              Keluar
            </button>
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

            <button type="button" className="riw__segarkan" onClick={muatUlangData} disabled={status === 'memuat'} aria-label="Muat ulang data">
              <span className={status === 'memuat' ? 'riw__segarkan-ikon riw__segarkan-ikon--putar' : 'riw__segarkan-ikon'}>{Ikon.segarkan}</span>
              <span className="riw__segarkan-teks">Muat ulang</span>
            </button>
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
                    <th scope="col">Profil risiko</th>
                    <th scope="col">Keyakinan</th>
                    <th scope="col" className="riw__k-aksi">Laporan</th>
                  </tr>
                </thead>
                <tbody key={`${halaman}|${cariTunda}|${profil}|${versi}`}>
                  {data.baris.map((b, i) => {
                    const waktu = formatWaktu(b.waktu_konsultasi)
                    const warna = WARNA_PROFIL[b.hasil_profil] ?? 'netral'
                    const persen = Number.isFinite(Number(b.persentase_keyakinan)) ? Math.max(0, Math.min(100, Number(b.persentase_keyakinan))) : null
                    const unduhIni = sedangUnduh.has(b.id_konsultasi)
                    return (
                      <tr key={b.id_konsultasi} style={{ '--i': i }} data-uji-baris>
                        <td className="riw__k-no" data-label="No">
                          {(halaman - 1) * UKURAN_HALAMAN + i + 1}
                        </td>
                        <td data-label="Waktu">
                          <span className="riw__tgl">{waktu.tanggal}</span>
                          <span className="riw__jam">{waktu.jam}</span>
                        </td>
                        <td data-label="Nama" className="riw__sel-nama">
                          <span className="riw__avatar" aria-hidden="true">{inisial(b.nama)}</span>
                          <span className="riw__nama" title={b.nama}>{b.nama}</span>
                        </td>
                        <td data-label="Usia">{b.usia ?? '-'}{b.usia != null ? ' tahun' : ''}</td>
                        <td data-label="Pekerjaan" className="riw__pekerjaan">{b.pekerjaan || '-'}</td>
                        <td data-label="Profil">
                          <span className={`riw__lencana riw__lencana--${warna}`}>{b.hasil_profil || '-'}</span>
                        </td>
                        <td data-label="Keyakinan">
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
                Menampilkan <strong>{awal}</strong> sampai <strong>{akhir}</strong> dari <strong>{data.total}</strong> konsultasi
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
    </section>
  )
}