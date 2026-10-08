import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// Menggulir ke elemen tertentu. Kalau scroll halus (Lenis) aktif, pakai itu supaya geraknya
// seirama dengan scroll mouse; kalau tidak, pakai scroll bawaan browser.
export function gulirKe(target, offset = -80) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset })
  else el.scrollIntoView({ behavior: 'smooth' })
}

// Dipanggil sekali di App. Membuat scroll terasa mengalir dan menjaga posisi ScrollTrigger tetap akurat.
export default function useScrollHalus() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const ketukan = (waktu) => lenis.raf(waktu * 1000)
    gsap.ticker.add(ketukan)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(ketukan)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])
}