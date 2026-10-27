import { useCallback, useEffect, useRef, useState } from 'react'
import { BATAS_DIAM_MS, PERINGATAN_MS, bacaAktifTerakhir, catatAktifTerakhir } from '../lib/batasSesi'

/*
  Batas diam sesi admin.

  Selama `aktif`, aktivitas pengguna (klik, ketuk, ketik, gulir, gerak kursor) dicatat. Bila tidak ada aktivitas selama
  BATAS_DIAM_MS, `saatBerakhir` dipanggil sekali. PERINGATAN_MS sebelum itu, `sisaDetik` berisi hitung mundur supaya
  halaman bisa menampilkan peringatan. Selama peringatan tampil, hanya `perpanjang` (tombol "Tetap masuk") yang
  memperpanjang sesi, supaya gerakan kursor yang tidak disengaja tidak membatalkannya.

  Waktu dihitung dari jam perangkat (Date.now), bukan dari penghitung yang berjalan terus, sehingga tetap benar saat
  tab disembunyikan atau perangkat tidur: begitu tab aktif lagi dan batas sudah lewat, sesi langsung berakhir.
  Catatan aktivitas terakhir disimpan di sessionStorage, jadi memuat ulang halaman tidak mengulang hitungan dari nol.
*/
export default function useBatasDiam({ aktif, saatBerakhir }) {
  const [sisaDetik, setSisaDetik] = useState(null)
  const terakhir = useRef(Date.now())
  const sedangPeringatan = useRef(false)
  const sudahBerakhir = useRef(false)
  const berakhirRef = useRef(saatBerakhir)
  berakhirRef.current = saatBerakhir

  const perpanjang = useCallback(() => {
    const kini = Date.now()
    terakhir.current = kini
    catatAktifTerakhir(kini)
    sedangPeringatan.current = false
    setSisaDetik(null)
  }, [])

  useEffect(() => {
    if (!aktif) return undefined
    sudahBerakhir.current = false
    sedangPeringatan.current = false

    const kini0 = Date.now()
    const tersimpan = bacaAktifTerakhir()
    // Catatan di masa depan (jam perangkat diubah) tidak dipercaya.
    terakhir.current = tersimpan && tersimpan <= kini0 ? tersimpan : kini0
    if (!tersimpan || tersimpan > kini0) catatAktifTerakhir(kini0)

    const periksa = () => {
      if (sudahBerakhir.current) return
      const kini = Date.now()
      let lewat = kini - terakhir.current
      if (lewat < 0) {
        terakhir.current = kini
        lewat = 0
      }
      if (lewat >= BATAS_DIAM_MS) {
        sudahBerakhir.current = true
        sedangPeringatan.current = false
        setSisaDetik(null)
        berakhirRef.current?.()
        return
      }
      const sisa = BATAS_DIAM_MS - lewat
      if (sisa <= PERINGATAN_MS && document.visibilityState === 'visible') {
        sedangPeringatan.current = true
        setSisaDetik(Math.max(1, Math.ceil(sisa / 1000)))
      } else if (sedangPeringatan.current) {
        // Tab disembunyikan saat peringatan: tampilkan lagi nanti bila sesi masih berlaku.
        sedangPeringatan.current = false
        setSisaDetik(null)
      }
    }

    let terakhirTulis = 0
    const saatAktivitas = () => {
      if (sudahBerakhir.current) return
      const kini = Date.now()
      // Gerakan pertama setelah perangkat bangun tidak boleh menghapus batas yang sudah terlewat.
      if (kini - terakhir.current >= BATAS_DIAM_MS) {
        periksa()
        return
      }
      if (sedangPeringatan.current) return
      terakhir.current = kini
      if (kini - terakhirTulis > 5000) {
        terakhirTulis = kini
        catatAktifTerakhir(kini)
      }
    }

    const acara = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'mousemove']
    acara.forEach((nama) => window.addEventListener(nama, saatAktivitas, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', periksa)
    window.addEventListener('focus', periksa)
    window.addEventListener('pageshow', periksa)
    const detak = setInterval(periksa, 1000)
    periksa()

    return () => {
      acara.forEach((nama) => window.removeEventListener(nama, saatAktivitas, { capture: true }))
      document.removeEventListener('visibilitychange', periksa)
      window.removeEventListener('focus', periksa)
      window.removeEventListener('pageshow', periksa)
      clearInterval(detak)
      sedangPeringatan.current = false
      setSisaDetik(null)
    }
  }, [aktif])

  return { sisaDetik, perpanjang }
}