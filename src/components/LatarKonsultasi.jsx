import GambarAman from './GambarAman'
import './LatarKonsultasi.css'

// Latar halaman login admin: foto pilihan Anda yang dibuat pudar dan sedikit buram, di atas dasar biru tua polos.
// Tidak ada ilustrasi. Selubung gelap di tengah menjaga area kartu login tetap tenang, jadi isi foto tidak pernah
// berbenturan dengan tulisan atau kolom isian.
//
// CARA MEMASANG FOTO
// Simpan fotonya di folder public dengan nama latar-admin.jpg (atau .jpeg, .webp, .png). Tidak ada kode yang perlu diubah.
// Foto dipotong otomatis menyesuaikan layar (object-fit: cover), jadi ukuran dan orientasinya bebas. Tanpa berkas itu,
// yang tampil hanya dasar biru tua dengan cahaya lembut, bukan kotak kosong atau gambar rusak.
const SUMBER_FOTO = ['/latar-admin.jpg', '/latar-admin.jpeg', '/latar-admin.webp', '/latar-admin.png']

export default function LatarKonsultasi() {
  return (
    <div className="latar" aria-hidden="true">
      <div className="latar__foto">
        <GambarAman sumber={SUMBER_FOTO} alt="" />
      </div>
      <div className="latar__selubung" />
    </div>
  )
}