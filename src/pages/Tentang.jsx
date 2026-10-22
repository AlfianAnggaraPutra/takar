import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import IkonEdukasi from '../components/IkonEdukasi'
import { gulirKe } from '../hooks/useScrollHalus'
import { DAFTAR_INDIKATOR, PILIHAN_JAWABAN } from '../data/basisPengetahuan'
import { hitungProfilRisiko } from '../lib/mesinInferensi'
import {
  ALUR,
  BAGIAN,
  BAHAN,
  BOBOT_AWAL,
  CONTOH_JAWABAN,
  CONTOH_LAPLACE,
  KETERBATASAN,
  KODE_SIMULATOR,
  ORANG,
  PEGANGAN,
  PERJALANAN,
  SINGKAT_JAWABAN,
  TOPIK_INDIKATOR,
} from '../data/tentang'
import './Tentang.css'

gsap.registerPlugin(ScrollTrigger)

const WARNA_PROFIL = { H1: 'teal', H2: 'emas', H3: 'terakota' }
const PERNYATAAN = KODE_SIMULATOR.map((kode) => DAFTAR_INDIKATOR.find((i) => i.kode === kode))

// Kurva lonceng sebagai hiasan latar hero, penanda bahwa isinya soal peluang.
const KURVA = Array.from({ length: 73 }, (_, i) => {
  const x = i * 20
  const y = 335 - 255 * Math.exp(-((x - 1060) ** 2) / (2 * 175 ** 2))
  return `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`
}).join(' ')
const KURVA_AREA = `${KURVA} L1440 360 L0 360 Z`

const persen = (p) => {
  const v = p * 100
  if (v > 0 && v < 0.05) return '< 0,1%'
  return `${v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
const angka = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 4 })

/* ---------- Simulator: empat pernyataan asli, dihitung mesin yang sama dengan halaman Konsultasi ---------- */

function Simulator({ tampil }) {
  const [jawaban, setJawaban] = useState(CONTOH_JAWABAN[1].jawaban)
  const hasil = useMemo(() => hitungProfilRisiko(jawaban), [jawaban])
  const contohAktif = CONTOH_JAWABAN.find((c) => KODE_SIMULATOR.every((k) => c.jawaban[k] === jawaban[k]))?.id
  const terjawab = KODE_SIMULATOR.filter((k) => jawaban[k] > 0).length
  const tertinggi = hasil.dapatDitentukan && !hasil.seri ? hasil.profilTertinggi : null

  const ringkasan = hasil.dapatDitentukan
    ? hasil.seri
      ? 'Dua profil seimbang, belum ada yang unggul.'
      : `Profil yang paling mungkin: ${tertinggi.nama}, ${persen(tertinggi.posterior)}.`
    : 'Belum ada pernyataan yang sesuai, profil belum bisa ditentukan.'

  // Catatan yang sama ditaruh di dua tempat: di dalam kartu (laptop) dan di bawah simulator (layar kecil).
  // CSS menyembunyikan salah satunya, jadi pembaca layar hanya membacanya sekali.
  const catatan = (
    <>
      <p>
        <strong>{terjawab}</strong> dari 40 pernyataan dipakai di sini.
      </p>
      <p>
        Bobot awal pakar: Konservatif {angka(BOBOT_AWAL.H1)}, Moderat {angka(BOBOT_AWAL.H2)}, Agresif {angka(BOBOT_AWAL.H3)}.
      </p>
    </>
  )

  return (
    <div className="tentang-sim">
      <div className="tentang-sim__kepala">
        <div>
          <p className="tentang-sim__judul">Coba sendiri, lihat peluangnya berpindah</p>
          <p className="tentang-sim__sub">
            Ini memakai angka dan mesin hitung asli TAKAR, tetapi hanya dari empat pernyataan. Hasil sebenarnya memakai ke-40 pernyataan, jadi jangan dibaca sebagai profil Anda.
          </p>
        </div>
        <div className="tentang-contoh" role="group" aria-label="Contoh jawaban">
          <span className="tentang-contoh__label">Mulai dari contoh</span>
          {CONTOH_JAWABAN.map((c) => (
            <button key={c.id} type="button" className={`tentang-chip ${contohAktif === c.id ? 'tentang-chip--aktif' : ''}`} aria-pressed={contohAktif === c.id} onClick={() => setJawaban(c.jawaban)}>
              {c.label}
            </button>
          ))}
          <button type="button" className="tentang-chip tentang-chip--sunyi" onClick={() => setJawaban(Object.fromEntries(KODE_SIMULATOR.map((k) => [k, 0])))}>
            <IkonEdukasi nama="ulang" ukuran={15} tebal={2} />
            Kosongkan
          </button>
        </div>
      </div>

      <div className="tentang-sim__isi">
        <div className="tentang-sim__daftar">
          {PERNYATAAN.map((p) => (
            <div className="tentang-pernyataan" key={p.kode}>
              <p className="tentang-pernyataan__teks" id={`sim-${p.kode}`}>
                <span className="tentang-pernyataan__kode">{p.kode}</span>
                {p.pertanyaan}
              </p>
              <div className="tentang-opsi" role="radiogroup" aria-labelledby={`sim-${p.kode}`}>
                {PILIHAN_JAWABAN.map((o) => (
                  <label className="tentang-opsi__butir" key={o.nilai}>
                    <input type="radio" name={`sim-${p.kode}`} value={o.nilai} checked={jawaban[p.kode] === o.nilai} onChange={() => setJawaban((j) => ({ ...j, [p.kode]: o.nilai }))} />
                    <span className="tentang-opsi__kotak">
                      <span className="tentang-sr">{o.label}</span>
                      <span aria-hidden="true">{SINGKAT_JAWABAN[o.nilai]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="tentang-hasil">
          <p className="tentang-hasil__judul">Peluang tiap profil</p>
          <p className="tentang-sr" role="status" aria-live="polite">
            {ringkasan}
          </p>
          {hasil.dapatDitentukan ? (
            <ul className="tentang-bar-daftar">
              {hasil.hasilPerProfil.map((r) => {
                const unggul = tertinggi?.kode === r.kode
                return (
                  <li className={`tentang-bar ${unggul ? 'tentang-bar--unggul' : ''}`} data-warna={WARNA_PROFIL[r.kode]} key={r.kode}>
                    <div className="tentang-bar__baris">
                      <span className="tentang-bar__nama">
                        {r.nama}
                        {unggul && (
                          <span className="tentang-bar__tanda">
                            <span className="tentang-bar__tanda-penuh">Paling mungkin</span>
                            <span className="tentang-bar__tanda-pendek">Teratas</span>
                          </span>
                        )}
                      </span>
                      <span className="tentang-bar__nilai">{persen(r.posterior)}</span>
                    </div>
                    <div className="tentang-bar__jalur" aria-hidden="true">
                      <span className="tentang-bar__isi" style={{ width: tampil ? `${Math.max(r.posterior * 100, r.posterior > 0 ? 0.8 : 0)}%` : '0%' }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="tentang-hasil__kosong">Belum ada pernyataan yang sesuai, jadi profil belum bisa ditentukan. Pilih jawaban selain Tidak pada salah satu pernyataan.</p>
          )}
          <div className="tentang-hasil__kaki">{catatan}</div>
        </div>
      </div>
      <div className="tentang-hasil__kaki tentang-hasil__kaki--bawah">{catatan}</div>
    </div>
  )
}

/* ---------- Halaman ---------- */

/*
  Empat kartu perjalanan dengan garis penghubung yang lentur. Garis digambar sebagai kurva yang melewati titik
  tengah setiap nomor. Saat sebuah kartu terangkat karena disorot, nomornya ikut naik dan garis melengkung
  mengikutinya, lalu kembali lurus ketika kartu turun. Posisi nomor dibaca langsung pada tiap bingkai gambar
  selama peralihan, jadi gerak garis selalu sama persis dengan gerak kartu.
*/
function JalurPerjalanan() {
  const wadah = useRef(null)
  const trek = useRef(null)
  const isi = useRef(null)
  const warna = useRef(null)
  const idGradasi = `jalan-gradasi-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  useLayoutEffect(() => {
    const el = wadah.current
    if (!el) return undefined
    const kartu = [...el.querySelectorAll('.tentang-jalan__kartu')]
    const nomor = kartu.map((k) => k.querySelector('.tentang-jalan__nomor'))
    let dTerakhir = ''
    let rafId = 0
    let berhentiPada = 0

    const gambar = () => {
      if (!el.isConnected) return
      // Titik tengah tiap nomor terhadap wadah. Gerak masuk baris (li) dikurangkan supaya garis tidak ikut meluncur,
      // sedangkan tinggi angkat kartu sengaja dibiarkan karena itulah yang harus diikuti garis.
      const kotak = el.getBoundingClientRect()
      const titik = nomor.map((n, i) => {
        const r = n.getBoundingClientRect()
        const geserBaris = new DOMMatrixReadOnly(getComputedStyle(kartu[i].parentElement).transform).m42
        return [r.left + r.width / 2 - kotak.left, r.top + r.height / 2 - kotak.top - geserBaris]
      })
      const tegak = Math.abs(titik[titik.length - 1][0] - titik[0][0]) < 40
      let d = `M${titik[0][0].toFixed(2)} ${titik[0][1].toFixed(2)}`
      for (let i = 1; i < titik.length; i += 1) {
        const [x0, y0] = titik[i - 1]
        const [x1, y1] = titik[i]
        const c1 = tegak ? [x0, y0 + (y1 - y0) / 2] : [x0 + (x1 - x0) / 2, y0]
        const c2 = tegak ? [x1, y1 - (y1 - y0) / 2] : [x1 - (x1 - x0) / 2, y1]
        d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`
      }
      if (d === dTerakhir) return
      dTerakhir = d
      trek.current?.setAttribute('d', d)
      isi.current?.setAttribute('d', d)
      const g = warna.current
      if (g) {
        g.setAttribute('x1', titik[0][0].toFixed(2))
        g.setAttribute('y1', titik[0][1].toFixed(2))
        g.setAttribute('x2', titik[titik.length - 1][0].toFixed(2))
        g.setAttribute('y2', titik[titik.length - 1][1].toFixed(2))
      }
    }

    // Selama ada peralihan (kartu naik atau turun), garis dihitung ulang pada setiap bingkai gambar.
    const ikuti = () => {
      gambar()
      if (performance.now() < berhentiPada) rafId = requestAnimationFrame(ikuti)
      else rafId = 0
    }
    const mulai = () => {
      berhentiPada = performance.now() + 900
      if (!rafId) rafId = requestAnimationFrame(ikuti)
    }

    gambar()
    const pengamat = new ResizeObserver(gambar)
    pengamat.observe(el)
    kartu.forEach((k) => pengamat.observe(k))
    const peristiwa = ['pointerover', 'pointerout', 'focusin', 'focusout', 'transitionrun', 'transitionend', 'transitioncancel']
    peristiwa.forEach((e) => el.addEventListener(e, mulai))
    document.fonts?.ready.then(gambar)
    window.addEventListener('load', gambar)
    return () => {
      pengamat.disconnect()
      peristiwa.forEach((e) => el.removeEventListener(e, mulai))
      window.removeEventListener('load', gambar)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="tentang-jalan" ref={wadah}>
      <svg className="tentang-jalan__garis" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={idGradasi} ref={warna} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4db3c6" />
            <stop offset="0.55" stopColor="#ecb54e" />
            <stop offset="1" stopColor="#e8836b" />
          </linearGradient>
        </defs>
        <path className="tentang-jalan__garis-trek" ref={trek} />
        <path className="tentang-jalan__garis-isi" ref={isi} pathLength="1" stroke={`url(#${idGradasi})`} />
      </svg>
      <ol className="tentang-jalan__daftar">
        {PERJALANAN.map((p, i) => (
          <li className="tentang-jalan__langkah" key={p.judul} data-muncul>
            <div className="tentang-jalan__kartu">
              <span className="tentang-jalan__nomor" aria-hidden="true">
                {i + 1}
              </span>
              <span className="tentang-jalan__ikon">
                <IkonEdukasi nama={p.ikon} ukuran={22} />
              </span>
              <h4>{p.judul}</h4>
              <p>{p.isi}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Tentang() {
  const { hash } = useLocation()
  const akar = useRef(null)
  const [bagianAktif, setBagianAktif] = useState('latar')
  const [topikId, setTopikId] = useState(TOPIK_INDIKATOR[0].id)
  const [rumusBuka, setRumusBuka] = useState(false)
  const [simTampil, setSimTampil] = useState(false)

  const topik = TOPIK_INDIKATOR.find((t) => t.id === topikId) ?? TOPIK_INDIKATOR[0]

  /* ----- Animasi ----- */
  useLayoutEffect(() => {
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let batal = false
    const ctx = gsap.context(() => {
      // Penanda bagian yang sedang dibaca, dipakai menu di bawah hero.
      BAGIAN.forEach((b) =>
        ScrollTrigger.create({
          trigger: `#${b.id}`,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => self.isActive && setBagianAktif(b.id),
        }),
      )
      if (kurangGerak) {
        setSimTampil(true)
        return
      }

      gsap.set('[data-muncul]', { autoAlpha: 0, y: 34 })
      gsap
        .timeline({ delay: 0.3, defaults: { ease: 'power4.out' } })
        .from('.tentang-hero__label, .tentang-hero__lead, .tentang-hero__aksi, .tentang-hero__metode', { autoAlpha: 0, y: 26, duration: 0.9, stagger: 0.1 })
        .from('.tentang-hero__baris-isi', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0)
        .from('.tentang-hero__kartu', { autoAlpha: 0, y: 50, scale: 0.95, duration: 1.2 }, 0.25)
        .fromTo('.tentang-kurva__garis', { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 0.6)
        .from('.tentang-kurva__area', { autoAlpha: 0, duration: 1.4 }, 1.4)
        .fromTo('.tentang-alur__garis', { '--p': 0 }, { '--p': 1, duration: 1.8, ease: 'power2.inOut' }, 0.9)
        .from('.tentang-alur__langkah', { autoAlpha: 0, x: 22, duration: 0.8, stagger: 0.22, clearProps: 'transform' }, 0.9)

      gsap.to('.tentang-hero__grid', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.tentang-hero', start: 'top top', end: 'bottom top', scrub: true } })

      ScrollTrigger.batch('[data-muncul]', {
        start: 'top 90%',
        once: true,
        onEnter: (kelompok) => gsap.to(kelompok, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, overwrite: true, clearProps: 'transform' }),
      })

      // Garis perjalanan tergambar saat bagian latar belakang terlihat.
      gsap.fromTo('.tentang-jalan__garis-isi', { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: '.tentang-jalan', start: 'top 82%', once: true } })
      gsap.from('.tentang-jalan__nomor', { scale: 0, duration: 0.6, stagger: 0.25, ease: 'back.out(2.2)', clearProps: 'transform', scrollTrigger: { trigger: '.tentang-jalan', start: 'top 82%', once: true } })

      // Batang hasil simulator tumbuh dari nol saat simulator terlihat.
      ScrollTrigger.create({ trigger: '.tentang-sim', start: 'top 80%', once: true, onEnter: () => setSimTampil(true) })
    }, akar)

    document.fonts?.ready.then(() => {
      if (!batal) ScrollTrigger.refresh()
    })
    return () => {
      batal = true
      ctx.revert()
    }
  }, [])

  /* ----- Tautan dengan #hash, misalnya /tentang#cara ----- */
  useEffect(() => {
    if (!hash) return
    // #hash yang rusak (misalnya %E0%A4%A atau karakter ilegal) tidak boleh membuat halaman galat
    let id = hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* pakai apa adanya */ }
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) gulirKe(el, -120)
    }, 450)
    return () => clearTimeout(t)
  }, [hash])

  return (
    <div className="tentang" ref={akar}>
      {/* ============ HERO ============ */}
      <section className="tentang-hero" id="atas">
        <div className="tentang-hero__grid" aria-hidden="true" />
        <div className="tentang-hero__cahaya tentang-hero__cahaya--a" aria-hidden="true" />
        <div className="tentang-hero__cahaya tentang-hero__cahaya--b" aria-hidden="true" />
        <svg className="tentang-kurva" viewBox="0 0 1440 360" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="tentang-kurva-garis" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#4db3c6" />
              <stop offset="0.65" stopColor="#ecb54e" />
              <stop offset="1" stopColor="#e8836b" />
            </linearGradient>
            <linearGradient id="tentang-kurva-isi" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ecb54e" stopOpacity="0.16" />
              <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="tentang-kurva__area" d={KURVA_AREA} fill="url(#tentang-kurva-isi)" />
          <path className="tentang-kurva__garis" d={KURVA} fill="none" stroke="url(#tentang-kurva-garis)" strokeWidth="2.5" strokeLinecap="round" pathLength="1" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="pembungkus tentang-hero__isi">
          <div className="tentang-hero__teks">
            <p className="label-seksi tentang-hero__label">Tentang TAKAR</p>
            <h1 className="tentang-hero__judul">
              <span className="tentang-hero__baris">
                <span className="tentang-hero__baris-isi">Hitungannya dari</span>
              </span>
              <span className="tentang-hero__baris">
                <span className="tentang-hero__baris-isi">
                  <em>matematika</em>, penilaiannya
                </span>
              </span>
              <span className="tentang-hero__baris">
                <span className="tentang-hero__baris-isi">
                  dari <em>pakar</em>.
                </span>
              </span>
            </h1>
            <p className="lead-seksi tentang-hero__lead">
              TAKAR lahir dari penelitian skripsi di Program Studi S-1 Matematika, Universitas Airlangga. Tujuannya satu: membantu Anda mengenali seberapa besar risiko yang nyaman Anda tanggung, sebelum memilih tempat menaruh uang.
            </p>
            <div className="tentang-hero__aksi">
              <button type="button" className="tombol tombol--emas" onClick={() => gulirKe('#cara', -110)}>
                Lihat cara kerjanya
                <IkonEdukasi nama="panah" ukuran={18} tebal={2} />
              </button>
              <Link to="/konsultasi" className="tombol tombol--garis">
                Langsung coba konsultasi
              </Link>
            </div>
            <div className="tentang-hero__metode" aria-label="Metode yang dipakai">
              <span>Metode</span>
              <ul>
                <li>Naive Bayes</li>
                <li>Certainty Factor</li>
                <li>Koreksi Laplace</li>
              </ul>
            </div>
          </div>

          <div className="tentang-hero__kartu">
            <div className="tentang-hero__kartu-kepala">
              <p>Dari jawaban sampai profil</p>
              <span>Satu konsultasi</span>
            </div>
            <div className="tentang-alur">
              <span className="tentang-alur__garis" aria-hidden="true">
                <span className="tentang-alur__garis-isi" />
              </span>
              <ol className="tentang-alur__daftar">
                {ALUR.map((a, i) => (
                  <li className="tentang-alur__langkah" key={a.judul}>
                    <span className="tentang-alur__ikon">
                      <IkonEdukasi nama={a.ikon} ukuran={21} />
                    </span>
                    <span className="tentang-alur__teks">
                      <strong>
                        <span className="tentang-alur__no">{i + 1}.</span> {a.judul}
                      </strong>
                      <span>{a.isi}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian isi: menu menempel hanya selama bagian ini terlihat */}
      <div className="tentang-badan">
        <div className="tentang-nav">
          <nav className="pembungkus tentang-nav__dalam" aria-label="Bagian halaman">
            {BAGIAN.map((b) => (
              <button key={b.id} type="button" className={`tentang-nav__tombol ${bagianAktif === b.id ? 'tentang-nav__tombol--aktif' : ''}`} aria-current={bagianAktif === b.id ? 'true' : undefined} onClick={() => gulirKe(`#${b.id}`, -110)}>
                {b.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ============ LATAR BELAKANG ============ */}
        <section className="tentang-seksi" id="latar">
          <div className="pembungkus">
            <div className="tentang-latar">
              <div className="tentang-latar__teks" data-muncul>
                <p className="label-seksi">Latar belakang</p>
                <h2 className="judul-seksi">Banyak orang memilih produk investasi sebelum mengenal dirinya sendiri</h2>
                <p>Membeli produk investasi sekarang semudah beberapa ketukan di ponsel. Yang tidak ikut dipermudah adalah pertanyaan sebelum membeli: sanggupkah saya melihat nilainya turun, dan sampai kapan saya sanggup menunggu?</p>
                <p>Lembaga keuangan biasanya menanyakannya lewat kuesioner profil risiko. TAKAR mengambil jalan yang lain. Pengetahuan seorang perencana keuangan diubah menjadi angka peluang, lalu dipadukan dengan seberapa yakin Anda menjawab.</p>
                <p className="tentang-latar__tekan">Hasilnya bukan sekadar skor, melainkan persentase keyakinan untuk tiap profil.</p>
              </div>
              <ul className="tentang-pegangan" data-muncul>
                {PEGANGAN.map((p) => (
                  <li className="tentang-pegangan__butir" key={p.judul}>
                    <span className="tentang-pegangan__ikon">
                      <IkonEdukasi nama={p.ikon} ukuran={22} />
                    </span>
                    <div>
                      <h3>{p.judul}</h3>
                      <p>{p.isi}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="tentang-jalan__kepala" data-muncul>
              <h3>Dari pertanyaan sampai website</h3>
              <p>Empat tahap yang dilalui sebelum TAKAR bisa Anda pakai.</p>
            </div>
            <JalurPerjalanan />
          </div>
        </section>

        {/* ============ CARA KERJA ============ */}
        <section className="tentang-seksi tentang-seksi--terang" id="cara">
          <div className="pembungkus">
            <div className="tentang-kepala" data-muncul>
              <p className="label-seksi">Cara kerja</p>
              <h2 className="judul-seksi">Cara TAKAR menghitung, tanpa perlu paham rumusnya</h2>
              <p className="lead-seksi">
                Dua metode bekerja bersama. Naive Bayes menjawab &ldquo;profil mana yang paling masuk akal?&rdquo;, sedangkan Certainty Factor menjawab &ldquo;seberapa yakin Anda dengan jawaban itu?&rdquo;.
              </p>
            </div>

            <ol className="tentang-bahan" data-muncul>
              {BAHAN.map((b, i) => (
                <li className="tentang-bahan__butir" key={b.judul}>
                  <span className="tentang-bahan__atas">
                    <span className="tentang-bahan__ikon">
                      <IkonEdukasi nama={b.ikon} ukuran={22} />
                    </span>
                    <span className="tentang-bahan__nomor">Bahan {i + 1}</span>
                  </span>
                  <h3>{b.judul}</h3>
                  <p>{b.isi}</p>
                </li>
              ))}
            </ol>

            <div data-muncul>
              <Simulator tampil={simTampil} />
            </div>

            <div className={`tentang-rumus ${rumusBuka ? 'tentang-rumus--buka' : ''}`} data-muncul>
              <button type="button" className="tentang-rumus__tombol" aria-expanded={rumusBuka} aria-controls="tentang-rumus-isi" onClick={() => setRumusBuka((b) => !b)}>
                <span>
                  <strong>Untuk yang ingin melihat rumusnya</strong>
                  <small>Tiga langkah hitungan yang dipakai sistem, lengkap dengan alasan koreksi Laplace</small>
                </span>
                <span className="tentang-rumus__panah">
                  <IkonEdukasi nama="chevron" ukuran={22} tebal={2} />
                </span>
              </button>
              <div className="tentang-rumus__badan" id="tentang-rumus-isi" role="region" aria-label="Rumus perhitungan" inert={!rumusBuka}>
                <div className="tentang-rumus__dalam">
                  <ol className="tentang-rumus__langkah">
                    <li>
                      <span className="tentang-rumus__no">1</span>
                      <div>
                        <h4>Koreksi Laplace</h4>
                        <p className="tentang-rumus__rumus">
                          P(E<sub>i</sub>|H<sub>j</sub>)&prime; = ( P(E<sub>i</sub>|H<sub>j</sub>) &times; n + 1 ) &divide; ( n + k )
                        </p>
                        <p>
                          Setiap bobot pakar dikoreksi dulu, dengan n = {CONTOH_LAPLACE.n} dan k = {CONTOH_LAPLACE.k}. Tujuannya agar bobot 0 tidak mematikan seluruh hitungan.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className="tentang-rumus__no">2</span>
                      <div>
                        <h4>Pembilang tiap profil</h4>
                        <p className="tentang-rumus__rumus">
                          N<sub>j</sub> = P(H<sub>j</sub>) &times; &Pi; [ P(E<sub>i</sub>|H<sub>j</sub>)&prime; &times; CF<sub>i</sub> ]
                        </p>
                        <p>Hanya pernyataan yang Anda tandai sesuai (CF di atas 0) yang ikut dikalikan. Pernyataan yang dijawab Tidak tidak memengaruhi hasil.</p>
                      </div>
                    </li>
                    <li>
                      <span className="tentang-rumus__no">3</span>
                      <div>
                        <h4>Persentase keyakinan</h4>
                        <p className="tentang-rumus__rumus">
                          P(H<sub>j</sub>|E) = N<sub>j</sub> &divide; &Sigma; N
                        </p>
                        <p>Pembilang ketiga profil dijumlahkan, lalu masing-masing dibagi jumlah itu. Profil dengan persentase tertinggi menjadi hasil Anda.</p>
                      </div>
                    </li>
                  </ol>
                  <div className="tentang-rumus__contoh">
                    <h4>Mengapa perlu koreksi Laplace?</h4>
                    <p>
                      Pada indikator {CONTOH_LAPLACE.kode} ({CONTOH_LAPLACE.nama.toLowerCase()}), pakar memberi bobot {angka(CONTOH_LAPLACE.awal)} untuk profil Konservatif. Tanpa koreksi, satu jawaban Sesuai pada {CONTOH_LAPLACE.kode} saja sudah membuat peluang Konservatif menjadi nol, apa pun jawaban Anda yang lain. Dengan koreksi, bobotnya menjadi 1 &divide; {CONTOH_LAPLACE.n + CONTOH_LAPLACE.k} &asymp; {angka(CONTOH_LAPLACE.hasil)}: sangat kecil, tetapi profil itu masih boleh menang bila jawaban lain mendukungnya.
                    </p>
                    <p className="tentang-rumus__bukti">
                      <IkonEdukasi nama="centang" ukuran={17} tebal={2.2} />
                      Pada contoh kasus di skripsi, perhitungan manual dan sistem menghasilkan angka yang sama: Moderat 99,83%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ INDIKATOR ============ */}
        <section className="tentang-seksi" id="indikator">
          <div className="pembungkus">
            <div className="tentang-kepala" data-muncul>
              <p className="label-seksi">Indikator</p>
              <h2 className="judul-seksi">Empat puluh pernyataan, delapan topik</h2>
              <p className="lead-seksi">Semua pernyataan di halaman Konsultasi dikelompokkan menjadi delapan topik. Pilih satu untuk melihat apa saja yang diukur.</p>
            </div>

            <div className="tentang-topik" data-muncul>
              <div className="tentang-topik__daftar" role="group" aria-label="Pilih topik indikator">
                {TOPIK_INDIKATOR.map((t) => (
                  <button key={t.id} type="button" className={`tentang-topik__tombol ${t.id === topikId ? 'tentang-topik__tombol--aktif' : ''}`} aria-pressed={t.id === topikId} aria-controls="tentang-topik-panel" onClick={() => setTopikId(t.id)}>
                    <span className="tentang-topik__ikon">
                      <IkonEdukasi nama={t.ikon} ukuran={21} />
                    </span>
                    <span className="tentang-topik__nama">{t.judul}</span>
                    <span className="tentang-topik__jumlah">{t.indikator.length} pernyataan</span>
                  </button>
                ))}
              </div>

              <div className="tentang-topik__panel" id="tentang-topik-panel" key={topik.id} aria-live="polite">
                <div className="tentang-topik__kepala">
                  <span className="tentang-topik__ikon tentang-topik__ikon--besar">
                    <IkonEdukasi nama={topik.ikon} ukuran={26} tebal={1.6} />
                  </span>
                  <div>
                    <h3>{topik.judul}</h3>
                    <p>{topik.uraian}</p>
                  </div>
                </div>
                <ul className="tentang-topik__isi" data-jml={topik.indikator.length}>
                  {topik.indikator.map((i) => (
                    <li key={i.kode}>
                      <span className="tentang-topik__kode">{i.kode}</span>
                      {i.nama}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============ PAKAR ============ */}
        <section className="tentang-seksi tentang-seksi--terang" id="pakar">
          <div className="pembungkus">
            <div className="tentang-kepala" data-muncul>
              <p className="label-seksi">Peneliti, pakar, dan pembimbing</p>
              <h2 className="judul-seksi">Orang-orang di balik angkanya</h2>
              <p className="lead-seksi">Setiap angka di TAKAR punya asal-usul. Ini siapa saja yang menyumbangkannya.</p>
            </div>
            <div className="tentang-orang" data-muncul>
              {ORANG.map((o) => (
                <article className="tentang-orang__kartu" data-warna={o.warna} key={o.peran}>
                  <span className="tentang-orang__ikon">
                    <IkonEdukasi nama={o.ikon} ukuran={28} tebal={1.6} />
                  </span>
                  <p className="tentang-orang__peran">{o.peran}</p>
                  {o.nama && <h3 className="tentang-orang__nama">{o.nama}</h3>}
                  {o.uraian && <p className="tentang-orang__uraian">{o.uraian}</p>}
                </article>
              ))}
            </div>
            <p className="tentang-catatan" data-muncul>
              Seluruh angka basis pengetahuan diambil dari data skripsi, sehingga penguji dapat mencocokkannya satu per satu.
            </p>
          </div>
        </section>

        {/* ============ BATASAN ============ */}
        <section className="tentang-seksi" id="batasan">
          <div className="pembungkus">
            <div className="tentang-kepala" data-muncul>
              <p className="label-seksi">Batasan</p>
              <h2 className="judul-seksi">Yang perlu Anda ketahui sebelum memercayai hasilnya</h2>
              <p className="lead-seksi">Setiap alat punya batas. Dengan mengenalinya sejak awal, Anda bisa memanfaatkan hasilnya sebaik mungkin.</p>
            </div>
            <ul className="tentang-batas" data-muncul>
              {KETERBATASAN.map((k) => (
                <li className="tentang-batas__kartu" data-warna={k.warna} key={k.judul}>
                  <span className="tentang-batas__ikon">
                    <IkonEdukasi nama={k.ikon} ukuran={22} />
                  </span>
                  <h3>{k.judul}</h3>
                  <p>{k.isi}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ============ AJAKAN ============ */}
      <section className="tentang-ajakan">
        <div className="pembungkus tentang-ajakan__isi" data-muncul>
          <span className="tentang-ajakan__ikon">
            <IkonEdukasi nama="timbang" ukuran={28} tebal={1.6} />
          </span>
          <h2>Penasaran apa hasilnya untuk Anda?</h2>
          <p>Empat langkah, masing-masing sepuluh pernyataan, dan laporan PDF di akhirnya. Tanpa akun dan tanpa biaya.</p>
          <div className="tentang-ajakan__aksi">
            <Link to="/konsultasi" className="tombol tombol--navy">
              Mulai Konsultasi
              <IkonEdukasi nama="panah" ukuran={18} tebal={2} />
            </Link>
            <Link to="/edukasi" className="tentang-ajakan__tautan">
              Belajar dulu di Edukasi
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}