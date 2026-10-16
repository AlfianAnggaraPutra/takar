// Ikon garis untuk halaman Pasar. Digambar di kotak 24 x 24 dan memakai warna teks di sekitarnya (currentColor).
const BENTUK = {
  layarPenuh: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  keluarPenuh: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  luar: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  perbesar: <path d="M12 5v14M5 12h14" />,
  perkecil: <path d="M5 12h14" />,
  ulang: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5L4 9" />
      <path d="M4 4.5V9h4.5" />
    </>
  ),
  tabel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M3.5 15h17M9.5 10v9.5" />
    </>
  ),
  grafik: <path d="M4 19V5M4 19h16M7.5 14.5l3.5-4 3 2.5 4.5-6" />,
  kiri: <path d="M14.5 6l-6 6 6 6" />,
  kanan: <path d="M9.5 6l6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  jam: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  lilin: (
    <>
      <path d="M7 4v3M7 14v4M17 6v2M17 17v3" />
      <rect x="5" y="7" width="4" height="7" rx="1" />
      <rect x="15" y="8" width="4" height="9" rx="1" />
    </>
  ),
  rentang: (
    <>
      <path d="M3 17l4-5 3 3 4-7 3 4 4-6" />
      <path d="M3 21h18" />
    </>
  ),
  batang: <path d="M5 20v-6M10 20V8M15 20v-9M20 20V5" />,
  tunda: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l-2.5 2.5M9 3h6" />
    </>
  ),
  naik: <path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" />,
  turun: <path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" />,
  koin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.7 0-2.8.9-2.8 2.1 0 3 5.6 1.4 5.6 4.1 0 1.2-1.2 2-2.8 2-1.3 0-2.4-.5-3-1.4M12 6.5V8m0 8v1.5" />
    </>
  ),
  panah: <path d="M5 12h14M13 6l6 6-6 6" />,
}

export default function IkonPasar({ nama, ukuran = 20, tebal = 1.8 }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {BENTUK[nama]}
    </svg>
  )
}