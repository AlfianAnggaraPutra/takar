import './IlustrasiBerita.css'

/*
  Ilustrasi cadangan untuk kartu berita. Tampil hanya bila foto berita tidak bisa dimuat, supaya kartu tidak pernah
  kosong. Warna aksennya mengikuti warna kategori kartu (lewat currentColor). Semuanya gambar buatan sendiri.
*/
const ADEGAN = {
  saham: (
    <>
      <g className="ib-garis-tipis">
        {[40, 90, 140].map((y) => (
          <line key={y} x1="0" x2="390" y1={y} y2={y} />
        ))}
      </g>
      {[
        [34, 112, 140, 70, 1],
        [68, 100, 138, 76, 1],
        [102, 84, 128, 60, 0],
        [136, 92, 150, 78, 1],
        [170, 70, 124, 54, 1],
        [204, 80, 120, 66, 0],
        [238, 56, 110, 44, 1],
        [272, 64, 118, 52, 0],
        [306, 40, 98, 30, 1],
        [340, 46, 92, 36, 1],
      ].map(([x, atas, bawah, ujungBawah, naik], i) => (
        <g key={x} className="ib-tumbuh" style={{ '--i': i }}>
          <line x1={x + 7} x2={x + 7} y1={atas - 12} y2={ujungBawah + 36} stroke={naik ? '#4db3c6' : '#e8836b'} strokeWidth="2" />
          <rect x={x} y={atas} width="14" height={bawah - atas} rx="3" fill={naik ? '#4db3c6' : '#e8836b'} opacity="0.92" />
        </g>
      ))}
      <path d="M20 150C70 138 100 126 140 118S210 98 250 88 320 62 372 44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" opacity="0.9" />
    </>
  ),
  emas: (
    <>
      <ellipse cx="195" cy="174" rx="150" ry="14" fill="#000" opacity="0.28" />
      <g className="ib-tumbuh" style={{ '--i': 0 }}>
        <path d="M70 168l18-44h100l18 44z" fill="url(#ibEmas)" />
        <path d="M90 124h96l4 8H86z" fill="#fff" opacity="0.28" />
      </g>
      <g className="ib-tumbuh" style={{ '--i': 1 }}>
        <path d="M202 168l18-44h100l18 44z" fill="url(#ibEmas)" />
        <path d="M222 124h96l4 8h-104z" fill="#fff" opacity="0.28" />
      </g>
      <g className="ib-tumbuh" style={{ '--i': 2 }}>
        <path d="M136 122l18-44h100l18 44z" fill="url(#ibEmas)" />
        <path d="M156 78h96l4 8H152z" fill="#fff" opacity="0.3" />
      </g>
      <g className="ib-kilau">
        <path d="M312 52l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#f0cd82" />
        <path d="M70 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f0cd82" opacity="0.8" />
      </g>
      <defs>
        <linearGradient id="ibEmas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0cd82" />
          <stop offset="1" stopColor="#d9962b" />
        </linearGradient>
      </defs>
    </>
  ),
  reksa: (
    <>
      <g transform="translate(120 100)">
        <circle r="58" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="26" />
        <circle r="58" fill="none" stroke="#4db3c6" strokeWidth="26" strokeDasharray="150 400" transform="rotate(-90)" />
        <circle r="58" fill="none" stroke="#ecb54e" strokeWidth="26" strokeDasharray="130 400" strokeDashoffset="-150" transform="rotate(-90)" />
        <circle r="58" fill="none" stroke="#e8836b" strokeWidth="26" strokeDasharray="84 400" strokeDashoffset="-280" transform="rotate(-90)" />
        <circle r="30" fill="#0a1f33" />
        <path d="M-10 6l7-9 6 5 9-11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[
        [236, 40, 80],
        [270, 70, 50],
        [304, 48, 72],
        [338, 90, 30],
      ].map(([x, y, t], i) => (
        <rect key={x} className="ib-tumbuh" style={{ '--i': i }} x={x} y={150 - t} width="22" height={t} rx="5" fill="currentColor" opacity={0.35 + i * 0.16} />
      ))}
      <line x1="226" x2="368" y1="152" y2="152" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
    </>
  ),
  orang: (
    <>
      {[
        [48, 54],
        [112, 84],
        [176, 112],
        [240, 138],
        [304, 164],
      ].map(([x, tinggi], i) => {
          const atas = 172 - tinggi
          return (
            <g key={x} className="ib-tumbuh" style={{ '--i': i }}>
              <rect x={x} y={atas} width="42" height={tinggi} rx="9" fill="currentColor" opacity={0.28 + i * 0.12} />
              <circle cx={x + 21} cy={atas - 26} r="11" fill="#f6f3ec" opacity="0.92" />
              <path d={`M${x + 4} ${atas - 4}c0-11 8-17 17-17s17 6 17 17z`} fill="#f6f3ec" opacity="0.92" />
            </g>
          )
        })}
      <path d="M40 56L130 56 220 44 312 28 370 14" fill="none" stroke="#f0cd82" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 7" opacity="0.75" />
    </>
  ),
  gedung: (
    <>
      <ellipse cx="195" cy="178" rx="140" ry="10" fill="#000" opacity="0.25" />
      <g className="ib-tumbuh" style={{ '--i': 0 }}>
        <path d="M195 28L300 76H90z" fill="currentColor" opacity="0.95" />
        <rect x="88" y="76" width="214" height="9" rx="2" fill="#f6f3ec" opacity="0.9" />
      </g>
      {[112, 148, 184, 220, 256].map((x, i) => (
        <rect key={x} className="ib-tumbuh" style={{ '--i': i + 1 }} x={x} y="94" width="22" height="62" rx="4" fill="#f6f3ec" opacity="0.88" />
      ))}
      <rect x="80" y="160" width="230" height="8" rx="2" fill="#f6f3ec" opacity="0.8" />
      <rect x="68" y="170" width="254" height="8" rx="2" fill="#f6f3ec" opacity="0.6" />
      <circle cx="195" cy="62" r="7" fill="#0a1f33" opacity="0.7" />
    </>
  ),
}

export default function IlustrasiBerita({ ikon }) {
  return (
    <svg className="ilustrasi-berita" viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="390" height="200" fill="#0c2a45" />
      <circle cx="330" cy="26" r="120" fill="currentColor" opacity="0.14" />
      <circle cx="30" cy="200" r="110" fill="currentColor" opacity="0.08" />
      {ADEGAN[ikon] || ADEGAN.saham}
    </svg>
  )
}