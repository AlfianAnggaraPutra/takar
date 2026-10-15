// Ikon garis untuk halaman Edukasi dan ringkasan instrumen di Beranda.
// Semua digambar di kotak 24 x 24, memakai warna teks di sekitarnya (currentColor).
const BENTUK = {
  // Profil
  perisai: <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" />,
  timbang: (
    <>
      <path d="M12 4v16M6 20h12M5 7h14" />
      <path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7zM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7z" />
    </>
  ),
  naik: <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />,

  // Instrumen
  deposito: (
    <>
      <path d="M3 9l9-5 9 5" />
      <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" />
    </>
  ),
  pasarUang: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.8" />
      <path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" />
      <path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" />
    </>
  ),
  emas: (
    <>
      <path d="M3 18l2.5-5h13L21 18z" />
      <path d="M8 13l1.5-4.5h5L16 13" />
    </>
  ),
  obligasi: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 16.5l5-5M10 12h.01M14 16.5h.01" />
    </>
  ),
  campuran: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5V12h8.5M12 12l-6 6" />
    </>
  ),
  sahamKelola: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2" />
      <path d="M7.5 16l3-3 2.5 2 3.5-4" />
    </>
  ),
  saham: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 15l3-4 3 2 5-6" />
    </>
  ),

  // Persiapan
  bantal: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M6 6l3.6 3.6M18 6l-3.6 3.6M6 18l3.6-3.6M18 18l-3.6-3.6" />
    </>
  ),
  rantai: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  sasaran: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  izin: (
    <>
      <path d="M12 3l2.4 1.8 3-.1.9 2.9 2.4 1.8-.9 2.8.9 2.8-2.4 1.8-.9 2.9-3-.1L12 21l-2.4-1.8-3 .1-.9-2.9-2.4-1.8.9-2.8-.9-2.8 2.4-1.8.9-2.9 3 .1L12 3z" />
      <path d="M8.8 12.3l2.2 2.2 4.2-4.6" />
    </>
  ),

  // Halaman Tentang
  pakar: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5 1.2 0 2.3.3 3.2.9" />
      <path d="M15 18.5l2.2 2.2 4-4.4" />
    </>
  ),
  formulir: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.2" />
      <path d="M9 4v-.8A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2V4" />
      <path d="M8.5 10h7M8.5 14h7M8.5 17.5h4" />
    </>
  ),
  hitung: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8.5 7.5h7" />
      <path d="M8.6 12h.01M12 12h.01M15.4 12h.01M8.6 15.5h.01M12 15.5h.01M15.4 15.5h.01" />
    </>
  ),
  koin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.6 9.4c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 1.9 0 2.6 5.2 1.2 5.2 3.8 0 1.2-1.1 2-2.6 2-1.2 0-2.2-.5-2.7-1.4" />
    </>
  ),
  jam: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  denyut: <path d="M3 12h4l2.2-6 4 12 2.4-6H21" />,
  topi: (
    <>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" />
      <path d="M6.5 11.8V16c0 1.2 2.5 2.8 5.5 2.8s5.5-1.6 5.5-2.8v-4.2" />
      <path d="M21.5 9.5V15" />
    </>
  ),
  penggeser: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),
  gembok: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.4" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.6v2.3" />
    </>
  ),
  dompet: (
    <>
      <path d="M5 8V6.8A1.8 1.8 0 0 1 6.8 5H17" />
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.5" />
      <path d="M20.5 12.2h-3.7a1.9 1.9 0 0 0 0 3.8h3.7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 7.8h.01" />
    </>
  ),
  pena: (
    <>
      <path d="M4 20l1-4.2L16.6 4.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
      <path d="M14.5 6.3l3.2 3.2" />
    </>
  ),
  orang: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6" />
    </>
  ),
  terpisah: (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M10.5 12h.01M12 12h.01M13.5 12h.01" />
    </>
  ),
  grafik: <path d="M5 20v-6M11 20V6M17 20v-9M3 20h18" />,
  mata: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  unduh: <path d="M12 4v11M7.5 10.8L12 15.3l4.5-4.5M5 20h14" />,
  daftar: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
    </>
  ),
  chevron: <path d="M6 9.5l6 6 6-6" />,
  ulang: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5L4 9" />
      <path d="M4 4.5V9h4.5" />
    </>
  ),

  // Umum
  panah: <path d="M5 12h14M13 6l6 6-6 6" />,
  tautan: <path d="M7 17L17 7M9 7h8v8" />,
  buku: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M9 8h7M9 12h5" />
    </>
  ),
  centang: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  silang: <path d="M6 6l12 12M18 6L6 18" />,
}

export default function IkonEdukasi({ nama, ukuran = 22, tebal = 1.7 }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {BENTUK[nama]}
    </svg>
  )
}