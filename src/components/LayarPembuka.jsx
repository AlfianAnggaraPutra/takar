import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import LogoTimbangan from './LogoTimbangan'
import './LayarPembuka.css'

const HURUF_AKAR = ['A', 'K', 'A', 'R']

// Waktu layar pembuka bertahan setelah tulisan AKAR dan tagline selesai muncul.
const DURASI_TAMPIL = 4500
// Lama dan gaya gerak ikon saat mengecil dan bergeser ke kiri.
const DURASI_GESER = 1.3
const EASE_GESER = 'power2.inOut'

// Layar pembuka (splash screen) TAKAR, dua fase:
//
// FASE 1, "membangun": ikon timbangan tampil sendirian tepat di tengah layar. GSAP menyusun bagian-bagiannya
// dari bawah ke atas lalu membiarkan kedua piringan berayun sampai seimbang.
//
// FASE 2, "menyingkap": ikon mengecil sedikit dan bergeser ke kiri, memberi tempat bagi tulisan AKAR dan tagline.
//
// Cara kerja gerak di fase 2 (dan alasan versi ini jauh lebih halus daripada sebelumnya):
// susunan akhir (ikon di kiri, AKAR dan tagline di kanan) sudah dipasang sejak awal, hanya tulisannya masih
// transparan. Posisi dan ukuran awal ikon (sendirian di tengah) dibuat dengan transform sebelum layar pertama kali
// digambar. Fase 2 lalu cukup menggerakkan transform itu ke posisi netral. Dengan begitu:
//   1. tidak ada perubahan tata letak di tengah gerakan, jadi tidak ada satu frame pun yang melompat,
//   2. yang bergerak hanya transform (ditangani kartu grafis), bukan ukuran dan posisi yang dihitung ulang,
//   3. React tidak merender ulang selama animasi berjalan.
export default function LayarPembuka({ onSelesai, durasiTampil = DURASI_TAMPIL }) {
  const svgRef = useRef(null)
  const lockupRef = useRef(null)
  const panggungRef = useRef(null)

  useLayoutEffect(() => {
    const logo = svgRef.current
    const panggung = panggungRef.current
    const lockup = lockupRef.current
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tunggu
    let geser
    let munculTeks
    let napas
    let tahap = 'membangun'

    const selesaiNanti = (ms) => {
      clearTimeout(tunggu)
      tunggu = setTimeout(() => onSelesai?.(), ms)
    }

    // Pengguna yang meminta gerak dikurangi langsung melihat susunan akhir, dan tidak perlu menunggu lama.
    if (kurangGerak) {
      gsap.set(logo, { autoAlpha: 1 })
      gsap.set('.lp-huruf, .lp-tagline', { autoAlpha: 1 })
      selesaiNanti(Math.min(durasiTampil, 2000))
      return () => clearTimeout(tunggu)
    }

    // Menghitung posisi dan ukuran awal ikon (sendirian di tengah layar) relatif terhadap tempat akhirnya,
    // lalu memasangnya sebagai transform. Dipanggil ulang bila tata letak berubah selagi fase 1 (misalnya
    // huruf Fraunces baru selesai dimuat atau layar diputar), supaya ikon selalu tepat di tengah.
    const pasangPosisiAwal = () => {
      gsap.set(logo, { x: 0, y: 0, scale: 1 })
      const r = logo.getBoundingClientRect()
      const p = panggung.getBoundingClientRect()
      const gayaPanggung = getComputedStyle(panggung)
      const atas = parseFloat(gayaPanggung.paddingTop) || 0
      const bawah = parseFloat(gayaPanggung.paddingBottom) || 0
      const celah = parseFloat(getComputedStyle(lockup).columnGap) || 0
      // Ikon yang sendirian dikelilingi satu celah kolom kosong di kanannya, jadi pusatnya bergeser setengah celah.
      const pusatX = p.left + p.width / 2 - celah / 2
      const pusatY = p.top + atas + (p.height - atas - bawah) / 2
      const contoh = document.createElement('div')
      contoh.className = 'lp-logo--besar'
      contoh.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:1px'
      panggung.appendChild(contoh)
      const tinggiBesar = contoh.getBoundingClientRect().height
      panggung.removeChild(contoh)
      const skala = r.height > 0 && tinggiBesar > 0 ? tinggiBesar / r.height : 1
      gsap.set(logo, { x: pusatX - (r.left + r.width / 2), y: pusatY - (r.top + r.height / 2), scale: skala, force3D: true })
    }

    pasangPosisiAwal()
    const saatUbahUkuran = () => {
      if (tahap === 'membangun') pasangPosisiAwal()
    }
    window.addEventListener('resize', saatUbahUkuran)
    document.fonts?.addEventListener?.('loadingdone', saatUbahUkuran)

    const mulaiNapas = () => {
      napas = gsap.to('.t-balok', { rotation: 1.2, svgOrigin: '750 -1300', duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    }

    const tampilkanTeks = () => {
      munculTeks = gsap.timeline({ onComplete: mulaiNapas })
      munculTeks
        .to('.lp-huruf', { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12 })
        .to('.lp-tagline', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.2')
        .call(() => selesaiNanti(durasiTampil))
    }

    const mulaiFaseSingkap = () => {
      tahap = 'menyingkap'
      pasangPosisiAwal()
      geser = gsap.to(logo, {
        x: 0,
        y: 0,
        scale: 1,
        duration: DURASI_GESER,
        ease: EASE_GESER,
        force3D: true,
        onComplete: tampilkanTeks,
      })
    }

    // Tulisan menunggu giliran: tersembunyi dan sedikit bergeser dari posisi akhirnya.
    gsap.set('.lp-huruf', { autoAlpha: 0, x: -24 })
    gsap.set('.lp-tagline', { autoAlpha: 0, y: 10 })

    // Hanya animasi fase 1 yang dibuat di dalam context ini. Gerak fase 2 dilacak dan dibersihkan secara manual di bawah.
    const ctx = gsap.context((self) => {
      const $ = self.selector
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: mulaiFaseSingkap,
      })

      gsap.set(logo, { autoAlpha: 1 })

      tl.from($('.t-plinth-bawah, .t-plinth-tengah, .t-plinth-atas'), {
        scaleX: 0,
        transformOrigin: '50% 100%',
        duration: 0.4,
        stagger: 0.06,
      })
        .from($('.t-batang'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5 }, '<0.1')
        .from($('.t-hiasan'), { scale: 0, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.03 }, '<0.1')
        .from($('.t-lengan'), { scaleX: 0, transformOrigin: '50% 50%', duration: 0.45 }, '<0.2')
        .from($('.t-ujung-kiri, .t-ujung-kanan, .t-cincin-gantung'), { scale: 0, duration: 0.3, stagger: 0.05 }, '<0.1')
        .from($('.t-isi'), { autoAlpha: 0, y: -30, duration: 0.35, stagger: 0.08 }, '<0.1')
        // Timbangan bergoyang: berat ke kanan, lalu ke kiri, makin kecil ayunannya, baru diam seimbang.
        // Yang berputar seluruh balok (lengan dan kedua piringan sebagai satu benda kaku). Rotasi positif berarti
        // sisi kanan turun. svgOrigin memakai koordinat asli titik poros di markup SVG (750, -1300).
        .to('.t-balok', { rotation: 16, svgOrigin: '750 -1300', duration: 0.45, ease: 'power2.out' }, '<0.1')
        .to('.t-balok', { rotation: -11, duration: 0.4, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: 6, duration: 0.35, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: -2.5, duration: 0.3, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: 0, duration: 0.3, ease: 'power2.out' })
        .from($('.t-pivot, .t-cincin'), { scale: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2)' })
        .fromTo($('.t-kilau'), { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3 }, '<0.2')
        .to($('.t-kilau'), { autoAlpha: 0, duration: 0.4 }, '>')
    }, panggungRef)

    return () => {
      window.removeEventListener('resize', saatUbahUkuran)
      document.fonts?.removeEventListener?.('loadingdone', saatUbahUkuran)
      clearTimeout(tunggu)
      ctx.revert()
      geser?.kill()
      munculTeks?.kill()
      napas?.kill()
      // Bila komponen sempat dipasang ulang (misalnya React StrictMode saat pengembangan), mulai lagi dari nol.
      gsap.set('.lp-logo, .t-balok, .lp-huruf, .lp-tagline', { clearProps: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="lp-panggung" ref={panggungRef}>
      <div className="lp-lockup" ref={lockupRef}>
        <LogoTimbangan ref={svgRef} className="lp-logo lp-logo--kecil" />
        <h1 className="lp-akar" aria-label="AKAR">
          {HURUF_AKAR.map((huruf, i) => (
            <span className="lp-huruf" key={i} aria-hidden="true">
              {huruf}
            </span>
          ))}
        </h1>
        <p className="lp-tagline">Tentukan Aset Bersama Pakar</p>
      </div>
    </div>
  )
}