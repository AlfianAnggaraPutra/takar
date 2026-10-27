import { useCallback, useEffect, useRef, useState } from 'react'
import { BATAS_PUTUS_MS, bacaPutusSejak, catatPutusSejak, hapusPutusSejak } from '../lib/batasSesi'

/*
  Status koneksi internet untuk panel admin.

  status: 'baik' | 'putus' | 'pulih'
  - Koneksi dianggap putus saat browser melaporkan offline, atau saat permintaan ke server gagal karena jaringan
    (laporGalatJaringan). Hitungan lama putus (detikPutus) berjalan sejak saat itu.
  - Saat koneksi pulih (browser kembali online, atau permintaan berikutnya berhasil):
    * putus kurang dari BATAS_PUTUS_MS: tetap login, `saatPulih` dipanggil agar data disegarkan, status 'pulih' sebentar.
    * putus BATAS_PUTUS_MS atau lebih: `saatKadaluarsa` dipanggil, admin diminta masuk kembali.
  - Saat halaman dimuat ulang, catatan putus yang tersimpan dicek dengan aturan yang sama, jadi memuat ulang
    tidak bisa dipakai untuk menghindari batas ini.
*/
export default function useKoneksi({ aktif, saatKadaluarsa, saatPulih }) {
  const [status, setStatus] = useState('baik')
  const [detikPutus, setDetikPutus] = useState(0)
  const putusSejak = useRef(null)
  const kadaluarsaRef = useRef(saatKadaluarsa)
  const pulihRef = useRef(saatPulih)
  const jedaPulih = useRef(null)
  kadaluarsaRef.current = saatKadaluarsa
  pulihRef.current = saatPulih

  const mulaiPutus = useCallback((sejak = Date.now()) => {
    if (putusSejak.current) return
    putusSejak.current = sejak
    catatPutusSejak(sejak)
    clearTimeout(jedaPulih.current)
    setDetikPutus(Math.max(0, Math.floor((Date.now() - sejak) / 1000)))
    setStatus('putus')
  }, [])

  const selesaiPutus = useCallback(() => {
    if (!putusSejak.current) return
    const lama = Date.now() - putusSejak.current
    putusSejak.current = null
    hapusPutusSejak()
    if (lama >= BATAS_PUTUS_MS) {
      setStatus('baik')
      kadaluarsaRef.current?.()
      return
    }
    setStatus('pulih')
    pulihRef.current?.()
    clearTimeout(jedaPulih.current)
    jedaPulih.current = setTimeout(() => setStatus('baik'), 5000)
  }, [])

  useEffect(() => {
    if (!aktif) return undefined
    // Halaman dimuat ulang saat catatan putus masih ada.
    const tersimpan = bacaPutusSejak()
    if (tersimpan) {
      if (Date.now() - tersimpan >= BATAS_PUTUS_MS && navigator.onLine !== false) {
        hapusPutusSejak()
        kadaluarsaRef.current?.()
        return undefined
      }
      if (navigator.onLine === false) mulaiPutus(tersimpan)
      else hapusPutusSejak()
    } else if (navigator.onLine === false) {
      mulaiPutus()
    }

    const saatOffline = () => mulaiPutus()
    const saatOnline = () => selesaiPutus()
    window.addEventListener('offline', saatOffline)
    window.addEventListener('online', saatOnline)
    return () => {
      window.removeEventListener('offline', saatOffline)
      window.removeEventListener('online', saatOnline)
      clearTimeout(jedaPulih.current)
    }
  }, [aktif, mulaiPutus, selesaiPutus])

  // Hitung lama putus tiap detik selama status putus.
  useEffect(() => {
    if (status !== 'putus') return undefined
    const detak = setInterval(() => {
      if (putusSejak.current) setDetikPutus(Math.floor((Date.now() - putusSejak.current) / 1000))
    }, 1000)
    return () => clearInterval(detak)
  }, [status])

  const laporGalatJaringan = useCallback(() => mulaiPutus(), [mulaiPutus])
  const laporBerhasil = useCallback(() => selesaiPutus(), [selesaiPutus])

  return { status, detikPutus, laporGalatJaringan, laporBerhasil }
}