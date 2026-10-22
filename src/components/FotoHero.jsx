import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import GambarAman from './GambarAman'
import './FotoHero.css'

/*
  Foto di sisi kanan hero Beranda.

  CARA MENGGANTI FOTO
  Simpan foto Anda di folder public dengan nama hero-konsultasi.jpg (atau .jpeg, .webp, .png). Tidak ada kode yang
  perlu diubah. Bingkai selalu berukuran tetap dan fotonya dipotong otomatis supaya pas (object-fit: cover), jadi
  foto berukuran atau berorientasi apa pun tidak akan merusak tata letak. Bila bagian penting foto (misalnya wajah)
  terpotong, geser titik fokusnya lewat POSISI_FOTO di bawah, misalnya '50% 20%' berarti fokus ke bagian atas.

  Selama foto belum ada, yang tampil adalah ilustrasi cadangan di bawah, bukan kotak kosong.
*/
const SUMBER_FOTO = ['/hero-konsultasi.jpg', '/hero-konsultasi.jpeg', '/hero-konsultasi.webp', '/hero-konsultasi.png']
const POSISI_FOTO = '50% 30%'
const ALT_FOTO = 'Konsultasi bersama pakar keuangan'

// Ilustrasi cadangan: pakar menjelaskan hasil kepada klien. Dibuat sendiri untuk TAKAR, bukan tiruan karya orang lain.
function IlustrasiKonsultasi() {
  return (
    <svg className="foto-hero__ilustrasi" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustrasi pakar menjelaskan hasil profil risiko kepada klien">
      <defs>
        <linearGradient id="fhLatar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d4466" />
          <stop offset="1" stopColor="#07172a" />
        </linearGradient>
        <linearGradient id="fhGaris" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4db3c6" />
          <stop offset="1" stopColor="#f0cd82" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#fhLatar)" />
      <circle cx="330" cy="70" r="130" fill="#ecb54e" opacity="0.13" />
      <circle cx="40" cy="450" r="150" fill="#4db3c6" opacity="0.14" />
      <g fill="#f6f3ec" opacity="0.1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={30 + i * 48} cy="40" r="2.2" />
        ))}
      </g>

      <g className="fh-gelembung fh-gelembung--a">
        <rect x="34" y="70" width="168" height="110" rx="22" fill="#f6f3ec" />
        <path d="M80 178h16l-6 28z" fill="#f6f3ec" />
        <rect x="58" y="136" width="20" height="22" rx="5" fill="#4db3c6" />
        <rect x="88" y="104" width="20" height="54" rx="5" fill="#ecb54e" />
        <rect x="118" y="146" width="20" height="12" rx="5" fill="#e8836b" />
        <rect x="154" y="104" width="30" height="7" rx="3.5" fill="#0f2a43" opacity="0.28" />
        <rect x="154" y="120" width="22" height="7" rx="3.5" fill="#0f2a43" opacity="0.18" />
        <rect x="154" y="136" width="26" height="7" rx="3.5" fill="#0f2a43" opacity="0.18" />
      </g>

      <g className="fh-gelembung fh-gelembung--b">
        <rect x="218" y="126" width="150" height="92" rx="22" fill="#ecb54e" />
        <path d="M296 216h16l-4 24z" fill="#ecb54e" />
        <path d="M293 152l30 11v22c0 17-12 28-30 34-18-6-30-17-30-34v-22z" fill="#07172a" opacity="0.88" />
        <path d="M279 187l10 10 20-22" fill="none" stroke="#f0cd82" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <path d="M24 392C24 332 60 308 112 308S200 332 200 392z" fill="#1f7a8c" />
      <path d="M92 308l20 34 20-34z" fill="#f6f3ec" />
      <circle cx="112" cy="262" r="34" fill="#e8d3b0" />
      <path d="M78 258c0-24 15-38 36-38s34 14 34 34c-12-14-26-20-40-20-12 0-22 8-30 24z" fill="#0f2a43" />

      <path d="M214 392c0-48 32-72 80-72s84 24 84 72z" fill="#d9694f" />
      <circle cx="294" cy="276" r="31" fill="#e8d3b0" />
      <path d="M262 274c0-22 14-34 33-34s31 12 31 32c-10-10-22-14-32-14-12 0-24 6-32 16z" fill="#0f2a43" />

      <rect x="0" y="384" width="400" height="116" fill="#0b2236" />
      <rect x="0" y="384" width="400" height="3" fill="#ecb54e" opacity="0.6" />
      <g>
        <rect x="150" y="338" width="100" height="58" rx="9" fill="#07172a" stroke="#4db3c6" strokeWidth="2" />
        <path d="M164 380l18-14 14 8 18-20 16 9 12-12" fill="none" stroke="url(#fhGaris)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export default function FotoHero() {
  const akar = useRef(null)
  const bingkai = useRef(null)
  const ctxRef = useRef(null)
  const entranceSelesai = useRef(false)
  const urut = useRef(0)
  const [riak, setRiak] = useState([])

  /* Animasi masuk: bingkai terbuka dari bawah, fotonya mengecil perlahan dari agak besar, lalu garis emas menyusul. */
  useLayoutEffect(() => {
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (kurangGerak) {
      entranceSelesai.current = true
      return undefined
    }
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.35, defaults: { ease: 'power4.out' }, onComplete: () => (entranceSelesai.current = true) })
        .fromTo(
          '.foto-hero__bingkai',
          { clipPath: 'inset(100% 0% 0% 0% round 26px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.5, ease: 'power4.inOut', clearProps: 'clipPath' },
          0,
        )
        .from('.foto-hero__isi', { scale: 1.3, duration: 2.1, ease: 'power3.out' }, 0)
        .from('.foto-hero__garis', { autoAlpha: 0, x: -26, y: -26, duration: 1.2, ease: 'power3.out' }, 0.7)
    }, akar)
    ctxRef.current = ctx
    return () => {
      ctx.revert()
      ctxRef.current = null
    }
  }, [])

  /* Saat diklik atau disentuh: riak emas dari titik sentuhan, bingkai menekan lalu memantul, foto membesar sekilas. */
  const saatTekan = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const kotak = bingkai.current?.getBoundingClientRect()
    if (!kotak) return
    const x = e.clientX - kotak.left
    const y = e.clientY - kotak.top
    setRiak((r) => [...r.slice(-3), { id: ++urut.current, x, y }])

    const ctx = ctxRef.current
    if (!ctx || !entranceSelesai.current) return
    ctx.add(() => {
      const sisi = x / kotak.width - 0.5
      gsap
        .timeline()
        .to('.foto-hero__tekan', { scale: 0.965, rotation: sisi * 2.6, duration: 0.16, ease: 'power2.out', overwrite: 'auto' })
        .to('.foto-hero__tekan', { scale: 1, rotation: 0, duration: 1.15, ease: 'elastic.out(1, 0.38)' })
      gsap.fromTo('.foto-hero__isi', { scale: 1 }, { scale: 1.08, duration: 0.5, ease: 'power3.out', yoyo: true, repeat: 1, overwrite: 'auto' })
    })
  }, [])

  const hapusRiak = (id) => setRiak((r) => r.filter((x) => x.id !== id))

  return (
    <figure className="foto-hero" ref={akar} onPointerDown={saatTekan} style={{ '--posisi-foto': POSISI_FOTO }}>
      <div className="foto-hero__ayun">
        <div className="foto-hero__tekan">
          <span className="foto-hero__garis" aria-hidden="true" />
          <div className="foto-hero__bingkai" ref={bingkai}>
            <div className="foto-hero__isi">
              <GambarAman
                sumber={SUMBER_FOTO}
                alt={ALT_FOTO}
                cadangan={({ status }) => (status === 'gagal' ? <IlustrasiKonsultasi /> : <span className="foto-hero__memuat" aria-hidden="true" />)}
              />
            </div>
            <span className="foto-hero__selaput" aria-hidden="true" />
            {riak.map((r) => (
              <span key={r.id} className="foto-hero__riak" aria-hidden="true" style={{ left: r.x, top: r.y }} onAnimationEnd={() => hapusRiak(r.id)} />
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}