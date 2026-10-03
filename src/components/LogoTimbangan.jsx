import { forwardRef } from 'react'
import { markupLogoTimbangan } from './logoTimbanganMarkup'

// Ikon timbangan TAKAR saja (tanpa huruf AKAR). Dipakai di splash screen,
// header navbar, dan favicon preview — jadi sengaja dipisah dari teks supaya
// bisa dipakai ulang di ukuran & konteks yang berbeda-beda.
//
// forwardRef meneruskan ref ke <svg>, supaya GSAP bisa mencari bagian-bagian
// di dalamnya lewat class (.t-batang, .t-piringan-kiri, .t-pivot, dst) tanpa
// perlu ref terpisah untuk tiap elemen kecil.
const LogoTimbangan = forwardRef(function LogoTimbangan({ className }, ref) {
  return (
    <svg
      ref={ref}
      className={className}
      viewBox="-30 -1480 1580 1520"
      role="img"
      aria-label="Ikon timbangan TAKAR"
      dangerouslySetInnerHTML={{ __html: markupLogoTimbangan }}
    />
  )
})

export default LogoTimbangan