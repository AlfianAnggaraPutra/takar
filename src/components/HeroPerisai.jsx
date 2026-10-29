import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './HeroPerisai.css'

/*
  Gambar di sisi kanan hero Beranda: tiga perisai kaca (merah, hijau, emas) di atas panggung bercahaya.
  Tanpa bingkai dan tanpa latar, hanya gambarnya yang berdiri di atas latar halaman.

  Gambarnya dipecah menjadi empat lapisan PNG transparan berukuran sama (folder public/hero) supaya tiap perisai
  bisa bergerak sendiri-sendiri:
    panggung.png, perisai-merah.png, perisai-hijau.png, perisai-emas.png

  Gerak yang ada:
  - Masuk     : panggung muncul, intinya menyala, perisai hijau naik dari cahaya panggung, lalu merah dan emas
                keluar dari balik hijau.
  - Diam      : tiap perisai melayang pelan dengan irama sendiri, cahaya panggung berdenyut, kilau lewat
                bergantian di permukaan kaca, kerlip kecil di sudut perisai.
  - Hover     : gambar miring tipis mengikuti kursor, tiap lapisan bergeser berbeda (kesan kedalaman), perisai
                yang ditunjuk terangkat dan lebih terang, menunjuk panggung membuat cahayanya membesar.
  - Klik/ketuk: ketiga perisai melompat bergantian (yang disentuh paling tinggi) lalu memantul, cincin cahaya
                menyebar dari panggung, kilau cepat melintas.
  Semua gerak dimatikan bila perangkat meminta gerak dikurangi, dan berhenti sendiri saat gambar di luar layar.
*/
const FOLDER = '/hero/'
const LEBAR = 996
const TINGGI = 896
const ALT = 'Tiga perisai kaca berwarna merah, hijau, dan emas di atas panggung bercahaya'

// Urutan DOM menentukan tumpukan: merah dan emas di belakang, hijau di depan.
// kerlip: [kiri %, atas %, ukuran %, tunda detik]. pusat: letak tengah perisai di lebar gambar (0 sampai 1).
const PERISAI = [
  { kode: 'merah', berkas: 'perisai-merah.png', pusat: 0.2, kerlip: [[5.6, 19.8, 3.8, 1.3]] },
  { kode: 'emas', berkas: 'perisai-emas.png', pusat: 0.79, kerlip: [[95.2, 20.2, 3.8, 3.9]] },
  {
    kode: 'hijau',
    berkas: 'perisai-hijau.png',
    pusat: 0.5,
    kerlip: [
      [29.9, 11.5, 4.6, 0],
      [71.1, 11.9, 3.4, 2.7],
      [51.5, 66.2, 3.2, 5.1],
    ],
  },
]
const KODE = PERISAI.map((p) => p.kode)
const LAPISAN = [...KODE, 'panggung']

// Seberapa jauh tiap lapisan bergeser saat kursor bergerak (makin besar makin terasa dekat dengan penonton).
const KEDALAMAN = { panggung: -0.55, merah: 0.5, emas: 0.5, hijau: 1.3 }
// Irama melayang tiap perisai: jangkauan (persen tinggi gambar), periode (detik), putar (derajat).
const MELAYANG = { hijau: { naik: 1.35, periode: 4.6, putar: 0.45 }, merah: { naik: 1.2, periode: 5.2, putar: 0.55 }, emas: { naik: 1.2, periode: 4.9, putar: 0.55 } }

export default function HeroPerisai() {
  const akar = useRef(null)
  const alat = useRef(null)
  const urut = useRef(0)
  const [cincin, setCincin] = useState([])

  useLayoutEffect(() => {
    const root = akar.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('hp--statis')
      return () => root.classList.remove('hp--statis')
    }

    let batal = false
    let tampil = true
    const q = (s) => root.querySelector(s)
    const papan = q('.hp__papan')
    const aura = q('.hp__aura')
    const panggung = q('.hp__panggung')
    const panggungDalam = q('.hp__panggung .hp__angkat')
    const inti = q('.hp__inti')
    const luar = {}
    const ayun = {}
    const angkat = { panggung: panggungDalam }
    const kilatKlik = {}
    KODE.forEach((k) => {
      luar[k] = q(`.hp__perisai--${k}`)
      ayun[k] = q(`.hp__perisai--${k} .hp__ayun`)
      angkat[k] = q(`.hp__perisai--${k} .hp__angkat`)
      kilatKlik[k] = q(`.hp__perisai--${k} .hp__sapu--klik`)
    })

    const ctx = gsap.context(() => {
      // Keadaan awal sebelum gambar tampil, dipasang sebelum browser menggambar supaya tidak berkedip.
      gsap.set([aura, panggung, inti, ...KODE.map((k) => luar[k])], { autoAlpha: 0 })
      gsap.set(papan, { transformPerspective: 1100, transformOrigin: '50% 72%' })
      gsap.set(KODE.map((k) => angkat[k]), { transformOrigin: '50% 62%' })
      gsap.set(Object.values(kilatKlik), { xPercent: -100 })
    }, root)

    const baca = (e) => {
      const r = root.getBoundingClientRect()
      const fx = (e.clientX - r.left) / r.width
      const fy = (e.clientY - r.top) / r.height
      let zona = null
      if (fy >= 0.04 && fy < 0.69) zona = fx < 0.31 ? 'merah' : fx > 0.69 ? 'emas' : 'hijau'
      else if (fy >= 0.69 && fy < 0.98 && fx > 0.06 && fx < 0.94) zona = 'panggung'
      return { fx, fy, zona }
    }

    /* ---------- Gerak mengikuti kursor dan sentuhan (aktif setelah animasi masuk selesai) ---------- */
    const mulaiInteraksi = () => {
      const miring = {
        y: gsap.quickTo(papan, 'rotationY', { duration: 0.9, ease: 'power3.out' }),
        x: gsap.quickTo(papan, 'rotationX', { duration: 0.9, ease: 'power3.out' }),
      }
      const lapisan = {}
      LAPISAN.forEach((k) => {
        lapisan[k] = {
          x: gsap.quickTo(angkat[k], 'xPercent', { duration: 0.9, ease: 'power3.out' }),
          y: gsap.quickTo(angkat[k], 'yPercent', { duration: 0.9, ease: 'power3.out' }),
          s: gsap.quickTo(angkat[k], 'scale', { duration: 0.6, ease: 'power3.out' }),
        }
      })

      let zonaIni = null
      const lompat = (fx, zona) => {
        // Yang paling dekat dengan titik sentuh melompat lebih dulu dan lebih tinggi, yang lain menyusul.
        const jarak = (k) => Math.abs(PERISAI.find((p) => p.kode === k).pusat - fx)
        const urutan = [...KODE].sort((a, b) => jarak(a) - jarak(b))
        urutan.forEach((k, i) => {
          const kuat = zona === k || (zona === 'panggung' && k === 'hijau') || (zona === null && i === 0)
          gsap
            .timeline({ delay: i * 0.08 })
            .to(luar[k], { yPercent: kuat ? -6.5 : -3.6, scale: kuat ? 1.04 : 1.015, duration: 0.26, ease: 'power2.out', overwrite: 'auto' })
            .to(luar[k], { yPercent: 0, scale: 1, duration: 1.25, ease: 'elastic.out(1, 0.4)' })
        })
        gsap.fromTo(inti, { scale: 1.75, autoAlpha: 1 }, { scale: zonaIni === 'panggung' ? 1.2 : 1, duration: 1.1, ease: 'expo.out', overwrite: 'auto' })
        const kena = zona && zona !== 'panggung' ? [zona] : KODE
        kena.forEach((k, i) => gsap.fromTo(kilatKlik[k], { xPercent: -100 }, { xPercent: 170, duration: 0.95, delay: i * 0.12, ease: 'power2.inOut', overwrite: 'auto' }))
      }

      alat.current = {
        siap: true,
        pindah(e) {
          const { fx, fy, zona } = baca(e)
          const nx = Math.max(-1, Math.min(1, (fx - 0.5) * 2))
          const ny = Math.max(-1, Math.min(1, (fy - 0.5) * 2))
          miring.y(nx * 5)
          miring.x(-ny * 3.2)
          LAPISAN.forEach((k) => {
            const d = KEDALAMAN[k]
            lapisan[k].x(nx * d * 0.9)
            lapisan[k].y(ny * d * 0.6 + (zona === k ? -1.8 : 0))
            lapisan[k].s(zona === k ? 1.035 : 1)
          })
          if (zona !== zonaIni) {
            root.dataset.sorot = zona || ''
            if ((zona === 'panggung') !== (zonaIni === 'panggung')) {
              gsap.to(inti, { scale: zona === 'panggung' ? 1.2 : 1, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
            }
            zonaIni = zona
          }
        },
        keluar() {
          miring.y(0)
          miring.x(0)
          LAPISAN.forEach((k) => {
            lapisan[k].x(0)
            lapisan[k].y(0)
            lapisan[k].s(1)
          })
          if (zonaIni === 'panggung') gsap.to(inti, { scale: 1, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
          root.dataset.sorot = ''
          zonaIni = null
        },
        tekan(e) {
          const { fx, zona } = baca(e)
          ctx.add(() => lompat(fx, zona))
        },
      }
    }

    /* ---------- Melayang pelan saat diam ---------- */
    const melayang = []
    const simpan = (tween) => {
      melayang.push(tween)
      if (!tampil) tween.pause()
    }
    const mulaiMelayang = () => {
      KODE.forEach((k, i) => {
        const { naik, periode, putar } = MELAYANG[k]
        const arah = i % 2 ? -1 : 1
        // Naik dulu setengah jalan dengan halus, lalu berayun terus; irama tiap perisai berbeda dan tidak pernah serempak.
        simpan(
          gsap.to(ayun[k], {
            yPercent: -naik,
            rotation: -putar * arah,
            duration: periode / 2,
            ease: 'sine.out',
            onComplete: () => {
              if (batal) return
              ctx.add(() => simpan(gsap.to(ayun[k], { yPercent: naik, rotation: putar * arah, duration: periode, ease: 'sine.inOut', yoyo: true, repeat: -1 })))
            },
          }),
        )
      })
    }

    /* ---------- Animasi masuk, dimulai setelah gambar siap ---------- */
    const gambar = [...root.querySelectorAll('img.hp__gambar')]
    const tunggu = Promise.race([
      Promise.all(
        gambar.map((g) =>
          g.complete
            ? Promise.resolve()
            : new Promise((r) => {
                g.addEventListener('load', r, { once: true })
                g.addEventListener('error', r, { once: true })
              }),
        ),
      ),
      new Promise((r) => setTimeout(r, 3500)),
    ])
    tunggu.then(() => {
      if (batal) return
      ctx.add(() => {
        const semua = [...KODE.map((k) => luar[k]), panggung]
        gsap.set(luar.hijau, { yPercent: 16, scale: 0.9, clipPath: 'inset(100% -8% -8% -8%)' })
        gsap.set(luar.merah, { xPercent: 20, rotation: -3, scale: 0.94 })
        gsap.set(luar.emas, { xPercent: -20, rotation: 3, scale: 0.94 })
        gsap.set(panggung, { yPercent: 8, scale: 0.9, transformOrigin: '50% 75%' })
        gsap.set(inti, { scale: 0.2 })
        gsap
          .timeline({
            delay: 0.45,
            defaults: { ease: 'power3.out' },
            onComplete: () => {
              if (batal) return
              gsap.set(semua, { clearProps: 'transform,clipPath,opacity,visibility' })
              ctx.add(mulaiInteraksi)
            },
          })
          .to(aura, { autoAlpha: 1, duration: 2.2, ease: 'power2.out' }, 0)
          .to(panggung, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.2 }, 0.05)
          .to(inti, { autoAlpha: 1, scale: 1, duration: 1.3, ease: 'expo.out' }, 0.7)
          .add(() => root.classList.add('hp--siap'), 0.9)
          .to(luar.hijau, { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, 0.9)
          .to(luar.hijau, { yPercent: 0, scale: 1, duration: 1.4, ease: 'back.out(1.25)' }, 0.9)
          .to(luar.hijau, { clipPath: 'inset(-8% -8% -8% -8%)', duration: 1.1, ease: 'power2.out' }, 0.9)
          .to(luar.merah, { autoAlpha: 1, xPercent: 0, rotation: 0, scale: 1, duration: 1.2 }, 1.65)
          .to(luar.emas, { autoAlpha: 1, xPercent: 0, rotation: 0, scale: 1, duration: 1.2 }, 1.77)
          .add(() => {
            if (!batal) ctx.add(mulaiMelayang)
          }, 2.75)
      })
    })

    /* ---------- Berhenti saat gambar di luar layar ---------- */
    const pengamat = new IntersectionObserver(([m]) => {
      tampil = m.isIntersecting
      root.classList.toggle('hp--jeda', !tampil)
      melayang.forEach((t) => (tampil ? t.resume() : t.pause()))
    })
    pengamat.observe(root)

    return () => {
      batal = true
      pengamat.disconnect()
      melayang.forEach((t) => t.kill())
      melayang.length = 0
      alat.current = null
      ctx.revert()
      delete root.dataset.sorot
      root.classList.remove('hp--siap', 'hp--jeda')
    }
  }, [])

  const saatGeser = useCallback((e) => {
    if (e.pointerType === 'touch') return
    alat.current?.pindah(e)
  }, [])
  const saatKeluar = useCallback(() => alat.current?.keluar(), [])

  // Mouse bereaksi saat ditekan. Sentuhan baru bereaksi saat jari diangkat, karena jari yang menggeser layar
  // dibatalkan peramban sebelum sempat diangkat, jadi menggulir halaman lewat gambar tidak memicu lompatan.
  const beraksi = useCallback((e) => {
    if (!alat.current?.siap) return
    alat.current.tekan(e)
    setCincin((c) => [...c.slice(-2), { id: ++urut.current }])
  }, [])
  const saatTekan = useCallback(
    (e) => {
      if (e.pointerType === 'touch' || (e.pointerType === 'mouse' && e.button !== 0)) return
      beraksi(e)
    },
    [beraksi],
  )
  const saatLepas = useCallback(
    (e) => {
      if (e.pointerType === 'touch') beraksi(e)
    },
    [beraksi],
  )
  const hapusCincin = (id) => setCincin((c) => c.filter((x) => x.id !== id))

  const sembunyikanRusak = (e) => {
    e.currentTarget.style.visibility = 'hidden'
  }

  return (
    <div
      className="hp"
      ref={akar}
      role="img"
      aria-label={ALT}
      onPointerMove={saatGeser}
      onPointerLeave={saatKeluar}
      onPointerCancel={saatKeluar}
      onPointerDown={saatTekan}
      onPointerUp={saatLepas}
    >
      <div className="hp__aura" aria-hidden="true">
        <span />
      </div>
      <div className="hp__papan" aria-hidden="true">
        <div className="hp__lap hp__panggung">
          <div className="hp__angkat">
            <img className="hp__gambar" src={`${FOLDER}panggung.png`} width={LEBAR} height={TINGGI} alt="" draggable={false} decoding="async" onError={sembunyikanRusak} />
            <span className="hp__cincin hp__cincin--diam" />
            {cincin.map((c) => (
              <span key={c.id} className="hp__cincin hp__cincin--klik" onAnimationEnd={() => hapusCincin(c.id)} />
            ))}
            <span className="hp__inti">
              <span className="hp__denyut" />
            </span>
          </div>
        </div>

        {PERISAI.map((p) => (
          <div key={p.kode} className={`hp__lap hp__perisai hp__perisai--${p.kode}`}>
            <div className="hp__ayun">
              <div className="hp__angkat">
                <img className="hp__gambar" src={`${FOLDER}${p.berkas}`} width={LEBAR} height={TINGGI} alt="" draggable={false} decoding="async" onError={sembunyikanRusak} />
                <span className="hp__kilat">
                  <i className="hp__sapu hp__sapu--diam" />
                  <i className="hp__sapu hp__sapu--klik" />
                </span>
                {p.kerlip.map(([x, y, ukuran, tunda], i) => (
                  <span key={i} className="hp__kerlip" style={{ left: `${x}%`, top: `${y}%`, width: `${ukuran}%`, '--tunda': `${tunda}s` }}>
                    <i />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}