import { useEffect, useRef } from 'react'
import useGambar from '../hooks/useGambar'
import './GambarAman.css'

/*
  Gambar dengan daftar sumber berurutan dan tampilan cadangan.

  - sumber     : daftar alamat gambar, dari yang paling diutamakan
  - cadangan   : yang ditampilkan selama gambar belum siap dan bila semua sumber gagal. Boleh berupa elemen,
                 atau fungsi yang menerima ({ status }) dengan status 'memuat' atau 'gagal'.
  - saatStatus : dipanggil dengan ({ status, indeks }) setiap kali status berubah (tidak wajib). Indeks adalah
                 urutan sumber yang akhirnya terpakai, misalnya untuk menampilkan keterangan hak cipta.
*/
export default function GambarAman({ sumber, alt = '', mulai = true, minimum = 0, className = '', cadangan = null, saatStatus, ...sisa }) {
  const hasil = useGambar(sumber, { mulai, minimum })

  const panggil = useRef(saatStatus)
  panggil.current = saatStatus
  useEffect(() => {
    panggil.current?.({ status: hasil.status, indeks: hasil.indeks })
  }, [hasil.status, hasil.indeks])

  if (hasil.status === 'siap') {
    return <img className={`gambar-aman ${className}`} src={hasil.src} alt={alt} referrerPolicy="no-referrer" decoding="async" draggable={false} {...sisa} />
  }
  return typeof cadangan === 'function' ? cadangan({ status: hasil.status }) : cadangan
}