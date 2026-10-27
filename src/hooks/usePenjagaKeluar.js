import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/*
  Penjaga keluar halaman.

  Selama `aktif` bernilai true, dua cara pengguna meninggalkan halaman dicegat dan diserahkan ke `saatMinta`
  supaya halaman bisa menampilkan pop up konfirmasi:
  1. klik tautan ke halaman lain (menu header, logo, tautan footer);
  2. tombol kembali di browser atau ponsel.
  Menutup tab atau memuat ulang tidak dicegat, karena isian tersimpan sementara di sesi tab ini.

  saatMinta({ jenis: 'pergi', tujuan }) atau saatMinta({ jenis: 'kembali' }).
  Hook mengembalikan dua fungsi untuk dipanggil dari tombol di pop up:
  - lanjutPergi(permintaan): benar-benar pergi sesuai permintaan tadi.
  - batalPergi(permintaan): tetap di halaman. Untuk 'kembali', entri penjaga dipasang lagi supaya tombol kembali
    berikutnya kembali memunculkan pop up.
*/
export default function usePenjagaKeluar({ aktif, saatMinta }) {
  const navigate = useNavigate()
  const bolehKeluar = useRef(false)
  const mintaRef = useRef(saatMinta)
  mintaRef.current = saatMinta
  const pasangRef = useRef(() => {})

  // 1. Klik tautan ke halaman lain.
  useEffect(() => {
    if (!aktif) return
    const saatKlik = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const tautan = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!tautan || tautan.target === '_blank' || tautan.hasAttribute('download')) return
      const url = new URL(tautan.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      mintaRef.current?.({ jenis: 'pergi', tujuan: `${url.pathname}${url.search}${url.hash}` })
    }
    document.addEventListener('click', saatKlik, true)
    return () => document.removeEventListener('click', saatKlik, true)
  }, [aktif])

  // 2. Tombol kembali. Satu entri riwayat penjaga disisipkan supaya tombol kembali pertama hanya
  //    memunculkan pop up, bukan langsung membawa pengguna pergi.
  useEffect(() => {
    if (!aktif) return
    const pasangPenjaga = () => {
      const keadaan = window.history.state ?? {}
      window.history.pushState({ ...keadaan, idx: (keadaan.idx ?? 0) + 1, takarJaga: true }, '')
    }
    pasangRef.current = pasangPenjaga
    if (!window.history.state?.takarJaga) pasangPenjaga()
    const saatKembali = () => {
      if (bolehKeluar.current || window.history.state?.takarJaga) return
      mintaRef.current?.({ jenis: 'kembali' })
    }
    window.addEventListener('popstate', saatKembali)
    return () => {
      window.removeEventListener('popstate', saatKembali)
      pasangRef.current = () => {}
    }
  }, [aktif])

  const lanjutPergi = useCallback(
    (permintaan) => {
      if (!permintaan) return
      bolehKeluar.current = true
      if (permintaan.jenis === 'kembali') {
        window.history.back()
        // Bila tidak ada halaman sebelumnya, pengguna tetap di sini dan penjaga harus berfungsi lagi.
        window.setTimeout(() => {
          bolehKeluar.current = false
        }, 1000)
      } else {
        navigate(permintaan.tujuan)
      }
    },
    [navigate],
  )

  const batalPergi = useCallback((permintaan) => {
    if (permintaan?.jenis === 'kembali') pasangRef.current()
    // Di ponsel, tautan yang diketuk bisa berasal dari menu laci. Setelah pengguna memilih tetap di halaman,
    // laci ikut ditutup supaya isi halaman tidak tertutup. Diberi jeda agar pop up sudah tertutup sempurna lebih dulu
    // (keduanya sama-sama mengunci gulir halaman).
    window.setTimeout(() => window.dispatchEvent(new Event('takar:tutup-menu')), 80)
  }, [])

  return { lanjutPergi, batalPergi }
}