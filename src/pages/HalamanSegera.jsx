import { Link } from 'react-router-dom'

// Dipakai sementara untuk halaman yang belum selesai dibangun, supaya menu di header tidak mengarah ke halaman kosong.
export default function HalamanSegera({ judul, uraian }) {
  return (
    <section className="segera">
      <div className="pembungkus segera__isi">
        <p className="label-seksi">Segera hadir</p>
        <h1 className="judul-seksi">{judul}</h1>
        <p className="lead-seksi">{uraian}</p>
        <Link to="/" className="tombol tombol--emas">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  )
}