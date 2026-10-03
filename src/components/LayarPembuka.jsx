import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import LogoTimbangan from './LogoTimbangan'
import './LayarPembuka.css'

gsap.registerPlugin(Flip)

const HURUF_AKAR = ['A', 'K', 'A', 'R']

// Layar pembuka (splash screen) TAKAR — dua fase:
//
// FASE 1 — "membangun": hanya ikon timbangan yang di-render, sendirian dan
// benar-benar center di layar (tidak ada elemen lain yang ikut memakan ruang
// tata letak). GSAP menyusun bagian-bagiannya dari bawah ke atas lalu
// membiarkan kedua piringan berayun mencari keseimbangan.
//
// FASE 2 — "menyingkap": begitu fase 1 selesai, kita AMBIL POTRET posisi
// ikon saat itu (Flip.getState), baru mengecilkan ikon & memunculkan huruf
// "AKAR" + tagline di render berikutnya. Karena baris (ikon+teks)
// otomatis mengambil posisi tengah yang baru, ikon akan "melompat" begitu
// saja kalau tidak dianimasikan — makanya Flip dipakai untuk menghaluskan
// perpindahan dari posisi/​ukuran lama ke posisi/ukuran baru itu. Ini jauh
// lebih aman daripada menghitung sendiri berapa piksel ikon harus digeser.
//
// Titik putar balok & kedua piringan di dalam SVG sudah dibuat jadi (0,0)
// lokal (lihat logoTimbanganMarkup.js), jadi rotasinya di sini cukup pakai
// svgOrigin: '0 0' — aman di skala berapa pun, tidak lagi rawan meleset
// seperti versi sebelumnya yang memakai transform-origin berupa koordinat
// piksel literal.
export default function LayarPembuka({ onSelesai, durasiTampil = 4500 }) {
  const svgRef = useRef(null)
  const barisRef = useRef(null)
  const kontainerRef = useRef(null)
  const [fase, setFase] = useState('membangun') // 'membangun' | 'menyingkap'
  const [siapDilewati, setSiapDilewati] = useState(false)

  // FASE 1 — bangun & seimbangkan timbangan, sendirian di tengah layar
  useEffect(() => {
    const hormatiGerakBerkurang = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (hormatiGerakBerkurang) {
      gsap.set(svgRef.current, { autoAlpha: 1 })
      setFase('menyingkap')
      requestAnimationFrame(() => {
        gsap.set('.lp-huruf, .lp-tagline', { autoAlpha: 1 })
        setSiapDilewati(true)
        setTimeout(() => onSelesai?.(), durasiTampil)
      })
      return
    }

    // ctx.revert() (di cleanup paling bawah) hanya membereskan animasi yang
    // dibuat SEKARANG JUGA di dalam gsap.context() ini — yaitu timeline
    // tahap-bangun. Flip, timeline pemunculan teks, dan animasi napas semua
    // dibuat BELAKANGAN lewat callback async (mulaiFaseSingkap,
    // tampilkanTeks, mulaiNapas), di luar jangkauan ctx. Kalau tidak dilacak
    // & dibersihkan manual di sini, transform yang sudah ditempelkan GSAP
    // (posisi akhir yang sengaja bergeser kiri) akan nempel terus kalau
    // komponen ini sempat di-remount (mis. React StrictMode di development
    // menjalankan efek dua kali) — akibatnya fase "sendirian" berikutnya
    // jadi tidak center, membawa sisa posisi dari siklus sebelumnya.
    let rafId, flipAnim, tlReveal, napasAnim

    // Jaring pengaman: Flip menyimpan data internal per elemen, jadi kalau
    // komponen ini sempat mount ulang (mis. React StrictMode) sementara
    // elemen svgRef sama masih membawa data Flip lama, bisa bentrok.
    Flip.killFlipsOf(svgRef.current)

    const ctx = gsap.context((self) => {
      const $ = self.selector
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => mulaiFaseSingkap(),
      })

      gsap.set(svgRef.current, { autoAlpha: 1 })

      tl.from($('.t-plinth-bawah, .t-plinth-tengah, .t-plinth-atas'), {
        scaleX: 0,
        transformOrigin: '50% 100%',
        duration: 0.4,
        stagger: 0.06,
      })
        .from($('.t-batang'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5 }, '<0.1')
        .from(
          $('.t-hiasan'),
          { scale: 0, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.03 },
          '<0.1'
        )
        .from($('.t-lengan'), { scaleX: 0, transformOrigin: '50% 50%', duration: 0.45 }, '<0.2')
        .from(
          $('.t-ujung-kiri, .t-ujung-kanan, .t-cincin-gantung'),
          { scale: 0, duration: 0.3, stagger: 0.05 },
          '<0.1'
        )
        .from($('.t-isi'), { autoAlpha: 0, y: -30, duration: 0.35, stagger: 0.08 }, '<0.1')
        // Timbangan bergoyang: berat ke kanan, lalu ke kiri, makin lama makin
        // kecil ayunannya, baru diam seimbang di tengah — persis pola
        // animasi versi paling pertama (lima langkah eksplisit, bukan
        // mengandalkan overshoot dari easing elastic). Yang berputar adalah
        // SELURUH balok (lengan + kedua piringan sekaligus, sebagai satu
        // benda kaku), rotasi positif = kanan turun (berat kanan), rotasi
        // negatif = kiri turun (berat kiri).
        //
        // svgOrigin diisi koordinat ASLI titik poros sebagaimana ditulis di
        // markup SVG (750, -1300) — BUKAN "0 0". svgOrigin GSAP selalu
        // mengacu ke sistem koordinat SVG yang sesungguhnya/global, sama
        // seperti angka yang dipakai saat menggambar elemennya, bukan ke
        // koordinat lokal setelah transform="translate(...)" milik grup itu
        // sendiri. Menulis '0 0' di sini berarti "titik (0,0) di seluruh
        // kanvas SVG" (jauh dari poros aslinya), bukan "pusat grup ini" —
        // itu yang kemarin bikin balok terlempar jauh dari kolom saat
        // diputar. Lima tween ini sengaja dirantai berurutan (tanpa
        // parameter posisi) supaya urutannya pasti: kanan -> kiri -> kanan
        // (kecil) -> kiri (kecil) -> diam.
        .to('.t-balok', { rotation: 16, svgOrigin: '750 -1300', duration: 0.45, ease: 'power2.out' }, '<0.1')
        .to('.t-balok', { rotation: -11, duration: 0.4, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: 6, duration: 0.35, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: -2.5, duration: 0.3, ease: 'power2.inOut' })
        .to('.t-balok', { rotation: 0, duration: 0.3, ease: 'power2.out' })
        .from(
          $('.t-pivot, .t-cincin'),
          { scale: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2)' }
        )
        .fromTo(
          $('.t-kilau'),
          { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' },
          { autoAlpha: 1, scale: 1, duration: 0.3 },
          '<0.2'
        )
        .to($('.t-kilau'), { autoAlpha: 0, duration: 0.4 }, '>')
    }, kontainerRef)

    function mulaiFaseSingkap() {
      // Ambil potret posisi & ukuran ikon SEBELUM DOM berubah.
      const state = Flip.getState(svgRef.current)
      setFase('menyingkap')
      // requestAnimationFrame supaya React sempat re-render dulu (menambah
      // huruf/tagline ke DOM, membesarkan ikon) sebelum kita ukur &
      // animasikan apa pun. Begitu ter-render, LANGSUNG sembunyikan huruf
      // dan tagline (autoAlpha 0) — supaya selama Flip berjalan (1.3 detik)
      // keduanya tetap tak terlihat, dan baru dimunculkan nanti lewat
      // tampilkanTeks(), setelah zoom-out selesai.
      rafId = requestAnimationFrame(() => {
        gsap.set('.lp-huruf', { autoAlpha: 0, x: -24 })
        gsap.set('.lp-tagline', { autoAlpha: 0, y: 10 })
        flipAnim = Flip.from(state, {
          duration: 1.3,
          ease: 'power4.inOut',
          scale: true,
          onComplete: tampilkanTeks,
        })
      })
    }

    function tampilkanTeks() {
      tlReveal = gsap.timeline({ onComplete: mulaiNapas })
      tlReveal
        .to('.lp-huruf', { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12 })
        .to('.lp-tagline', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.2')
        .call(() => {
          setSiapDilewati(true)
          setTimeout(() => onSelesai?.(), durasiTampil)
        })
    }

    function mulaiNapas() {
      napasAnim = gsap.to('.t-balok', {
        rotation: 1.2,
        svgOrigin: '750 -1300',
        duration: 3.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    }

    return () => {
      ctx.revert()
      if (rafId) cancelAnimationFrame(rafId)
      flipAnim?.kill()
      tlReveal?.kill()
      napasAnim?.kill()
      // Jaring pengaman terakhir: hapus SEMUA sisa inline style yang mungkin
      // ditempel GSAP/Flip di elemen-elemen ini, supaya kalau komponen ini
      // sempat mount ulang, fase "sendirian" berikutnya benar-benar mulai
      // dari nol — tidak membawa posisi/skala dari siklus sebelumnya.
      gsap.set('.lp-baris, .lp-logo, .t-balok, .lp-huruf, .lp-tagline', {
        clearProps: 'all',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="lp-panggung" ref={kontainerRef}>
      <div className="lp-lockup" ref={barisRef}>
        <LogoTimbangan
          ref={svgRef}
          className={`lp-logo ${fase === 'menyingkap' ? 'lp-logo--kecil' : 'lp-logo--besar'}`}
        />
        {fase === 'menyingkap' && (
          <>
            <h1 className="lp-akar" aria-label="AKAR">
              {HURUF_AKAR.map((huruf, i) => (
                <span className="lp-huruf" key={i} aria-hidden="true">
                  {huruf}
                </span>
              ))}
            </h1>
            <p className="lp-tagline">Tentukan Aset Bersama Pakar</p>
          </>
        )}
      </div>
      {siapDilewati && (
        <button className="lp-lewati" onClick={() => onSelesai?.()}>
          Lewati
        </button>
      )}
    </div>
  )
}