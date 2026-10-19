import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import IkonEdukasi from '../components/IkonEdukasi'
import { gulirKe } from '../hooks/useScrollHalus'
import { DAFTAR_INSTRUMEN, DAFTAR_PROFIL, ISTILAH, KEKELIRUAN, LABEL_RISIKO, PERSIAPAN, warnaRisiko } from '../data/edukasi'
import './Edukasi.css'

gsap.registerPlugin(ScrollTrigger)

const BAGIAN = [
  { id: 'profil', label: 'Profil risiko' },
  { id: 'instrumen', label: 'Instrumen' },
  { id: 'persiapan', label: 'Persiapan' },
  { id: 'istilah', label: 'Istilah' },
  { id: 'kekeliruan', label: 'Kekeliruan umum' },
]

const SARINGAN = [
  { id: 'semua', label: 'Semua' },
  { id: 'konservatif', label: 'Konservatif' },
  { id: 'moderat', label: 'Moderat' },
  { id: 'agresif', label: 'Agresif' },
]

const huruf = (teks) => teks.charAt(0).toUpperCase() + teks.slice(1)
const WARNA_PROFIL = { konservatif: 'teal', moderat: 'emas', agresif: 'terakota' }

/* ---------- Grafik hero: risiko dan potensi hasil ---------- */

const GAMBAR = { lebar: 560, tinggi: 350 }
const TITIK = DAFTAR_INSTRUMEN.map((it, i) => ({ ...it, x: 78 + i * 72, y: 290 - 244 * Math.pow(i / (DAFTAR_INSTRUMEN.length - 1), 1.6) }))

// Menghubungkan titik-titik dengan kurva yang halus (Catmull-Rom diubah menjadi Bezier).
function jalurHalus(titik) {
  let d = `M${titik[0].x} ${titik[0].y}`
  for (let i = 0; i < titik.length - 1; i++) {
    const p0 = titik[i - 1] ?? titik[i]
    const p1 = titik[i]
    const p2 = titik[i + 1]
    const p3 = titik[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`
  }
  return d
}
const JALUR_KURVA = jalurHalus(TITIK)
const JALUR_AREA = `${JALUR_KURVA} L${TITIK[TITIK.length - 1].x} 312 L${TITIK[0].x} 312 Z`

function GrafikRisiko({ aktif, saatPilih }) {
  const it = TITIK.find((t) => t.slug === aktif)
  return (
    <svg className="edu-grafik" viewBox={`0 0 ${GAMBAR.lebar} ${GAMBAR.tinggi}`} role="group" aria-label="Grafik gambaran risiko dan potensi hasil tujuh instrumen">
      <defs>
        <linearGradient id="edu-garis" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4db3c6" />
          <stop offset="0.5" stopColor="#ecb54e" />
          <stop offset="1" stopColor="#e8836b" />
        </linearGradient>
        <linearGradient id="edu-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ecb54e" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tiga zona */}
      <rect x="40" y="30" width="218" height="282" rx="14" fill="#4db3c6" opacity="0.07" />
      <rect x="262" y="30" width="136" height="282" rx="14" fill="#ecb54e" opacity="0.07" />
      <rect x="402" y="30" width="138" height="282" rx="14" fill="#e8836b" opacity="0.08" />
      <g className="edu-grafik__zona" textAnchor="middle">
        <text x="149" y="336" fill="#7fd0dd">Tenang</text>
        <text x="330" y="336" fill="#f0cd82">Seimbang</text>
        <text x="471" y="336" fill="#f4a794">Berani</text>
      </g>

      {/* Kisi tipis */}
      <g stroke="rgba(246,243,236,0.08)" strokeWidth="1">
        {[100, 170, 240].map((y) => (
          <line key={y} x1="40" x2="540" y1={y} y2={y} />
        ))}
      </g>

      <path className="edu-grafik__area" d={JALUR_AREA} fill="url(#edu-area)" />
      <path className="edu-grafik__garis" d={JALUR_KURVA} fill="none" stroke="url(#edu-garis)" strokeWidth="3.5" strokeLinecap="round" pathLength="1" />

      <text className="edu-grafik__sumbu" x="48" y="22">
        Potensi hasil makin besar
      </text>

      {TITIK.map((t) => {
        const warna = warnaRisiko(t.risiko)
        const sedang = aktif === t.slug
        return (
          <g
            key={t.slug}
            className={`edu-titik edu-titik--${warna} ${sedang ? 'edu-titik--aktif' : ''}`}
            transform={`translate(${t.x} ${t.y})`}
            role="button"
            tabIndex={0}
            aria-pressed={sedang}
            aria-label={`${t.nama}, risiko ${LABEL_RISIKO[t.risiko].toLowerCase()}`}
            onClick={() => saatPilih(t.slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                saatPilih(t.slug)
              }
            }}
          >
            <circle className="edu-titik__lingkar" r="17" />
            <circle className="edu-titik__inti" r="8.5" />
          </g>
        )
      })}

      {it && (
        <g className="edu-grafik__label" transform={`translate(${it.x} ${it.y - 30})`} pointerEvents="none">
          <text textAnchor={it.x > 440 ? 'end' : it.x < 120 ? 'start' : 'middle'} x={it.x > 440 ? 18 : it.x < 120 ? -18 : 0}>
            {it.nama}
          </text>
        </g>
      )}
    </svg>
  )
}

/* ---------- Meter risiko lima titik ---------- */

function Meter({ nilai, warna }) {
  return (
    <span className={`edu-meter edu-meter--${warna}`} role="img" aria-label={`Tingkat risiko ${LABEL_RISIKO[nilai].toLowerCase()}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= nilai ? 'edu-meter__titik edu-meter__titik--isi' : 'edu-meter__titik'} />
      ))}
    </span>
  )
}

/* ---------- Halaman ---------- */

export default function Edukasi() {
  const { hash } = useLocation()
  const akar = useRef(null)
  const daftarTab = useRef(null)
  const tombolTab = useRef({})

  const [bagianAktif, setBagianAktif] = useState('profil')
  const [pilih, setPilih] = useState(DAFTAR_INSTRUMEN[0].slug)
  const [saring, setSaring] = useState('semua')
  const [titikHero, setTitikHero] = useState(null)
  const [cariIstilah, setCariIstilah] = useState('')

  const instrumen = DAFTAR_INSTRUMEN.find((i) => i.slug === pilih) ?? DAFTAR_INSTRUMEN[0]
  const indeks = DAFTAR_INSTRUMEN.indexOf(instrumen)
  const sebelumnya = DAFTAR_INSTRUMEN[indeks - 1]
  const berikutnya = DAFTAR_INSTRUMEN[indeks + 1]
  const warnaIns = warnaRisiko(instrumen.risiko)
  const cocok = (it) => saring === 'semua' || it.profil.includes(saring)

  const istilahTampil = useMemo(() => {
    const k = cariIstilah.trim().toLowerCase()
    return k ? ISTILAH.filter((s) => s.istilah.toLowerCase().includes(k) || s.arti.toLowerCase().includes(k)) : ISTILAH
  }, [cariIstilah])

  /* ----- Animasi ----- */
  useLayoutEffect(() => {
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let batal = false
    const ctx = gsap.context(() => {
      // Penanda bagian yang sedang dibaca, dipakai bilah navigasi di bawah hero.
      BAGIAN.forEach((b) =>
        ScrollTrigger.create({
          trigger: `#${b.id}`,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => self.isActive && setBagianAktif(b.id),
        }),
      )
      if (kurangGerak) return

      gsap.set('[data-muncul]', { autoAlpha: 0, y: 34 })
      gsap
        .timeline({ delay: 0.3, defaults: { ease: 'power4.out' } })
        .from('.edu-hero__label, .edu-hero__lead, .edu-hero__aksi, .edu-hero__angka', { autoAlpha: 0, y: 26, duration: 0.9, stagger: 0.1 })
        .from('.edu-hero__baris-isi', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0)
        .from('.edu-hero__kartu', { autoAlpha: 0, y: 50, scale: 0.95, duration: 1.2 }, 0.25)
        .fromTo('.edu-grafik__garis', { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0.8)
        .from('.edu-grafik__area', { autoAlpha: 0, duration: 1.2 }, 1.6)
        .from('.edu-titik__inti, .edu-titik__lingkar', { scale: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.07, ease: 'back.out(2.2)', clearProps: 'transform' }, 1.0)

      gsap.to('.edu-hero__grid', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.edu-hero', start: 'top top', end: 'bottom top', scrub: true } })

      ScrollTrigger.batch('[data-muncul]', {
        start: 'top 90%',
        once: true,
        onEnter: (kelompok) => gsap.to(kelompok, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, overwrite: true, clearProps: 'transform' }),
      })
    }, akar)

    document.fonts?.ready.then(() => {
      if (!batal) ScrollTrigger.refresh()
    })
    return () => {
      batal = true
      ctx.revert()
    }
  }, [])

  /* ----- Tautan dengan #hash, misalnya /edukasi#instrumen-saham dari Beranda ----- */
  useEffect(() => {
    if (!hash) return
    // #hash yang rusak (misalnya %E0%A4%A atau karakter ilegal) tidak boleh membuat halaman galat
    let id = hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* pakai apa adanya */ }
    let sasaran = id
    if (id.startsWith('instrumen-')) {
      const slug = id.slice('instrumen-'.length)
      if (DAFTAR_INSTRUMEN.some((i) => i.slug === slug)) {
        setPilih(slug)
        setSaring('semua')
        sasaran = 'instrumen'
      }
    }
    const t = setTimeout(() => {
      const el = document.getElementById(sasaran)
      if (el) gulirKe(el, -120)
    }, 450)
    return () => clearTimeout(t)
  }, [hash])

  /* ----- Tab instrumen yang dipilih selalu terlihat saat daftar tab bisa digeser ke samping ----- */
  useEffect(() => {
    const daftar = daftarTab.current
    const tombol = tombolTab.current[pilih]
    if (!daftar || !tombol || daftar.scrollWidth <= daftar.clientWidth + 2) return
    daftar.scrollTo({ left: tombol.offsetLeft - (daftar.clientWidth - tombol.offsetWidth) / 2, behavior: 'smooth' })
  }, [pilih])

  const keInstrumen = (slug, gulir = true) => {
    setPilih(slug)
    const target = DAFTAR_INSTRUMEN.find((i) => i.slug === slug)
    if (target && saring !== 'semua' && !target.profil.includes(saring)) setSaring('semua')
    if (gulir) gulirKe('#instrumen', -110)
  }

  const pilihSaring = (s) => {
    setSaring(s)
    if (s !== 'semua' && !instrumen.profil.includes(s)) {
      const pertama = DAFTAR_INSTRUMEN.find((i) => i.profil.includes(s))
      if (pertama) setPilih(pertama.slug)
    }
  }

  const saatTombolTab = (e) => {
    const kunci = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    let tujuan = null
    if (kunci) tujuan = DAFTAR_INSTRUMEN[(indeks + kunci + DAFTAR_INSTRUMEN.length) % DAFTAR_INSTRUMEN.length]
    if (e.key === 'Home') tujuan = DAFTAR_INSTRUMEN[0]
    if (e.key === 'End') tujuan = DAFTAR_INSTRUMEN[DAFTAR_INSTRUMEN.length - 1]
    if (!tujuan) return
    e.preventDefault()
    setPilih(tujuan.slug)
    tombolTab.current[tujuan.slug]?.focus()
  }

  const titikAktif = TITIK.find((t) => t.slug === titikHero)

  return (
    <div className="edu" ref={akar}>
      {/* ============ HERO ============ */}
      <section className="edu-hero" id="atas">
        <div className="edu-hero__grid" aria-hidden="true" />
        <div className="edu-hero__cahaya edu-hero__cahaya--a" aria-hidden="true" />
        <div className="edu-hero__cahaya edu-hero__cahaya--b" aria-hidden="true" />
        <div className="pembungkus edu-hero__isi">
          <div className="edu-hero__teks">
            <p className="label-seksi edu-hero__label">Edukasi investasi</p>
            <h1 className="edu-hero__judul">
              <span className="edu-hero__baris">
                <span className="edu-hero__baris-isi">Kenali risikonya dulu,</span>
              </span>
              <span className="edu-hero__baris">
                <span className="edu-hero__baris-isi">
                  baru pilih <em>tempat menaruh uang</em>
                </span>
              </span>
            </h1>
            <p className="lead-seksi edu-hero__lead">
              Hasil konsultasi TAKAR akan menyebut satu nama profil dan beberapa instrumen. Halaman ini menjelaskan artinya, supaya Anda paham kenapa yang satu cocok dan yang lain sebaiknya dipikir ulang.
            </p>
            <div className="edu-hero__aksi">
              <button type="button" className="tombol tombol--emas" onClick={() => gulirKe('#profil', -110)}>
                Mulai dari profil risiko
                <IkonEdukasi nama="panah" ukuran={18} tebal={2} />
              </button>
              <button type="button" className="tombol tombol--garis" onClick={() => gulirKe('#instrumen', -110)}>
                Langsung ke instrumen
              </button>
            </div>
            <ul className="edu-hero__angka" aria-label="Isi halaman">
              <li>
                <strong>{DAFTAR_PROFIL.length}</strong> profil risiko
              </li>
              <li>
                <strong>{DAFTAR_INSTRUMEN.length}</strong> instrumen
              </li>
              <li>
                <strong>{ISTILAH.length}</strong> istilah
              </li>
            </ul>
          </div>

          <div className="edu-hero__kartu">
            <div className="edu-hero__kartu-kepala">
              <p>Risiko dan potensi hasil berjalan beriringan</p>
              <span>Gambaran relatif</span>
            </div>
            <GrafikRisiko aktif={titikHero} saatPilih={setTitikHero} />
            <div className="edu-hero__sorotan" aria-live="polite">
              {titikAktif ? (
                <>
                  <div>
                    <p className="edu-hero__sorotan-nama">{titikAktif.nama}</p>
                    <p className="edu-hero__sorotan-info">Risiko {LABEL_RISIKO[titikAktif.risiko].toLowerCase()}</p>
                  </div>
                  <button type="button" className="edu-tautan" onClick={() => keInstrumen(titikAktif.slug)}>
                    Baca penjelasannya <IkonEdukasi nama="panah" ukuran={16} tebal={2.2} />
                  </button>
                </>
              ) : (
                <p className="edu-hero__sorotan-info">Pilih salah satu titik untuk melihat instrumennya. Makin ke kanan, makin besar peluang sekaligus risikonya.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bagian isi: navigasi menempel hanya selama bagian ini terlihat */}
      <div className="edu-badan">
        {/* ============ NAVIGASI BAGIAN ============ */}
        <div className="edu-nav">
          <nav className="pembungkus edu-nav__dalam" aria-label="Bagian halaman">
            {BAGIAN.map((b) => (
              <button key={b.id} type="button" className={`edu-nav__tombol ${bagianAktif === b.id ? 'edu-nav__tombol--aktif' : ''}`} aria-current={bagianAktif === b.id ? 'true' : undefined} onClick={() => gulirKe(`#${b.id}`, -110)}>
                {b.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ============ PROFIL ============ */}
        <section className="edu-seksi" id="profil">
          <div className="pembungkus">
            <div className="edu-kepala" data-muncul>
              <p className="label-seksi">Profil risiko</p>
              <h2 className="judul-seksi">Tiga cara orang bersikap saat uangnya naik turun</h2>
              <p className="lead-seksi">
                Tidak ada profil yang lebih baik dari yang lain. Yang berbahaya adalah memilih instrumen yang tidak cocok dengan watak Anda, lalu panik ketika nilainya bergerak.
              </p>
            </div>

            <div className="edu-profil" data-muncul>
              {DAFTAR_PROFIL.map((p) => (
                <article className="edu-profil__kartu" data-warna={p.warna} id={`profil-${p.slug}`} key={p.slug}>
                  <header className="edu-profil__kepala">
                    <span className="edu-profil__ikon">
                      <IkonEdukasi nama={p.ikon} ukuran={26} />
                    </span>
                    <div>
                      <p className="edu-profil__kode">
                        {p.kode} <span aria-hidden="true">•</span> {p.julukan}
                      </p>
                      <h3>{p.nama}</h3>
                    </div>
                  </header>
                  <p className="edu-profil__pembuka">{p.pembuka}</p>
                  {p.baris.map((b) => (
                    <div className="edu-profil__baris" key={b.judul}>
                      <p className="edu-profil__baris-judul">{b.judul}</p>
                      <p>{b.isi}</p>
                    </div>
                  ))}
                  <div className="edu-profil__kaki">
                    <p className="edu-profil__baris-judul">Yang umumnya dipilih</p>
                    <div className="edu-profil__chip">
                      {p.instrumen.map((slug) => {
                        const it = DAFTAR_INSTRUMEN.find((i) => i.slug === slug)
                        return (
                          <button type="button" className="edu-chip" key={slug} onClick={() => keInstrumen(slug)}>
                            {it.nama}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="edu-catatan" data-muncul>
              Belum tahu profil Anda yang mana? Tebakan sendiri sering meleset. <Link to="/konsultasi">Jawab 40 pernyataan di TAKAR</Link> dan lihat hasilnya.
            </p>
          </div>
        </section>

        {/* ============ INSTRUMEN ============ */}
        <section className="edu-seksi edu-seksi--terang" id="instrumen">
          <div className="pembungkus">
            <div className="edu-kepala" data-muncul>
              <p className="label-seksi">Instrumen investasi</p>
              <h2 className="judul-seksi">Tujuh tempat menaruh uang, dari yang paling tenang sampai yang paling berani</h2>
              <p className="lead-seksi">Pilih satu untuk membaca cara kerjanya, apa yang bisa salah, dan hal yang perlu dicek sebelum Anda membeli. Tingkat risiko di sini bersifat relatif antar instrumen.</p>
            </div>

            <div className="edu-saring" role="group" aria-label="Sorot instrumen menurut profil" data-muncul>
              <span className="edu-saring__label">Sorot yang umumnya cocok untuk</span>
              {SARINGAN.map((s) => (
                <button key={s.id} type="button" className={`edu-saring__tombol ${saring === s.id ? 'edu-saring__tombol--aktif' : ''}`} aria-pressed={saring === s.id} onClick={() => pilihSaring(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="edu-ins" data-muncul>
              <div className="edu-ins__daftar" role="tablist" aria-label="Daftar instrumen" aria-orientation="vertical" ref={daftarTab}>
                {DAFTAR_INSTRUMEN.map((it) => {
                  const aktif = it.slug === pilih
                  const w = warnaRisiko(it.risiko)
                  return (
                    <button
                      key={it.slug}
                      ref={(el) => {
                        tombolTab.current[it.slug] = el
                      }}
                      type="button"
                      role="tab"
                      id={`tab-${it.slug}`}
                      aria-selected={aktif}
                      aria-controls="panel-instrumen"
                      tabIndex={aktif ? 0 : -1}
                      className={`edu-tab edu-tab--${w} ${aktif ? 'edu-tab--aktif' : ''} ${cocok(it) ? '' : 'edu-tab--redup'}`}
                      onClick={() => setPilih(it.slug)}
                      onKeyDown={saatTombolTab}
                    >
                      <span className="edu-tab__ikon">
                        <IkonEdukasi nama={it.ikon} ukuran={20} />
                      </span>
                      <span className="edu-tab__teks">
                        <span className="edu-tab__nama">{it.nama}</span>
                        <span className="edu-tab__risiko">Risiko {LABEL_RISIKO[it.risiko].toLowerCase()}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <article className={`edu-panel edu-panel--${warnaIns}`} role="tabpanel" id="panel-instrumen" aria-labelledby={`tab-${instrumen.slug}`} key={instrumen.slug}>
                <header className="edu-panel__kepala">
                  <span className="edu-panel__ikon">
                    <IkonEdukasi nama={instrumen.ikon} ukuran={30} tebal={1.6} />
                  </span>
                  <div className="edu-panel__judul">
                    <h3>{instrumen.nama}</h3>
                    <div className="edu-panel__meta">
                      <Meter nilai={instrumen.risiko} warna={warnaIns} />
                      <span className="edu-panel__risiko">Risiko {LABEL_RISIKO[instrumen.risiko].toLowerCase()}</span>
                      <span className="edu-panel__pemisah" aria-hidden="true" />
                      {instrumen.profil.map((p) => (
                        <span className={`edu-lencana edu-lencana--${WARNA_PROFIL[p]}`} key={p}>
                          {huruf(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                </header>

                <p className="edu-panel__ringkas">{instrumen.ringkas}</p>

                <div className="edu-panel__isi">
                  <section className="edu-blok">
                    <h4>Cara kerjanya</h4>
                    <p>{instrumen.cara}</p>
                  </section>
                  <section className="edu-blok">
                    <h4>Yang menarik</h4>
                    <p>{instrumen.kelebihan}</p>
                  </section>
                  <section className="edu-blok edu-blok--waspada">
                    <h4>Yang perlu diwaspadai</h4>
                    <p>{instrumen.risikoUtama}</p>
                  </section>
                </div>

                <dl className="edu-fakta">
                  <div>
                    <dt>Kemudahan dicairkan</dt>
                    <dd>
                      {instrumen.cair}
                      <span>{instrumen.cairCatatan}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Patokan jangka waktu</dt>
                    <dd>{instrumen.horizon}</dd>
                  </div>
                  <div>
                    <dt>Cocok untuk</dt>
                    <dd>{instrumen.cocokUntuk}</dd>
                  </div>
                </dl>

                <div className="edu-periksa">
                  <h4>Periksa dulu sebelum membeli</h4>
                  <ul>
                    {instrumen.periksa.map((p) => (
                      <li key={p}>
                        <IkonEdukasi nama="centang" ukuran={16} tebal={2.6} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="edu-panel__kaki">
                  {sebelumnya ? (
                    <button type="button" className="edu-lompat" onClick={() => setPilih(sebelumnya.slug)}>
                      <IkonEdukasi nama="panah" ukuran={16} tebal={2.2} />
                      <span>
                        <small>Sebelumnya</small>
                        {sebelumnya.nama}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}
                  {berikutnya ? (
                    <button type="button" className="edu-lompat edu-lompat--maju" onClick={() => setPilih(berikutnya.slug)}>
                      <span>
                        <small>Berikutnya</small>
                        {berikutnya.nama}
                      </span>
                      <IkonEdukasi nama="panah" ukuran={16} tebal={2.2} />
                    </button>
                  ) : (
                    <span />
                  )}
                </footer>
              </article>
            </div>
          </div>
        </section>

        {/* ============ PERSIAPAN ============ */}
        <section className="edu-seksi" id="persiapan">
          <div className="pembungkus">
            <div className="edu-kepala" data-muncul>
              <p className="label-seksi">Sebelum uangnya masuk</p>
              <h2 className="judul-seksi">Empat hal yang sebaiknya beres lebih dulu</h2>
              <p className="lead-seksi">Instrumen terbaik pun tidak menolong kalau uangnya terpaksa ditarik di saat yang salah.</p>
            </div>
            <ol className="edu-persiapan" data-muncul>
              {PERSIAPAN.map((p, i) => (
                <li className="edu-langkah" key={p.judul}>
                  <span className="edu-langkah__nomor" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="edu-langkah__ikon">
                    <IkonEdukasi nama={p.ikon} ukuran={24} />
                  </span>
                  <h3>{p.judul}</h3>
                  <p>{p.isi}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============ ISTILAH ============ */}
        <section className="edu-seksi edu-seksi--terang" id="istilah">
          <div className="pembungkus">
            <div className="edu-kepala" data-muncul>
              <p className="label-seksi">Istilah yang sering muncul</p>
              <h2 className="judul-seksi">Kamus singkat supaya tidak bingung saat membaca</h2>
            </div>

            <label className="edu-cari" data-muncul>
              <span className="edu-cari__ikon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              </span>
              <input type="search" placeholder="Cari istilah, misalnya inflasi" aria-label="Cari istilah" value={cariIstilah} maxLength={40} onChange={(e) => setCariIstilah(e.target.value)} />
              {cariIstilah && (
                <button type="button" className="edu-cari__hapus" aria-label="Hapus pencarian" onClick={() => setCariIstilah('')}>
                  <IkonEdukasi nama="silang" ukuran={15} tebal={2.4} />
                </button>
              )}
            </label>

            {istilahTampil.length > 0 ? (
              <dl className="edu-istilah" data-muncul>
                {istilahTampil.map((s) => (
                  <div className="edu-istilah__butir" key={s.istilah}>
                    <dt>{s.istilah}</dt>
                    <dd>{s.arti}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="edu-kosong" role="status">
                Tidak ada istilah yang cocok dengan &ldquo;{cariIstilah.trim()}&rdquo;. Coba kata lain.
              </p>
            )}
          </div>
        </section>

        {/* ============ KEKELIRUAN ============ */}
        <section className="edu-seksi" id="kekeliruan">
          <div className="pembungkus">
            <div className="edu-kepala" data-muncul>
              <p className="label-seksi">Kekeliruan umum</p>
              <h2 className="judul-seksi">Yang sering dipercaya, padahal tidak sepenuhnya benar</h2>
            </div>
            <div className="edu-kekeliruan" data-muncul>
              {KEKELIRUAN.map((k) => (
                <div className="edu-keliru" key={k.anggapan}>
                  <div className="edu-keliru__sisi edu-keliru__sisi--anggapan">
                    <span className="edu-keliru__tanda">
                      <IkonEdukasi nama="silang" ukuran={16} tebal={2.6} />
                    </span>
                    <div>
                      <p className="edu-keliru__judul">Anggapan</p>
                      <p className="edu-keliru__teks">{k.anggapan}</p>
                    </div>
                  </div>
                  <div className="edu-keliru__sisi edu-keliru__sisi--nyata">
                    <span className="edu-keliru__tanda">
                      <IkonEdukasi nama="centang" ukuran={16} tebal={2.6} />
                    </span>
                    <div>
                      <p className="edu-keliru__judul">Kenyataannya</p>
                      <p className="edu-keliru__teks">{k.kenyataan}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ============ AJAKAN ============ */}
      <section className="edu-ajakan">
        <div className="pembungkus edu-ajakan__isi" data-muncul>
          <span className="edu-ajakan__ikon">
            <IkonEdukasi nama="buku" ukuran={28} tebal={1.6} />
          </span>
          <h2>Sudah paham istilahnya? Sekarang cari tahu posisi Anda.</h2>
          <p>Jawab 40 pernyataan singkat, dan TAKAR akan menyebut profil serta instrumen yang cocok, lengkap dengan laporan PDF yang bisa Anda simpan.</p>
          <Link to="/konsultasi" className="tombol tombol--navy">
            Mulai Konsultasi
            <IkonEdukasi nama="panah" ukuran={18} tebal={2} />
          </Link>
          <p className="edu-ajakan__catatan">Materi di halaman ini disusun dari basis pengetahuan seorang pakar sebagai bahan belajar. Untuk keputusan yang besar, diskusikan juga dengan perencana keuangan berizin.</p>
        </div>
      </section>
    </div>
  )
}