import './LatarKonsultasi.css'

// Latar halaman login admin: ilustrasi vektor pakar dan klien yang berhadapan di meja konsultasi,
// dengan papan grafik, jendela kota, dan beberapa gelembung percakapan. Semua digambar dengan palet TAKAR,
// jadi tidak bergantung pada foto dari luar dan selalu tajam di layar apa pun.
//
// Ingin memakai foto sendiri? Taruh berkasnya di folder public dengan nama latar-admin.jpg.
// Foto itu otomatis tampil di atas ilustrasi (lihat LatarKonsultasi.css). Tanpa berkas itu, ilustrasi yang tampil.
export default function LatarKonsultasi() {
  return (
    <div className="latar" aria-hidden="true">
      <svg className="latar__gambar" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="lt-dinding" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#12304c" />
            <stop offset="1" stopColor="#08192c" />
          </linearGradient>
          <linearGradient id="lt-meja" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b4163" />
            <stop offset="1" stopColor="#081b30" />
          </linearGradient>
          <linearGradient id="lt-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ecb54e" stopOpacity="0.38" />
            <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lt-jas-pakar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a8aa0" />
            <stop offset="1" stopColor="#17596b" />
          </linearGradient>
          <linearGradient id="lt-jas-klien" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e07a60" />
            <stop offset="1" stopColor="#b8472f" />
          </linearGradient>
          <radialGradient id="lt-cahaya-emas" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ecb54e" stopOpacity="0.32" />
            <stop offset="1" stopColor="#ecb54e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lt-cahaya-teal" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#4db3c6" stopOpacity="0.28" />
            <stop offset="1" stopColor="#4db3c6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dinding dan cahaya */}
        <rect width="1600" height="900" fill="url(#lt-dinding)" />
        <circle cx="1240" cy="260" r="430" fill="url(#lt-cahaya-emas)" />
        <circle cx="260" cy="300" r="400" fill="url(#lt-cahaya-teal)" />

        {/* Jendela kota di kanan atas */}
        <g className="latar__jendela">
          <rect x="1010" y="86" width="500" height="372" rx="22" fill="#0b2239" stroke="rgba(236,181,78,0.22)" strokeWidth="2" />
          <g fill="#102f4d">
            <rect x="1040" y="300" width="64" height="130" rx="3" />
            <rect x="1114" y="238" width="78" height="192" rx="3" />
            <rect x="1202" y="320" width="56" height="110" rx="3" />
            <rect x="1268" y="196" width="88" height="234" rx="3" />
            <rect x="1366" y="272" width="62" height="158" rx="3" />
            <rect x="1438" y="330" width="46" height="100" rx="3" />
          </g>
          <g fill="#ecb54e" opacity="0.7">
            <rect x="1056" y="322" width="8" height="10" rx="1" />
            <rect x="1074" y="344" width="8" height="10" rx="1" />
            <rect x="1134" y="262" width="8" height="10" rx="1" />
            <rect x="1156" y="290" width="8" height="10" rx="1" />
            <rect x="1134" y="326" width="8" height="10" rx="1" />
            <rect x="1288" y="224" width="8" height="10" rx="1" />
            <rect x="1318" y="252" width="8" height="10" rx="1" />
            <rect x="1296" y="296" width="8" height="10" rx="1" />
            <rect x="1384" y="298" width="8" height="10" rx="1" />
            <rect x="1214" y="348" width="8" height="10" rx="1" />
            <rect x="1450" y="352" width="8" height="10" rx="1" />
          </g>
          <line x1="1260" y1="86" x2="1260" y2="458" stroke="rgba(236,181,78,0.2)" strokeWidth="2" />
          <line x1="1010" y1="272" x2="1510" y2="272" stroke="rgba(236,181,78,0.2)" strokeWidth="2" />
        </g>

        {/* Papan grafik di kiri atas */}
        <g className="latar__papan">
          <rect x="88" y="104" width="470" height="300" rx="22" fill="rgba(246,243,236,0.055)" stroke="rgba(246,243,236,0.16)" strokeWidth="2" />
          <rect x="118" y="134" width="150" height="12" rx="6" fill="rgba(246,243,236,0.3)" />
          <rect x="118" y="158" width="96" height="9" rx="4.5" fill="rgba(246,243,236,0.16)" />
          <g stroke="rgba(246,243,236,0.1)" strokeWidth="1.5">
            <line x1="118" y1="236" x2="528" y2="236" />
            <line x1="118" y1="288" x2="528" y2="288" />
            <line x1="118" y1="340" x2="528" y2="340" />
          </g>
          <path d="M118 360 L190 326 L254 338 L320 280 L384 296 L452 224 L528 196 L528 372 L118 372 Z" fill="url(#lt-area)" />
          <path className="latar__garis" d="M118 360 L190 326 L254 338 L320 280 L384 296 L452 224 L528 196" fill="none" stroke="#ecb54e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <g fill="#f0cd82">
            <circle cx="190" cy="326" r="6" />
            <circle cx="320" cy="280" r="6" />
            <circle cx="452" cy="224" r="6" />
            <circle cx="528" cy="196" r="8" />
          </g>
        </g>

        {/* Tanaman di kanan */}
        <g className="latar__tanaman">
          <path d="M1496 650 C1470 590 1468 530 1500 470 C1512 540 1516 600 1496 650 Z" fill="#1b6b62" />
          <path d="M1496 650 C1530 600 1550 550 1540 490 C1512 540 1500 600 1496 650 Z" fill="#228a7c" />
          <path d="M1496 650 C1450 620 1426 580 1430 530 C1462 560 1486 600 1496 650 Z" fill="#17594f" />
          <path d="M1462 650 L1530 650 L1518 716 L1474 716 Z" fill="#c9573f" />
        </g>

        {/* Meja */}
        <rect x="0" y="650" width="1600" height="250" fill="url(#lt-meja)" />
        <rect x="0" y="648" width="1600" height="5" fill="rgba(236,181,78,0.4)" />
        <rect x="0" y="653" width="1600" height="26" fill="rgba(255,255,255,0.05)" />

        {/* Pakar di kiri */}
        <g className="latar__pakar">
          <path d="M214 690 L216 566 Q216 512 280 500 L380 500 Q444 512 446 566 L448 690 Z" fill="url(#lt-jas-pakar)" />
          <path d="M306 502 L354 502 L330 570 Z" fill="#f6f3ec" />
          <path d="M322 522 L338 522 L342 586 L330 600 L318 586 Z" fill="#ecb54e" />
          <path d="M286 500 L330 570 L300 540 Z" fill="#124b5b" />
          <path d="M374 500 L330 570 L360 540 Z" fill="#124b5b" />
          <rect x="314" y="462" width="32" height="42" rx="10" fill="#cf9570" />
          <ellipse cx="330" cy="430" rx="42" ry="48" fill="#dba57f" />
          <path d="M286 424 Q282 372 332 372 Q382 372 376 424 Q366 398 332 398 Q300 398 286 424 Z" fill="#1c1d27" />
          <g fill="none" stroke="#f0cd82" strokeWidth="3.5">
            <circle cx="314" cy="434" r="12" />
            <circle cx="346" cy="434" r="12" />
            <line x1="326" y1="434" x2="334" y2="434" />
          </g>
          <path d="M314 462 Q330 472 346 462" fill="none" stroke="#a96c4b" strokeWidth="3" strokeLinecap="round" />
          <path d="M420 560 Q470 580 520 636 L500 664 Q440 620 404 590 Z" fill="#1f7a8c" />
          <circle cx="526" cy="650" r="16" fill="#dba57f" />
        </g>

        {/* Klien di kanan */}
        <g className="latar__klien">
          <path d="M1166 690 L1164 566 Q1164 512 1228 500 L1328 500 Q1392 512 1394 566 L1396 690 Z" fill="url(#lt-jas-klien)" />
          <path d="M1252 502 Q1278 540 1304 502 Z" fill="#f6f3ec" opacity="0.92" />
          <rect x="1262" y="462" width="32" height="42" rx="10" fill="#b57b58" />
          <path d="M1230 436 Q1214 360 1278 356 Q1344 360 1328 436 L1340 560 Q1316 548 1306 520 L1250 520 Q1240 548 1218 560 Z" fill="#1c1d27" />
          <ellipse cx="1278" cy="432" rx="40" ry="46" fill="#c58b66" />
          <path d="M1238 418 Q1250 384 1278 384 Q1308 384 1318 418 Q1296 400 1278 404 Q1258 400 1238 418 Z" fill="#1c1d27" />
          <path d="M1262 462 Q1278 472 1294 462" fill="none" stroke="#8c5a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M1190 566 Q1130 600 1100 650 L1124 668 Q1170 628 1214 596 Z" fill="#c9573f" />
          <circle cx="1096" cy="652" r="16" fill="#c58b66" />
        </g>

        {/* Di atas meja: dokumen, tablet, cangkir */}
        <g className="latar__meja">
          <g transform="rotate(-5 700 690)">
            <rect x="620" y="664" width="150" height="104" rx="6" fill="#f6f3ec" opacity="0.9" />
            <rect x="636" y="682" width="86" height="8" rx="4" fill="#9db4c6" />
            <rect x="636" y="700" width="110" height="6" rx="3" fill="#c9d6e0" />
            <rect x="636" y="714" width="100" height="6" rx="3" fill="#c9d6e0" />
            <rect x="636" y="728" width="60" height="6" rx="3" fill="#c9d6e0" />
          </g>
          <g transform="rotate(4 870 700)">
            <rect x="810" y="670" width="150" height="104" rx="6" fill="#ecb54e" opacity="0.92" />
            <circle cx="868" cy="722" r="26" fill="#f6f3ec" opacity="0.95" />
            <path d="M868 722 L868 696 A26 26 0 0 1 893 729 Z" fill="#1f7a8c" />
            <rect x="906" y="696" width="38" height="8" rx="4" fill="#8a5f0c" opacity="0.6" />
            <rect x="906" y="712" width="30" height="8" rx="4" fill="#8a5f0c" opacity="0.6" />
          </g>
          <g transform="translate(540 676)">
            <rect x="0" y="0" width="112" height="72" rx="8" fill="#0a1f33" stroke="#4db3c6" strokeWidth="3" />
            <path d="M14 56 L34 40 L52 48 L78 22 L98 18" fill="none" stroke="#4db3c6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform="translate(1030 690)">
            <path d="M0 0 L58 0 L52 54 Q50 60 44 60 L14 60 Q8 60 6 54 Z" fill="#f6f3ec" opacity="0.92" />
            <path d="M58 12 Q82 14 80 32 Q78 48 54 46" fill="none" stroke="#f6f3ec" strokeWidth="6" opacity="0.92" />
          </g>
        </g>

        {/* Gelembung percakapan */}
        <g className="latar__gelembung latar__gelembung--a">
          <rect x="420" y="296" width="116" height="84" rx="22" fill="rgba(236,181,78,0.16)" stroke="rgba(236,181,78,0.5)" strokeWidth="2" />
          <path d="M452 380 L444 408 L478 380 Z" fill="rgba(236,181,78,0.16)" stroke="rgba(236,181,78,0.5)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M478 318 L508 330 L508 352 Q508 366 478 376 Q448 366 448 352 L448 330 Z" fill="none" stroke="#f0cd82" strokeWidth="4" strokeLinejoin="round" />
          <path d="M464 348 L474 358 L494 336" fill="none" stroke="#f0cd82" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="latar__gelembung latar__gelembung--b">
          <rect x="1076" y="500" width="116" height="84" rx="22" fill="rgba(77,179,198,0.16)" stroke="rgba(77,179,198,0.55)" strokeWidth="2" />
          <path d="M1160 584 L1170 610 L1134 584 Z" fill="rgba(77,179,198,0.16)" stroke="rgba(77,179,198,0.55)" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="1134" cy="542" r="22" fill="none" stroke="#7fd0e0" strokeWidth="4" />
          <path d="M1134 542 L1134 520 A22 22 0 0 1 1154 552 Z" fill="#7fd0e0" />
        </g>

        {/* Titik cahaya kecil */}
        <g className="latar__titik" fill="#f0cd82">
          <circle cx="640" cy="170" r="3" />
          <circle cx="760" cy="96" r="2.5" />
          <circle cx="900" cy="230" r="3" />
          <circle cx="980" cy="560" r="2.5" />
          <circle cx="720" cy="520" r="3" />
          <circle cx="1560" cy="300" r="2.5" />
          <circle cx="40" cy="560" r="3" />
        </g>
      </svg>
      <div className="latar__foto" />
      <div className="latar__selubung" />
    </div>
  )
}