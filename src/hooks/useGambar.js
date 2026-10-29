import { useEffect, useState } from 'react'

// Batas waktu menunggu satu sumber gambar sebelum pindah ke sumber berikutnya.
const BATAS_WAKTU = 9000

/*
  Memuat gambar dari daftar sumber yang diurutkan, dari yang paling diutamakan.
  Sumber pertama yang berhasil dimuat dipakai. Jika semuanya gagal, status menjadi 'gagal' dan pemanggil
  menampilkan tampilan cadangan. Dengan begini halaman tidak pernah menampilkan ikon gambar rusak atau kotak kosong.

  Hanya gambar yang benar-benar sudah selesai dimuat yang dipasang ke halaman, sehingga munculnya mulus (tanpa
  gambar yang terpotong separuh jalan).

  - sumber   : daftar alamat gambar, misalnya ['/logo-lembaga/unair.svg', '/logo-lembaga/unair.png']
  - mulai    : false menunda pemuatan (dipakai untuk bagian halaman yang masih jauh di bawah)
  - minimum  : sisi terpendek (piksel) yang dianggap gambar sungguhan. Gambar yang lebih kecil, misalnya piksel
               pelacak 1x1 milik situs lain, dianggap gagal.
*/
export default function useGambar(sumber, { mulai = true, minimum = 0 } = {}) {
  const kunci = (sumber || []).filter(Boolean).join('\n')
  const [hasil, setHasil] = useState({ kunci: '', status: 'memuat', src: '', indeks: -1 })

  useEffect(() => {
    if (!mulai) return undefined
    const daftar = kunci ? kunci.split('\n') : []
    if (!daftar.length) {
      setHasil({ kunci, status: 'gagal', src: '', indeks: -1 })
      return undefined
    }

    let batal = false
    let pewaktu = 0
    let probe = null

    const bersihkan = () => {
      clearTimeout(pewaktu)
      if (probe) {
        probe.onload = null
        probe.onerror = null
      }
    }

    const coba = (i) => {
      if (batal) return
      if (i >= daftar.length) {
        setHasil({ kunci, status: 'gagal', src: '', indeks: -1 })
        return
      }
      const gambar = new Image()
      probe = gambar
      // Tanpa kiriman alamat asal, supaya situs berita yang membatasi penayangan dari situs lain tetap mau melayani.
      gambar.referrerPolicy = 'no-referrer'
      gambar.decoding = 'async'
      const lanjut = () => {
        bersihkan()
        coba(i + 1)
      }
      gambar.onload = () => {
        clearTimeout(pewaktu)
        if (batal) return
        const sisi = Math.min(gambar.naturalWidth || Infinity, gambar.naturalHeight || Infinity)
        // Gambar SVG tanpa ukuran bawaan melaporkan 0, jadi hanya yang jelas kecil yang ditolak.
        if (minimum && Number.isFinite(sisi) && sisi < minimum) {
          lanjut()
          return
        }
        setHasil({ kunci, status: 'siap', src: daftar[i], indeks: i })
      }
      gambar.onerror = lanjut
      pewaktu = setTimeout(() => {
        gambar.src = ''
        lanjut()
      }, BATAS_WAKTU)
      gambar.src = daftar[i]
    }

    coba(0)
    return () => {
      batal = true
      bersihkan()
    }
  }, [kunci, mulai, minimum])

  // Daftar sumber yang berganti membuat hasil lama tidak berlaku lagi.
  if (hasil.kunci !== kunci) return { status: 'memuat', src: '', indeks: -1 }
  return hasil
}