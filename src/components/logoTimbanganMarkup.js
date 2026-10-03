// Markup SVG ikon timbangan TAKAR. Titik putar balok (poros tengah) dan
// kedua piringan sengaja dibuat jadi (0,0) LOKAL lewat pembungkus <g
// transform="translate(...)"> di sekelilingnya. Jadi saat dianimasikan lewat
// GSAP, cukup pakai svgOrigin: '0 0' — tidak perlu menghitung/menebak
// koordinat piksel, dan hasilnya konsisten walau ikon di-scale besar/kecil.
export const markupLogoTimbangan = `<defs>
  <linearGradient id="p-logam"><stop offset="0" stop-color="#CFC7B3"/><stop offset=".3" stop-color="#FBF8F1"/><stop offset=".62" stop-color="#F6F3EC"/><stop offset="1" stop-color="#BDB49E"/></linearGradient>
  <linearGradient id="p-emas"><stop offset="0" stop-color="#7A5209"/><stop offset=".32" stop-color="#D9A24B"/><stop offset=".64" stop-color="#E3A32B"/><stop offset="1" stop-color="#7A5209"/></linearGradient>
  <linearGradient id="p-teal"><stop offset="0" stop-color="#2C8296"/><stop offset=".35" stop-color="#7FD3E3"/><stop offset=".7" stop-color="#4DB3C6"/><stop offset="1" stop-color="#24707F"/></linearGradient>
  <linearGradient id="p-terakota"><stop offset="0" stop-color="#A03F29"/><stop offset=".35" stop-color="#F08F76"/><stop offset=".7" stop-color="#D9694F"/><stop offset="1" stop-color="#8E3823"/></linearGradient>
</defs>
<g class="t-plinth-grup">
  <rect class="t-plinth t-plinth-bawah" x="370" y="-60" width="760" height="60" rx="14" fill="url(#p-emas)"/>
  <rect class="t-plinth t-plinth-tengah" x="440" y="-115" width="620" height="55" rx="12" fill="url(#p-logam)"/>
  <rect class="t-plinth t-plinth-atas" x="520" y="-170" width="460" height="55" rx="12" fill="url(#p-logam)"/>
</g>
<g class="t-kolom">
  <rect class="t-batang" x="610" y="-1215" width="280" height="1050" fill="url(#p-logam)"/>
  <rect class="t-hiasan t-kerah-bawah" x="580" y="-225" width="340" height="55" rx="27" fill="url(#p-emas)"/>
  <rect class="t-hiasan t-leher-bawah" x="610" y="-325" width="280" height="40" rx="20" fill="url(#p-emas)"/>
  <circle class="t-hiasan t-bola" cx="750" cy="-470" r="165" fill="url(#p-emas)"/>
  <rect class="t-hiasan t-leher-atas" x="610" y="-655" width="280" height="40" rx="20" fill="url(#p-emas)"/>
  <rect class="t-hiasan t-kerah-tengah" x="600" y="-760" width="300" height="50" rx="25" fill="url(#p-emas)"/>
  <rect class="t-hiasan t-kerah-atas" x="590" y="-1170" width="320" height="50" rx="25" fill="url(#p-emas)"/>
</g>
<g class="t-balok" transform="translate(750 -1300)">
    <g class="t-balok-dalam">
      <g class="t-balok-badan">
        <path class="t-lengan" d="M-700 32C-450 8 -230 -100 0 -100C230 -100 450 8 700 32L700 92C450 82 230 100 0 100C-230 100 -450 82 -700 92Z" fill="url(#p-logam)"/>
        <circle class="t-ujung t-ujung-kiri" cx="-700" cy="62" r="52" fill="url(#p-emas)"/>
        <circle class="t-ujung t-ujung-kanan" cx="700" cy="62" r="52" fill="url(#p-emas)"/>
        <circle class="t-cincin-gantung" cx="-515" cy="88" r="34" fill="url(#p-emas)"/>
        <circle class="t-cincin-gantung" cx="515" cy="88" r="34" fill="url(#p-emas)"/>
      </g>
      <g class="t-piringan t-piringan-kiri" transform="translate(-515 88)">
    <g class="t-isi">
      <path class="t-tali" d="M0 0L-205 428M0 0L0 428M0 0L205 428" stroke="#E3A32B" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path class="t-mangkuk" d="M-215 432Q-203 672 0 676Q203 672 215 432Z" fill="url(#p-teal)"/>
      <ellipse class="t-kaki-mangkuk" cx="0" cy="678" rx="70" ry="16" fill="url(#p-emas)"/>
      <ellipse class="t-bibir" cx="0" cy="432" rx="215" ry="46" fill="#1C6273" stroke="url(#p-logam)" stroke-width="20"/>
    </g>
  </g>
      <g class="t-piringan t-piringan-kanan" transform="translate(515 88)">
    <g class="t-isi">
      <path class="t-tali" d="M0 0L-205 428M0 0L0 428M0 0L205 428" stroke="#E3A32B" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path class="t-mangkuk" d="M-215 432Q-203 672 0 676Q203 672 215 432Z" fill="url(#p-terakota)"/>
      <ellipse class="t-kaki-mangkuk" cx="0" cy="678" rx="70" ry="16" fill="url(#p-emas)"/>
      <ellipse class="t-bibir" cx="0" cy="432" rx="215" ry="46" fill="#7E301E" stroke="url(#p-logam)" stroke-width="20"/>
    </g>
  </g>
    </g>
  </g>
<circle class="t-cincin" cx="750" cy="-1300" r="125" fill="none" stroke="#E3A32B" stroke-width="26"/>
<g class="t-pivot">
  <circle class="t-pivot-bola" cx="750" cy="-1300" r="125" fill="url(#p-emas)"/>
  <circle class="t-pivot-kilap" cx="712" cy="-1345" r="30" fill="#fff" opacity=".5"/>
</g>
<g transform="translate(690 -1360)"><path class="t-kilau" d="M0 -90Q0 0 90 0Q0 0 0 90Q0 0 -90 0Q0 0 0 -90Z" fill="#fff"/></g>`;