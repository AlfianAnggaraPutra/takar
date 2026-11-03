import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './LayarPembuka.css'

const HURUF_NAMA = ['T', 'A', 'K', 'A', 'R']
const FOLDER = '/logo/'

// Waktu layar pembuka bertahan setelah nama TAKAR dan tagline selesai muncul.
const DURASI_TAMPIL = 4500
// Lama dan gaya gerak logo saat mengecil dan bergeser ke kiri.
const DURASI_GESER = 1.3
const EASE_GESER = 'power2.inOut'
// Paling lama menunggu gambar siap sebelum adegan dimulai (detik). Lewat dari itu adegan jalan dengan apa yang ada.
const BATAS_TUNGGU_GAMBAR = 3.5

// Selisih tinggi antara pusat seluruh adegan (perisai dan panggung) dan pusat bingkai perisai, dalam bagian tinggi bingkai.
// Dipakai supaya adegan lengkap (bukan hanya perisai) tampak di tengah layar saat logo masih sendirian.
const GESER_PUSAT = 0.219
// Titik tempat perisai "timbul": pusat permukaan panggung, dalam persen bingkai perisai (x, y).
const TITIK_TERBIT = [50, 111]

// pusat: letak tengah perisai dalam persen bingkai (x, y). kotak: [kiri, atas, lebar, tinggi] dalam persen bingkai.
// putar: derajat putaran horizontal (seperti koin) sebelum berhenti. durasi: lama putaran (detik).
// muncul: pengali lama gerak timbul dari panggung (posisi dan ukuran), bukan lama putaran. Kurang dari 1 berarti lebih cepat.
const PERISAI = [
  { kode: 'merah', berkas: 'splash-merah.webp', pusat: [20.3, 55.4], kotak: [0.4, 13.5, 39.7, 83.8], putar: 1080, durasi: 1.1, muncul: 1, warna: '255, 95, 115' },
  { kode: 'emas', berkas: 'splash-emas.webp', pusat: [79.5, 55.1], kotak: [59.6, 13.0, 40.0, 84.3], putar: -1080, durasi: 1.1, muncul: 1, warna: '255, 205, 100' },
  { kode: 'hijau', berkas: 'splash-hijau.webp', pusat: [50.2, 50.0], kotak: [27.6, 0.7, 45.1, 98.7], putar: 1440, durasi: 1.35, muncul: 0.7, warna: '110, 245, 185' },
]
// Perisai hijau mulai timbul 0,35 detik setelah emas mulai (0,53 detik setelah merah), ketika merah dan emas masih berputar.
// Dengan begitu putaran hijau tuntas tidak lama setelah emas, dan bagian tepi merah dan emas yang tertutup hijau
// tidak lama terlihat polos.
const JEDA_HIJAU = 0.35

// Kilau: SATU pita cahaya yang melintas dari kiri ke kanan di atas seluruh logo. Tiap perisai punya lapisan kilau sendiri
// (dipotong mengikuti bentuknya), tetapi ketiganya digerakkan bersama dengan kurva dan kecepatan yang sama, sehingga kilau
// tampak berpindah mulus dari merah ke hijau lalu emas, tanpa jeda dan tanpa satu perisai pun yang lebih cepat dari yang lain.
// Pita selebar 60% bingkai dengan posisi dasar -65,9% (lihat LayarPembuka.css). xPercent awal 25 menaruh seluruh bagian terang pita
// tepat di luar tepi kiri bingkai, dan akhir 262 tepat di luar tepi kanan, jadi tidak ada waktu terbuang di luar layar
// dan tidak ada sisa pita yang tertinggal di atas perisai.
const SAPU = { awal: 25, akhir: 262, durasi: 1.2, ease: 'sine.inOut' }

// Layar pembuka (splash screen) TAKAR. Dua fase:
//
// FASE 1, "membangun": logo tampil sendirian tepat di tengah layar. Urutannya:
//   1. panggung bercahaya terbuka dan intinya menyala,
//   2. perisai merah timbul dari panggung sambil berputar horizontal cepat seperti koin, disusul perisai emas,
//   3. selagi keduanya masih berputar (0,35 detik setelah emas mulai), perisai hijau timbul dengan cara yang sama,
//   4. satu pita kilau melintas dari merah ke hijau ke emas, lalu panggung surut.
//
// FASE 2, "menyingkap": logo mengecil sedikit dan bergeser ke kiri, memberi tempat bagi nama TAKAR dan tagline.
// Susunan akhirnya sama dengan logo di header (tiga perisai tanpa panggung).
//
// Cara kerja gerak di fase 2 (dan alasan geraknya halus):
// susunan akhir (logo di kiri, tulisan di kanan) sudah dipasang sejak awal, hanya tulisannya masih transparan.
// Posisi dan ukuran awal logo (sendirian di tengah) dibuat dengan transform sebelum layar pertama kali digambar.
// Fase 2 lalu cukup menggerakkan transform itu ke posisi netral. Dengan begitu:
//   1. tidak ada perubahan tata letak di tengah gerakan, jadi tidak ada satu frame pun yang melompat,
//   2. yang bergerak hanya transform (ditangani kartu grafis), bukan ukuran dan posisi yang dihitung ulang,
//   3. React tidak merender ulang selama animasi berjalan.
export default function LayarPembuka({ onSelesai, durasiTampil = DURASI_TAMPIL }) {
  const logoRef = useRef(null)
  const lockupRef = useRef(null)
  const panggungRef = useRef(null)

  useLayoutEffect(() => {
    const logo = logoRef.current
    const panggung = panggungRef.current
    const lockup = lockupRef.current
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tunggu
    let geser
    let munculTeks
    let napas
    let batal = false
    let tahap = 'membangun'

    const selesaiNanti = (ms) => {
      clearTimeout(tunggu)
      tunggu = setTimeout(() => onSelesai?.(), ms)
    }

    // Pengguna yang meminta gerak dikurangi langsung melihat susunan akhir, dan tidak perlu menunggu lama.
    if (kurangGerak) {
      gsap.set('.lp-lap, .lp-aura, .lp-huruf, .lp-tagline', { autoAlpha: 1 })
      selesaiNanti(Math.min(durasiTampil, 2000))
      return () => {
        clearTimeout(tunggu)
        gsap.set('.lp-lap, .lp-aura, .lp-huruf, .lp-tagline', { clearProps: 'all' })
      }
    }

    // Menghitung posisi dan ukuran awal logo (sendirian di tengah layar) relatif terhadap tempat akhirnya,
    // lalu memasangnya sebagai transform. Dipanggil ulang bila tata letak berubah selagi fase 1 (misalnya
    // huruf Fraunces baru selesai dimuat atau layar diputar), supaya logo selalu tepat di tengah.
    const pasangPosisiAwal = () => {
      gsap.set(logo, { x: 0, y: 0, scale: 1 })
      const r = logo.getBoundingClientRect()
      const p = panggung.getBoundingClientRect()
      const gayaPanggung = getComputedStyle(panggung)
      const atas = parseFloat(gayaPanggung.paddingTop) || 0
      const bawah = parseFloat(gayaPanggung.paddingBottom) || 0
      const celah = parseFloat(getComputedStyle(lockup).columnGap) || 0
      // Logo yang sendirian dikelilingi satu celah kolom kosong di kanannya, jadi pusatnya bergeser setengah celah.
      const pusatX = p.left + p.width / 2 - celah / 2
      const pusatY = p.top + atas + (p.height - atas - bawah) / 2
      const contoh = document.createElement('div')
      contoh.className = 'lp-logo--besar'
      contoh.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:1px'
      panggung.appendChild(contoh)
      const tinggiBesar = contoh.getBoundingClientRect().height
      panggung.removeChild(contoh)
      const skala = r.height > 0 && tinggiBesar > 0 ? tinggiBesar / r.height : 1
      // Pusat bingkai perisai ditaruh sedikit di atas tengah layar, karena panggung menggantung di bawah bingkai itu.
      const naik = GESER_PUSAT * (tinggiBesar || r.height)
      gsap.set(logo, { x: pusatX - (r.left + r.width / 2), y: pusatY - naik - (r.top + r.height / 2), scale: skala, force3D: true })
    }

    pasangPosisiAwal()
    const saatUbahUkuran = () => {
      if (tahap === 'membangun') pasangPosisiAwal()
    }
    window.addEventListener('resize', saatUbahUkuran)
    document.fonts?.addEventListener?.('loadingdone', saatUbahUkuran)
    // Lebar susunan berubah saat huruf Fraunces selesai dimuat (tulisan yang masih transparan ikut menentukan lebar).
    // ResizeObserver berjalan setelah tata letak dan sebelum frame digambar, jadi logo dikembalikan ke tengah
    // pada frame yang sama dan tidak pernah terlihat bergeser.
    const pengamat = typeof ResizeObserver === 'function' ? new ResizeObserver(saatUbahUkuran) : null
    pengamat?.observe(lockup)

    const q = (s) => panggung.querySelector(s)
    const pentas = q('.lp-pentas')
    const inti = q('.lp-inti')
    const aura = q('.lp-aura')
    const lap = {}
    const ayun = {}
    const pendar = {}
    const sapu = {}
    const cincin = {}
    PERISAI.forEach((p) => {
      lap[p.kode] = q(`.lp-lap--${p.kode}`)
      ayun[p.kode] = q(`.lp-lap--${p.kode} .lp-ayun`)
      pendar[p.kode] = q(`.lp-lap--${p.kode} .lp-pendar`)
      sapu[p.kode] = q(`.lp-lap--${p.kode} .lp-sapu`)
      cincin[p.kode] = q(`.lp-cincin--${p.kode}`)
    })
    // Urutan kiri ke kanan sesuai letak perisai pada bingkai (merah, hijau, emas).
    const semuaSapu = [sapu.merah, sapu.hijau, sapu.emas]

    // Setelah nama dan tagline tampil: perisai melayang pelan dan kilau lewat bergantian.
    const mulaiNapas = () => {
      gsap.set('.lp-kilat', { autoAlpha: 1 })
      const jeda = gsap.timeline({ repeat: -1, repeatDelay: 2.2 })
      PERISAI.forEach((p, i) => {
        gsap.to(ayun[p.kode], { yPercent: -2.4, duration: 2.5 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 })
      })
      // Satu tween untuk ketiga lapisan kilau: nilainya selalu sama persis, jadi pita tidak pernah terpisah antar perisai.
      jeda.fromTo(semuaSapu, { xPercent: SAPU.awal }, { xPercent: SAPU.akhir, duration: SAPU.durasi, ease: SAPU.ease })
      napas = jeda
      gsap.to(aura, { opacity: 0.7, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
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
      // Selagi logo bergeser, lapisan kilau (bertopeng) disembunyikan dan lapisan perisai tidak lagi dipromosikan
      // sendiri-sendiri, supaya yang digeser hanya satu lapisan ringan. Kilau kembali saat perisai mulai melayang.
      gsap.set('.lp-kilat', { autoAlpha: 0 })
      gsap.set('.lp-lap', { willChange: 'auto' })
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

    // Keadaan awal sebelum apa pun tampil, dipasang sebelum browser menggambar supaya tidak berkedip.
    // Tulisan menunggu giliran: tersembunyi dan sedikit bergeser dari posisi akhirnya.
    const ctx = gsap.context(() => {
      gsap.set('.lp-huruf', { autoAlpha: 0, x: -24 })
      gsap.set('.lp-tagline', { autoAlpha: 0, y: 10 })
      gsap.set(pentas, { autoAlpha: 0, yPercent: 32, scale: 0.8, rotationX: 62, transformPerspective: 900, transformOrigin: '50% 100%' })
      gsap.set(inti, { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' })
      gsap.set(aura, { autoAlpha: 0 })
      // Cahaya lingkungan mulai menyala sejak awal, selagi gambar dan huruf disiapkan.
      gsap.to(aura, { autoAlpha: 1, duration: 1.1, ease: 'power2.out' })
      PERISAI.forEach((p) => {
        gsap.set(cincin[p.kode], { autoAlpha: 0, scale: 0.15, transformOrigin: '50% 50%' })
        gsap.set(pendar[p.kode], { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' })
        gsap.set(sapu[p.kode], { xPercent: SAPU.awal })
        // Perisai mulai dari titik terbit di permukaan panggung, kecil dan sudah terputar jauh.
        gsap.set(lap[p.kode], {
          autoAlpha: 0,
          transformPerspective: 760,
          transformOrigin: `${p.pusat[0]}% ${p.pusat[1]}%`,
          xPercent: TITIK_TERBIT[0] - p.pusat[0],
          yPercent: TITIK_TERBIT[1] - p.pusat[1],
          scale: 0.22,
          rotationY: p.putar,
        })
      })
    }, panggungRef)

    // Perisai timbul dari panggung sambil berputar horizontal cepat seperti koin lalu mendarat di tempatnya.
    // Selama berputar, kecerahannya mengikuti sudut (sisi samping lebih gelap) supaya terasa seperti benda padat.
    const susunAdegan = () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      const masuk = (p, t) => {
        const el = lap[p.kode]
        const cahaya = () => {
          const sudut = (gsap.getProperty(el, 'rotationY') * Math.PI) / 180
          el.style.filter = `brightness(${(0.58 + 0.42 * Math.abs(Math.cos(sudut))).toFixed(3)})`
        }
        tl.to(el, { autoAlpha: 1, duration: 0.14 * p.muncul, ease: 'none' }, t)
          .to(el, { xPercent: 0, yPercent: 0, duration: p.durasi * 0.95 * p.muncul, ease: 'power3.out' }, t)
          .to(el, { scale: 1, duration: p.durasi * 0.9 * p.muncul, ease: 'back.out(1.6)' }, t)
          .to(el, { rotationY: 0, duration: p.durasi, ease: 'power2.out', onUpdate: cahaya, onComplete: () => { el.style.filter = '' } }, t)
        // Saat hampir berhenti: pendar sewarna perisai, cincin menyebar di panggung, inti panggung menyala sesaat.
        const mendarat = t + p.durasi * 0.8
        tl.fromTo(pendar[p.kode], { autoAlpha: 0.95, scale: 0.55 }, { autoAlpha: 0, scale: 1.5, duration: 0.95, ease: 'power2.out' }, mendarat)
          .fromTo(cincin[p.kode], { autoAlpha: 0.95, scale: 0.18 }, { autoAlpha: 0, scale: 1.18, duration: 1.05, ease: 'power2.out' }, mendarat)
          .fromTo(inti, { scale: p.kode === 'hijau' ? 1.9 : 1.5 }, { scale: 1, duration: 0.9, ease: 'expo.out' }, mendarat)
        return t + p.durasi
      }

      const [merah, emas, hijau] = PERISAI
      // 1. Panggung terbuka (miring dari belakang ke tegak), cahaya lingkungan dan inti menyala.
      tl.to(pentas, { autoAlpha: 1, yPercent: 0, scale: 1, rotationX: 0, duration: 1.0 }, 0.05)
        .to(inti, { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, 0.45)
        .fromTo(cincin.hijau, { autoAlpha: 0.9, scale: 0.18 }, { autoAlpha: 0, scale: 1.18, duration: 1.1, ease: 'power2.out' }, 0.55)
      // 2. Merah timbul, emas menyusul sesudah jeda singkat.
      const mulaiEmas = 1.03
      masuk(merah, 0.85)
      masuk(emas, mulaiEmas)
      // 3. Hijau timbul tidak lama setelah emas, selagi merah dan emas masih berputar.
      const mulaiHijau = mulaiEmas + JEDA_HIJAU
      const selesaiHijau = masuk(hijau, mulaiHijau)
      // 4. Kilau penutup: satu pita melintas merah, hijau, lalu emas. Pita mulai selagi hijau menyelesaikan putaran terakhir,
      // sehingga tiba di hijau saat hijau sudah diam. Panggung mulai surut menjelang kilau habis, dan fase 2 baru dimulai
      // setelah kilau selesai sepenuhnya (fase 2 menyembunyikan lapisan kilau, jadi tidak boleh memotong kilau yang sedang jalan).
      const mulaiKilau = selesaiHijau - 0.3
      const akhirKilau = mulaiKilau + SAPU.durasi
      tl.fromTo(semuaSapu, { xPercent: SAPU.awal }, { xPercent: SAPU.akhir, duration: SAPU.durasi, ease: SAPU.ease }, mulaiKilau)
      const surut = akhirKilau - 0.4
      tl.to(inti, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, surut)
        .to(pentas, { autoAlpha: 0, yPercent: 16, scale: 0.9, duration: 0.55, ease: 'power2.in' }, surut)
        .call(mulaiFaseSingkap, null, akhirKilau)
    }

    // Adegan baru dimulai setelah gambar siap (diurai di memori) dan huruf selesai dimuat, supaya putaran pertama
    // tidak tersendat dan susunan tidak berubah ukuran di tengah adegan.
    const gambar = [...logo.querySelectorAll('img')]
    const huruf = document.fonts?.load ? [document.fonts.load('600 1em Fraunces'), document.fonts.load('500 1em Fraunces')] : []
    const siap = Promise.all([...gambar.map((g) => (g.decode ? g.decode().catch(() => {}) : Promise.resolve())), ...huruf.map((h) => h.catch(() => {}))])
    const batasWaktu = new Promise((resolve) => setTimeout(resolve, BATAS_TUNGGU_GAMBAR * 1000))
    Promise.race([siap, batasWaktu]).then(() => {
      if (batal) return
      ctx.add(susunAdegan)
    })

    return () => {
      batal = true
      window.removeEventListener('resize', saatUbahUkuran)
      document.fonts?.removeEventListener?.('loadingdone', saatUbahUkuran)
      pengamat?.disconnect()
      clearTimeout(tunggu)
      ctx.revert()
      geser?.kill()
      munculTeks?.kill()
      napas?.kill()
      gsap.killTweensOf('.lp-ayun, .lp-aura')
      // Bila komponen sempat dipasang ulang (misalnya React StrictMode saat pengembangan), mulai lagi dari nol.
      gsap.set('.lp-logo, .lp-lap, .lp-ayun, .lp-pentas, .lp-inti, .lp-aura, .lp-cincin, .lp-pendar, .lp-kilat, .lp-sapu, .lp-huruf, .lp-tagline', { clearProps: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="lp-panggung" ref={panggungRef}>
      <div className="lp-lockup" ref={lockupRef}>
        <div className="lp-logo lp-logo--kecil" ref={logoRef} role="img" aria-label="Logo TAKAR, tiga perisai berwarna merah, hijau, dan emas">
          <span className="lp-aura" aria-hidden="true" />
          <div className="lp-pentas" aria-hidden="true">
            <img src={`${FOLDER}splash-panggung.webp`} alt="" width="640" height="219" decoding="async" draggable="false" />
            {PERISAI.map((p) => (
              <span className={`lp-cincin lp-cincin--${p.kode}`} style={{ '--warna': p.warna }} key={p.kode} />
            ))}
            <span className="lp-inti">
              <span className="lp-denyut" />
            </span>
          </div>
          {PERISAI.map((p) => (
            <div className={`lp-lap lp-lap--${p.kode}`} key={p.kode} aria-hidden="true">
              <span
                className="lp-pendar"
                style={{
                  '--warna': p.warna,
                  left: `${p.kotak[0] - 10}%`,
                  top: `${p.kotak[1] - 8}%`,
                  width: `${p.kotak[2] + 20}%`,
                  height: `${p.kotak[3] + 16}%`,
                }}
              />
              <div className="lp-ayun">
                <img src={`${FOLDER}${p.berkas}`} alt="" width="800" height="497" decoding="async" draggable="false" />
                <span className="lp-kilat">
                  <i className="lp-sapu" />
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-teks">
          <h1 className="lp-nama" aria-label="TAKAR">
            {HURUF_NAMA.map((huruf, i) => (
              <span className="lp-huruf" key={i} aria-hidden="true">
                {huruf}
              </span>
            ))}
          </h1>
          <p className="lp-tagline">Tentukan Aset Bersama Pakar</p>
        </div>
      </div>
    </div>
  )
}