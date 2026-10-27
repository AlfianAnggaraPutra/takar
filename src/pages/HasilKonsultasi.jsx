import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { PILIHAN_JAWABAN, REKOMENDASI_INSTRUMEN } from '../data/basisPengetahuan'
import { KETERANGAN_INSTRUMEN, LABEL_RISIKO, URAIAN_PROFIL } from '../data/profilRisiko'
import ModalKonfirmasi from '../components/ModalKonfirmasi'
import { nilaiKepastian } from '../lib/kepastianHasil'
import './HasilKonsultasi.css'

/* ---------- Pemformatan angka gaya Indonesia ---------- */

const koma = (angka, desimal) => angka.toFixed(desimal).replace('.', ',')

// Angka persen utama. Bila pembulatan dua desimal menghasilkan 100 padahal nilainya sedikit di bawah 100,
// ditulis 99,99 supaya tidak menyiratkan kepastian mutlak (sejalan dengan "> 99,99%" di kartu sebaran).
function persenUtama(x) {
  const bulat = Math.round(x * 100) / 100
  return bulat >= 100 && x < 100 ? 99.99 : bulat
}

// Posterior (0 sampai 1) ditulis sebagai persen. Nilai yang sangat kecil atau sangat dekat 100 dibulatkan secara jujur.
function formatPersen(posterior) {
  const x = posterior * 100
  if (x > 0 && x < 0.01) return '< 0,01%'
  if (x > 99.99 && x < 100) return '> 99,99%'
  return `${koma(x, 2)}%`
}

function Ilmiah({ nilai }) {
  if (nilai === 0) return <>0</>
  const [mantisa, eksponen] = nilai.toExponential(4).split('e')
  return (
    <>
      {mantisa.replace('.', ',')} × 10<sup>{Number(eksponen)}</sup>
    </>
  )
}

// Pembuat laporan dimuat terpisah dan hanya sekali. Browser menyimpan hasil muat yang gagal, jadi
// bila gagal, satu-satunya cara mencoba lagi adalah memuat ulang halaman (hasil konsultasi tetap ada).
let modulLaporan = null
const muatModulLaporan = () => {
  if (!modulLaporan) modulLaporan = import('../lib/buatLaporanPdf')
  return modulLaporan
}

const labelJawaban = (cf) => PILIHAN_JAWABAN.find((p) => p.nilai === cf)?.label ?? String(cf)

/* ---------- Ikon ---------- */

const Ikon = {
  centang: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </svg>
  ),
  ulang: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4.5H8" />
    </svg>
  ),
  panah: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  peringatan: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5l9.2 16H2.8L12 3.5z" />
      <path d="M12 10v4.4M12 17.4v.1" />
    </svg>
  ),
  centangBulat: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.8 12.4l3 3 5.4-6" />
    </svg>
  ),
  unduh: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  ),
  dokumen: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h6M9 9.5h2" />
    </svg>
  ),
  panahBawah: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}

/* ---------- Penanda status penyimpanan riwayat ---------- */

function StatusSimpan({ status, pesan, saatCobaLagi }) {
  if (status === 'menyimpan') {
    return (
      <p key="menyimpan" className="hasil__simpan" role="status">
        <span className="hasil__putar" aria-hidden="true" /> Menyimpan riwayat konsultasi
      </p>
    )
  }
  if (status === 'tersimpan') {
    return (
      <p key="tersimpan" className="hasil__simpan hasil__simpan--baik" role="status">
        {Ikon.centang} Riwayat konsultasi Anda sudah tersimpan
      </p>
    )
  }
  if (status === 'gagal') {
    return (
      <div key="gagal" className="hasil__simpan hasil__simpan--galat" role="alert">
        <span>{pesan || 'Riwayat belum bisa disimpan. Hasil Anda tetap aman di halaman ini.'}</span>
        <button type="button" onClick={saatCobaLagi}>Coba simpan lagi</button>
      </div>
    )
  }
  return null
}

/* ---------- Halaman hasil ---------- */

export default function HasilKonsultasi({ identitas, hasil, jawaban, waktuKonsultasi, statusSimpan, pesanSimpan, saatSimpanUlang, saatUlangi, saatTinjau }) {
  const akar = useRef(null)
  const angka = useRef(null)
  const [batang, setBatang] = useState(false)
  const [statusPdf, setStatusPdf] = useState('siap') // siap, membuat, selesai, galat, galatMuat
  const [pernahUnduh, setPernahUnduh] = useState(false)
  const [modal, setModal] = useState(null) // { jenis: 'pergi' | 'kembali' | 'ulangi', tujuan }
  const bolehKeluar = useRef(false)
  const navigate = useNavigate()
  const adaHasil = hasil.dapatDitentukan

  const kurangGerak = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Setiap blok muncul tepat ketika ia masuk ke layar, bukan semuanya sekaligus saat halaman dibuka.
     Dulu semua blok dianimasikan di awal, sehingga blok yang berada di bawah layar sudah selesai bergerak
     sebelum pengguna sempat menggulir ke sana dan terlihat seperti tidak beranimasi.
     Blok yang sudah terlihat saat halaman dibuka muncul berurutan, sisanya muncul saat digulir. Isi di dalam
     blok (butir daftar, titik risiko) menyusul sesaat setelahnya. */
  useLayoutEffect(() => {
    const akarEl = akar.current
    if (!akarEl || kurangGerak) return
    // Hanya opacity yang dipakai (bukan visibility), supaya blok yang belum muncul tetap terbaca pembaca layar dan bisa difokus keyboard.
    const blok = [...akarEl.querySelectorAll('[data-masuk]')]
    if (blok.length === 0) return
    const lepas = 'opacity,transform'
    const penunda = []

    const munculkanIsi = (el, tunda) => {
      const anak = el.querySelectorAll('[data-anak]')
      if (anak.length) gsap.from(anak, { opacity: 0, y: 14, duration: 0.55, ease: 'power2.out', stagger: 0.07, delay: tunda, clearProps: lepas })
      const titik = el.querySelectorAll('.hasil__risiko-titik i')
      if (titik.length) gsap.from(titik, { scale: 0, duration: 0.45, ease: 'back.out(2.6)', stagger: 0.07, delay: tunda + 0.1, clearProps: 'transform' })
    }
    const ctx = gsap.context(() => {
      gsap.set(blok, { opacity: 0, y: 30 })
    }, akarEl)

    // Dijalankan lewat ctx.add supaya semua animasi yang dibuat belakangan ikut terhapus saat halaman ditutup.
    const munculkan = (daftar) =>
      ctx.add(() => {
        gsap.to(daftar, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, overwrite: 'auto', clearProps: lepas })
        daftar.forEach((el, i) => {
          munculkanIsi(el, 0.3 + i * 0.09)
          // Batang persentase baru terisi setelah kartunya benar-benar tampil.
          if (el.classList.contains('hasil__kartu')) penunda.push(window.setTimeout(() => setBatang(true), 350 + i * 90))
        })
      })

    let pengamat = null
    if (typeof IntersectionObserver === 'undefined') {
      munculkan(blok)
    } else {
      // Garis bawah dinaikkan 40px supaya blok baru dimunculkan setelah benar-benar masuk, tetapi blok terakhir
      // di dasar halaman tetap bisa terpicu.
      pengamat = new IntersectionObserver(
        (entri) => {
          const masuk = entri
            .filter((e) => e.isIntersecting)
            .map((e) => e.target)
            .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          if (masuk.length === 0) return
          masuk.forEach((el) => pengamat.unobserve(el))
          munculkan(masuk)
        },
        { rootMargin: '0px 0px -40px 0px', threshold: 0 },
      )
      blok.forEach((el) => pengamat.observe(el))
    }

    return () => {
      pengamat?.disconnect()
      penunda.forEach((t) => window.clearTimeout(t))
      gsap.killTweensOf(blok)
      ctx.revert()
      gsap.set(blok, { clearProps: lepas })
    }
  }, [kurangGerak])

  /* Batang persentase terisi saat kartunya tampil. Tanpa animasi, langsung terisi. */
  useEffect(() => {
    if (kurangGerak) setBatang(true)
  }, [kurangGerak])

  useEffect(() => {
    const el = angka.current
    if (!el || !hasil.dapatDitentukan) return
    const akhir = koma(persenUtama(hasil.persentase), 2)
    el.textContent = akhir
    if (kurangGerak) return
    const o = { v: 0 }
    el.textContent = '0,00'
    const tween = gsap.to(o, {
      v: persenUtama(hasil.persentase),
      duration: 1.7,
      delay: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = koma(o.v, 2)
      },
      onComplete: () => {
        el.textContent = akhir
      },
    })
    return () => {
      tween.kill()
      el.textContent = akhir
    }
  }, [hasil, kurangGerak])

  /* Pembuat laporan dimuat diam-diam begitu hasil tampil, supaya tombol unduh langsung bekerja. */
  useEffect(() => {
    if (!hasil.dapatDitentukan) return
    const penunda = window.setTimeout(() => muatModulLaporan().catch(() => {}), 1200)
    return () => window.clearTimeout(penunda)
  }, [hasil])

  /* ----- Penjaga halaman hasil: pengguna diminta memastikan dulu sebelum pergi ----- */

  // 1. Klik tautan ke halaman lain (menu, logo, footer, "Pelajari instrumen").
  useEffect(() => {
    if (!adaHasil) return
    const saatKlik = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const tautan = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!tautan || tautan.target === '_blank' || tautan.hasAttribute('download')) return
      const url = new URL(tautan.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setModal({ jenis: 'pergi', tujuan: `${url.pathname}${url.search}${url.hash}` })
    }
    document.addEventListener('click', saatKlik, true)
    return () => document.removeEventListener('click', saatKlik, true)
  }, [adaHasil])

  // 2. Tombol kembali di browser atau ponsel. Satu entri riwayat penjaga disisipkan supaya tombol
  //    kembali pertama hanya memunculkan pop up, bukan langsung membawa pengguna pergi.
  useEffect(() => {
    if (!adaHasil) return
    const pasangPenjaga = () => {
      const keadaan = window.history.state ?? {}
      window.history.pushState({ ...keadaan, idx: (keadaan.idx ?? 0) + 1, takarJaga: true }, '')
    }
    if (!window.history.state?.takarJaga) pasangPenjaga()
    const saatKembali = () => {
      if (bolehKeluar.current || window.history.state?.takarJaga) return
      setModal({ jenis: 'kembali' })
    }
    window.addEventListener('popstate', saatKembali)
    window.__takarPasangPenjaga = pasangPenjaga
    return () => {
      window.removeEventListener('popstate', saatKembali)
      delete window.__takarPasangPenjaga
    }
  }, [adaHasil])

  // 3. Menutup tab atau memuat ulang halaman, hanya bila laporan PDF belum diunduh.
  useEffect(() => {
    if (!adaHasil || pernahUnduh) return
    const saatTutup = (e) => {
      if (bolehKeluar.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', saatTutup)
    return () => window.removeEventListener('beforeunload', saatTutup)
  }, [adaHasil, pernahUnduh])

  const tetapDiSini = () => {
    const jenis = modal?.jenis
    setModal(null)
    if (jenis === 'kembali') window.__takarPasangPenjaga?.()
  }
  const lanjutPergi = () => {
    const m = modal
    setModal(null)
    if (!m) return
    if (m.jenis === 'ulangi') {
      saatUlangi()
      return
    }
    bolehKeluar.current = true
    if (m.jenis === 'kembali') window.history.back()
    else navigate(m.tujuan)
  }

  /* Laporan PDF dibuat di browser pengguna, tanpa mengirim data ke server. */
  const unduhLaporan = async () => {
    if (statusPdf === 'membuat') return
    if (statusPdf === 'galatMuat') {
      bolehKeluar.current = true
      window.location.reload()
      return
    }
    setStatusPdf('membuat')
    let modul
    try {
      modul = await muatModulLaporan()
    } catch (galat) {
      console.error('Gagal memuat pembuat laporan PDF:', galat)
      setStatusPdf('galatMuat')
      return
    }
    try {
      await modul.buatLaporanPdf({ identitas, jawaban, hasil, waktu: waktuKonsultasi ?? undefined })
      setStatusPdf('selesai')
      setPernahUnduh(true)
    } catch (galat) {
      console.error('Gagal membuat laporan PDF:', galat)
      setStatusPdf('galat')
    }
  }

  /* ----- Profil belum dapat ditentukan ----- */
  if (!hasil.dapatDitentukan) {
    return (
      <div className="hasil hasil--kosong" ref={akar}>
        <div className="pembungkus hasil__kosong-isi">
          <span className="hasil__kosong-ikon" data-masuk>{Ikon.info}</span>
          <p className="label-seksi" data-masuk>Hasil konsultasi</p>
          <h1 className="hasil__kosong-judul" data-masuk>Profil risiko belum dapat ditentukan</h1>
          <p className="hasil__kosong-teks" data-masuk>
            {hasil.alasan} Sistem membutuhkan setidaknya satu pernyataan yang menurut Anda sesuai untuk bisa menilai kecenderungan Anda.
          </p>
          <p className="hasil__kosong-teks" data-masuk>
            Tinjau kembali jawaban Anda. Bila ada pernyataan yang sedikit saja mendekati kebiasaan Anda, pilih &quot;Sedikit Sesuai&quot; dan bukan &quot;Tidak&quot;.
          </p>
          <div className="hasil__aksi" data-masuk>
            <button type="button" className="tombol tombol--emas" onClick={saatTinjau}>
              Tinjau jawaban saya {Ikon.panah}
            </button>
            <button type="button" className="tombol tombol--garis" onClick={saatUlangi}>
              {Ikon.ulang} Ulangi dari awal
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ----- Hasil normal ----- */
  const tertinggi = hasil.profilTertinggi
  const uraian = URAIAN_PROFIL[tertinggi.kode]
  const instrumen = REKOMENDASI_INSTRUMEN[tertinggi.kode] ?? []
  const namaDepan = identitas?.nama?.split(' ')[0] ?? ''

  // Penilaian kelayakan hasil: jumlah pernyataan yang dijadikan bukti dan seberapa menonjol profil teratas.
  const kepastian = nilaiKepastian(hasil)
  const adaCatatan = kepastian && kepastian.tingkat !== 'kuat'

  return (
    <div className="hasil" ref={akar}>
      <div className="pembungkus">
        {/* Hasil utama */}
        <section className="hasil__utama" data-warna={uraian.warna}>
          <div className="hasil__profil" data-masuk>
            <p className="label-seksi">{namaDepan ? `Hasil untuk ${namaDepan}` : 'Hasil konsultasi'}</p>
            <h1 className="hasil__judul">
              Profil risiko Anda <em>{tertinggi.nama}</em>
            </h1>
            <p className="hasil__julukan">{uraian.julukan}</p>
            <p className="hasil__ringkasan">{uraian.ringkasan}</p>
            <div className="hasil__keyakinan">
              <p className="hasil__persen">
                <span ref={angka} />
                <small>%</small>
              </p>
              <p className="hasil__persen-ket">tingkat keyakinan sistem pada profil {tertinggi.nama}</p>
            </div>
            {adaCatatan && (
              <p className={`hasil__tanda hasil__tanda--${kepastian.tingkat}`}>{kepastian.tanda}</p>
            )}
          </div>

          <div className="hasil__kartu" data-masuk>
            <h2>Sebaran probabilitas</h2>
            <p className="hasil__kartu-sub">Hasil perhitungan Naive Bayes dan Certainty Factor untuk ketiga profil.</p>
            <ul className="hasil__batang-daftar">
              {hasil.urutan.map((p, indeks) => {
                const warna = URAIAN_PROFIL[p.kode].warna
                return (
                  <li key={p.kode} data-warna={warna} className={indeks === 0 ? 'hasil__baris hasil__baris--juara' : 'hasil__baris'} data-anak>
                    <div className="hasil__baris-atas">
                      <span className="hasil__baris-nama">
                        <i aria-hidden="true" />
                        {p.nama}
                        {indeks === 0 && <b>Tertinggi</b>}
                      </span>
                      <strong>{formatPersen(p.posterior)}</strong>
                    </div>
                    <div className="hasil__batang" role="img" aria-label={`${p.nama} ${formatPersen(p.posterior)}`}>
                      <span style={{ width: batang ? `${p.posterior * 100}%` : '0%' }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <StatusSimpan status={statusSimpan} pesan={pesanSimpan} saatCobaLagi={saatSimpanUlang} />
          </div>
        </section>

        {adaCatatan && (
          <section className={`hasil__validitas hasil__validitas--${kepastian.tingkat}`} data-masuk aria-labelledby="hasil-validitas-judul">
            <span className="hasil__validitas-ikon" aria-hidden="true">{Ikon.peringatan}</span>
            <div className="hasil__validitas-isi">
              <h2 id="hasil-validitas-judul">{kepastian.judul}</h2>
              <p className="hasil__validitas-pengantar">{kepastian.pengantar}</p>
              <ul>
                {kepastian.alasan.map((a) => (
                  <li key={a.kode} data-anak>{a.teks}</li>
                ))}
              </ul>
              <p className="hasil__validitas-saran">{kepastian.saran}</p>
              <button type="button" className="tombol tombol--garis hasil__validitas-tombol" onClick={saatTinjau}>
                Tinjau jawaban saya {Ikon.panah}
              </button>
            </div>
          </section>
        )}

        {/* Unduh laporan PDF */}
        <section className="hasil__laporan" data-masuk aria-labelledby="hasil-laporan-judul">
          <span className="hasil__laporan-ikon" aria-hidden="true">
            {Ikon.dokumen}
            <b>PDF</b>
          </span>
          <div className="hasil__laporan-isi">
            <p className="label-seksi">Laporan konsultasi</p>
            <h2 id="hasil-laporan-judul">Simpan hasil Anda dalam bentuk PDF</h2>
            <p>
              Laporan ini disusun rapi dan siap dibaca atau dicetak. Cocok untuk arsip pribadi, atau dibawa saat Anda ingin mengecek hasilnya bersama pakar.
            </p>
            <ul className="hasil__laporan-isi-daftar" aria-label="Isi laporan">
              <li data-anak>Profil dan persentase</li>
              <li data-anak>Grafik sebaran</li>
              <li data-anak>Instrumen</li>
              <li data-anak>Rincian hitungan</li>
              <li data-anak>40 jawaban</li>
            </ul>
          </div>
          <div className="hasil__laporan-aksi">
            <button type="button" className="tombol tombol--emas hasil__unduh" onClick={unduhLaporan} disabled={statusPdf === 'membuat'} aria-busy={statusPdf === 'membuat'}>
              {statusPdf === 'membuat' ? (
                <>
                  <span className="hasil__putar hasil__putar--gelap" aria-hidden="true" /> Menyusun laporan
                </>
              ) : (
                <>
                  {statusPdf === 'galatMuat' ? Ikon.ulang : Ikon.unduh}{' '}
                  {statusPdf === 'selesai' ? 'Unduh lagi' : statusPdf === 'galat' ? 'Coba lagi' : statusPdf === 'galatMuat' ? 'Muat ulang halaman' : 'Unduh laporan PDF'}
                </>
              )}
            </button>
            <p
              className={`hasil__laporan-ket${statusPdf === 'galat' || statusPdf === 'galatMuat' ? ' hasil__laporan-ket--galat' : ''}`}
              role={statusPdf === 'galat' || statusPdf === 'galatMuat' ? 'alert' : 'status'}
            >
              {statusPdf === 'selesai' && <>{Ikon.centang} Laporan sudah terunduh ke perangkat Anda</>}
              {statusPdf === 'galat' && <>Laporan belum bisa dibuat. Silakan coba lagi.</>}
              {statusPdf === 'galatMuat' && <>Laporan belum bisa dimuat. Periksa koneksi internet, lalu muat ulang halaman. Hasil Anda tidak hilang.</>}
              {(statusPdf === 'siap' || statusPdf === 'membuat') && <>Format PDF, sekitar 5 sampai 6 halaman</>}
            </p>
          </div>
        </section>

        {/* Ciri dan saran */}
        <section className="hasil__dua" data-warna={uraian.warna}>
          <div className="hasil__panel" data-masuk>
            <h2>Yang tampak dari jawaban Anda</h2>
            <ul className="hasil__ciri">
              {uraian.ciri.map((c) => (
                <li key={c} data-anak>
                  <span>{Ikon.centang}</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="hasil__panel hasil__panel--saran" data-masuk>
            <h2>Saran untuk Anda</h2>
            <p>{uraian.saran}</p>
          </div>
        </section>

        {/* Instrumen */}
        <section className="hasil__instrumen" data-warna={uraian.warna}>
          <div className="hasil__kepala" data-masuk>
            <p className="label-seksi">Rekomendasi instrumen</p>
            <h2 className="hasil__h2">Instrumen yang sejalan dengan profil {tertinggi.nama}</h2>
          </div>
          <ul className="hasil__instrumen-daftar">
            {instrumen.map((nama) => {
              const info = KETERANGAN_INSTRUMEN[nama]
              return (
                <li key={nama} className="hasil__instrumen-kartu" data-masuk>
                  <h3>{nama}</h3>
                  {info && (
                    <>
                      <div className="hasil__risiko" aria-label={`Tingkat risiko ${LABEL_RISIKO[info.risiko]}`}>
                        <span className="hasil__risiko-titik" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <i key={n} className={n <= info.risiko ? 'hasil__risiko-isi' : ''} />
                          ))}
                        </span>
                        <small>Risiko {LABEL_RISIKO[info.risiko].toLowerCase()}</small>
                      </div>
                      <p>{info.uraian}</p>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Rincian perhitungan */}
        <details className="hasil__rincian" data-masuk>
          <summary>
            <span>
              <strong>Lihat rincian perhitungan</strong>
            </span>
            <i aria-hidden="true">{Ikon.panahBawah}</i>
          </summary>

          <div className="hasil__rincian-isi">
            <p>
              Sistem hanya memakai {hasil.jumlahIndikatorTeramati} pernyataan yang Anda jawab dengan keyakinan lebih dari nol. Untuk tiap profil, nilai awalnya adalah probabilitas prior,
              lalu dikalikan hasil kali antara likelihood terkoreksi Laplace dan keyakinan Anda pada setiap pernyataan. Hasil kali ini disebut numerator, dan posterior diperoleh dengan membagi numerator
              dengan jumlah ketiga numerator.
            </p>

            <h3>Ringkasan per profil</h3>
            <div className="hasil__tabel-bungkus">
              <table className="hasil__tabel">
                <thead>
                  <tr>
                    <th>Profil</th>
                    <th>Prior</th>
                    <th>Numerator</th>
                    <th>Posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.hasilPerProfil.map((p) => (
                    <tr key={p.kode} className={p.kode === tertinggi.kode ? 'hasil__tabel-juara' : undefined}>
                      <td>{p.kode} {p.nama}</td>
                      <td>{koma(p.prior, 2)}</td>
                      <td><Ilmiah nilai={p.numerator} /></td>
                      <td>{koma(p.posterior, 7)}</td>
                    </tr>
                  ))}
                </tbody>
                {hasil.penyebut !== null && (
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Penyebut (jumlah numerator)</td>
                      <td colSpan={2}><Ilmiah nilai={hasil.penyebut} /></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <h3>Pernyataan yang dipakai</h3>
            <div className="hasil__tabel-bungkus">
              <table className="hasil__tabel hasil__tabel--rapat">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Indikator</th>
                    <th>Jawaban</th>
                    <th>CF</th>
                    <th>P(Ei|H1)</th>
                    <th>P(Ei|H2)</th>
                    <th>P(Ei|H3)</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.indikatorTeramati.map((i, indeks) => (
                    <tr key={i.kode}>
                      <td>{i.kode}</td>
                      <td>{i.nama}</td>
                      <td>{labelJawaban(i.cf)}</td>
                      <td>{koma(i.cf, 1)}</td>
                      {hasil.hasilPerProfil.map((p) => (
                        <td key={p.kode}>{koma(p.faktor[indeks].likelihoodBaru, 4)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hasil__rumus">P(Ei|Hj) baru = (P(Ei|Hj) × 100 + 1) ÷ 102</p>
          </div>
        </details>

        <p className="hasil__peringatan" data-masuk>
          Hasil ini adalah skrining awal yang dihitung dari jawaban Anda dan basis pengetahuan seorang Certified Financial Planner, jadi layak Anda jadikan pegangan awal untuk mengenali diri sendiri. Hasil ini tidak menggantikan konsultasi langsung. Untuk keputusan yang besar, bawa hasil ini ke perencana keuangan berizin dan diskusikan bersama tujuan serta kondisi keuangan Anda.
        </p>

        <div className="hasil__aksi hasil__aksi--bawah" data-masuk>
          <button type="button" className="tombol tombol--garis" onClick={() => setModal({ jenis: 'ulangi' })}>
            {Ikon.ulang} Ulangi konsultasi
          </button>
          <Link to="/edukasi" className="tombol tombol--emas">
            Pelajari instrumen {Ikon.panah}
          </Link>
        </div>
      </div>

      {modal && (
        <ModalKonfirmasi
          judul={modal.jenis === 'ulangi' ? 'Ulangi konsultasi dari awal?' : 'Tinggalkan halaman hasil?'}
          ikon={pernahUnduh ? Ikon.centangBulat : Ikon.peringatan}
          nada={pernahUnduh ? 'teal' : 'emas'}
          saatBatal={tetapDiSini}
          tombol={[
            { label: modal.jenis === 'ulangi' ? 'Ya, ulangi dari awal' : 'Ya, tinggalkan halaman', aksi: lanjutPergi, gaya: 'bahaya' },
            { label: modal.jenis === 'ulangi' ? 'Batal' : 'Tetap di halaman ini', aksi: tetapDiSini, gaya: 'emas', autoFokus: true },
          ]}
        >
          <p>
            {modal.jenis === 'ulangi'
              ? 'Seluruh jawaban dan hasil di halaman ini akan dihapus, lalu Anda mulai lagi dari pernyataan pertama.'
              : 'Hasil konsultasi ini hanya tampil di halaman ini. Setelah Anda pergi, hasilnya tidak bisa dibuka kembali dengan mudah.'}
          </p>
          <div className={`hasil__pengingat${pernahUnduh ? ' hasil__pengingat--sudah' : ''}`}>
            <span className="hasil__pengingat-ikon" aria-hidden="true">
              {pernahUnduh ? Ikon.centang : Ikon.dokumen}
            </span>
            {pernahUnduh ? (
              <div>
                <strong>Laporan PDF sudah Anda unduh</strong>
                <p>Anda aman untuk melanjutkan.</p>
              </div>
            ) : (
              <div>
                <strong>Sudahkah Anda mengunduh laporan PDF?</strong>
                <p>Pastikan laporannya sudah tersimpan di perangkat Anda sebelum pergi. Laporan itu bisa diarsipkan atau dibawa saat berdiskusi dengan pakar.</p>
                <button type="button" className="hasil__pengingat-unduh" onClick={unduhLaporan} disabled={statusPdf === 'membuat'}>
                  {statusPdf === 'membuat' ? (
                    <>
                      <span className="hasil__putar" aria-hidden="true" /> Menyusun laporan
                    </>
                  ) : (
                    <>
                      {Ikon.unduh} Unduh PDF sekarang
                    </>
                  )}
                </button>
                {(statusPdf === 'galat' || statusPdf === 'galatMuat') && (
                  <span className="hasil__pengingat-galat" role="alert">
                    Laporan belum bisa dibuat. Tutup pop up ini lalu coba lagi dari tombol unduh di halaman.
                  </span>
                )}
              </div>
            )}
          </div>
        </ModalKonfirmasi>
      )}
    </div>
  )
}