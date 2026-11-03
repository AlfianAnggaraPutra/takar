import './LogoPerisai.css'

/*
  Logo TAKAR: tiga perisai kaca (merah, hijau, emas) tanpa panggung. Dipakai di header, footer, dan halaman masuk admin.
  Tinggi diatur lewat CSS pemanggil (kelas className), lebarnya mengikuti perbandingan bingkai 384 x 238.

  Tiap perisai adalah lapisan sendiri supaya bisa bergerak bergantian saat kursor menyentuh tautan induknya.
  Untuk memakai gerak ini, beri kelas "lgp-induk" pada tautan atau tombol yang membungkus logo ini. Tanpa kelas itu
  logonya tetap tampil, hanya tidak bergerak.
*/
const LAPISAN = ['merah', 'emas', 'hijau']
const FOLDER = '/logo/'

export default function LogoPerisai({ className = '' }) {
  return (
    <span className={`lgp ${className}`.trim()} role="img" aria-label="Logo TAKAR, tiga perisai berwarna merah, hijau, dan emas">
      {LAPISAN.map((kode) => (
        <span className={`lgp__lap lgp__lap--${kode}`} key={kode} aria-hidden="true">
          <img src={`${FOLDER}logo-${kode}.webp`} alt="" width="384" height="238" decoding="async" draggable="false" />
          <i className="lgp__kilat" />
        </span>
      ))}
    </span>
  )
}