import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { PILIHAN_JAWABAN, REKOMENDASI_INSTRUMEN } from '../data/basisPengetahuan'
import { KETERANGAN_INSTRUMEN, LABEL_RISIKO, URAIAN_PROFIL } from '../data/profilRisiko'
import './HasilKonsultasi.css'

/* ---------- Pemformatan angka gaya Indonesia ---------- */

const koma = (angka, desimal) => angka.toFixed(desimal).replace('.', ',')

// Angka persen utama. Bila pembulatan dua desimal menghasilkan 100 padahal nilainya sedikit di bawah 100,
// ditulis 99,99 supaya tidak menyiratkan kepastian mutlak (sejalan dengan "> 99,99%" di kartu sebaran).
function persenUtama(x) {
  const bulat = Math.round(x * 100) / 100
  return bulat >= 100 && x < 100 ? 99.99 : bulat
}

// Posterior (0 sampai 1) ditulis sebagai persen. Nilai yang sangat kecil atau sangat dekat 100 dibulatkan secara jujur.
function formatPersen(posterior) {
  const x = posterior * 100
  if (x > 0 && x < 0.01) return '< 0,01%'
  if (x > 99.99 && x < 100) return '> 99,99%'
  return `${koma(x, 2)}%`
}

function Ilmiah({ nilai }) {
  if (nilai === 0) return <>0</>
  const [mantisa, eksponen] = nilai.toExponential(4).split('e')
  return (
    <>
      {mantisa.replace('.', ',')} × 10<sup>{Number(eksponen)}</sup>
    </>
  )
}

// Pembuat laporan dimuat terpisah dan hanya sekali. Browser menyimpan hasil muat yang gagal, jadi
// bila gagal, satu-satunya cara mencoba lagi adalah memuat ulang halaman (hasil konsultasi tetap ada).
let modulLaporan = null
const muatModulLaporan = () => {
  if (!modulLaporan) modulLaporan = import('../lib/buatLaporanPdf')
  return modulLaporan
}

const labelJawaban = (cf) => PILIHAN_JAWABAN.find((p) => p.nilai === cf)?.label ?? String(cf)

/* ---------- Ikon ---------- */

const Ikon = {
  centang: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </svg>
  ),
  ulang: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4.5H8" />
    </svg>
  ),
  panah: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  unduh: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  ),
  dokumen: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h6M9 9.5h2" />
    </svg>
  ),
  panahBawah: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}

/* ---------- Penanda status penyimpanan riwayat ---------- */

function StatusSimpan({ status, pesan, saatCobaLagi }) {
  if (status === 'menyimpan') {
    return (
      <p className="hasil__simpan" role="status">
        <span className="hasil__putar" aria-hidden="true" /> Menyimpan riwayat konsultasi
      </p>
    )
  }
  if (status === 'tersimpan') {
    return (
      <p className="hasil__simpan hasil__simpan--baik" role="status">
        {Ikon.centang} Riwayat konsultasi Anda sudah tersimpan
      </p>
    )
  }
  if (status === 'gagal') {
    return (
      <div className="hasil__simpan hasil__simpan--galat" role="alert">
        <span>{pesan || 'Riwayat belum bisa disimpan. Hasil Anda tetap aman di halaman ini.'}</span>
        <button type="button" onClick={saatCobaLagi}>Coba simpan lagi</button>
      </div>
    )
  }
  return null
}

/* ---------- Halaman hasil ---------- */

export default function HasilKonsultasi({ identitas, hasil, jawaban, nomorKonsultasi, statusSimpan, pesanSimpan, saatSimpanUlang, saatUlangi, saatTinjau }) {
  const akar = useRef(null)
  const angka = useRef(null)
  const [batang, setBatang] = useState(false)
  const [statusPdf, setStatusPdf] = useState('siap') // siap, membuat, selesai, galat, galatMuat

  const kurangGerak = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Elemen muncul bergantian saat halaman hasil dibuka. */
  useLayoutEffect(() => {
    if (kurangGerak) return
    const ctx = gsap.context(() => {
      gsap.from('[data-masuk]', { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.09, clearProps: 'opacity,visibility,transform' })
    }, akar)
    return () => ctx.revert()
  }, [kurangGerak])

  /* Batang persentase terisi dan angka utama menghitung naik. */
  useEffect(() => {
    const penunda = window.setTimeout(() => setBatang(true), kurangGerak ? 0 : 450)
    return () => window.clearTimeout(penunda)
  }, [kurangGerak])

  useEffect(() => {
    const el = angka.current
    if (!el || !hasil.dapatDitentukan) return
    const akhir = koma(persenUtama(hasil.persentase), 2)
    el.textContent = akhir
    if (kurangGerak) return
    const o = { v: 0 }
    el.textContent = '0,00'
    const tween = gsap.to(o, {
      v: persenUtama(hasil.persentase),
      duration: 1.7,
      delay: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = koma(o.v, 2)
      },
      onComplete: () => {
        el.textContent = akhir
      },
    })
    return () => {
      tween.kill()
      el.textContent = akhir
    }
  }, [hasil, kurangGerak])

  /* Pembuat laporan dimuat diam-diam begitu hasil tampil, supaya tombol unduh langsung bekerja. */
  useEffect(() => {
    if (!hasil.dapatDitentukan) return
    const penunda = window.setTimeout(() => muatModulLaporan().catch(() => {}), 1200)
    return () => window.clearTimeout(penunda)
  }, [hasil])

  /* Laporan PDF dibuat di browser pengguna, tanpa mengirim data ke server. */
  const unduhLaporan = async () => {
    if (statusPdf === 'membuat') return
    if (statusPdf === 'galatMuat') {
      window.location.reload()
      return
    }
    setStatusPdf('membuat')
    let modul
    try {
      modul = await muatModulLaporan()
    } catch (galat) {
      console.error('Gagal memuat pembuat laporan PDF:', galat)
      setStatusPdf('galatMuat')
      return
    }
    try {
      await modul.buatLaporanPdf({ identitas, jawaban, hasil, nomorKonsultasi })
      setStatusPdf('selesai')
    } catch (galat) {
      console.error('Gagal membuat laporan PDF:', galat)
      setStatusPdf('galat')
    }
  }

  /* ----- Profil belum dapat ditentukan ----- */
  if (!hasil.dapatDitentukan) {
    return (
      <div className="hasil hasil--kosong" ref={akar}>
        <div className="pembungkus hasil__kosong-isi">
          <span className="hasil__kosong-ikon" data-masuk>{Ikon.info}</span>
          <p className="label-seksi" data-masuk>Hasil konsultasi</p>
          <h1 className="hasil__kosong-judul" data-masuk>Profil risiko belum dapat ditentukan</h1>
          <p className="hasil__kosong-teks" data-masuk>
            {hasil.alasan} Sistem membutuhkan setidaknya satu pernyataan yang menurut Anda sesuai untuk bisa menilai kecenderungan Anda.
          </p>
          <p className="hasil__kosong-teks" data-masuk>
            Tinjau kembali jawaban Anda. Bila ada pernyataan yang sedikit saja mendekati kebiasaan Anda, pilih &quot;Sedikit Sesuai&quot; dan bukan &quot;Tidak&quot;.
          </p>
          <div className="hasil__aksi" data-masuk>
            <button type="button" className="tombol tombol--emas" onClick={saatTinjau}>
              Tinjau jawaban saya {Ikon.panah}
            </button>
            <button type="button" className="tombol tombol--garis" onClick={saatUlangi}>
              {Ikon.ulang} Ulangi dari awal
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ----- Hasil normal ----- */
  const tertinggi = hasil.profilTertinggi
  const uraian = URAIAN_PROFIL[tertinggi.kode]
  const instrumen = REKOMENDASI_INSTRUMEN[tertinggi.kode] ?? []
  const namaDepan = identitas?.nama?.split(' ')[0] ?? ''

  const catatan = []
  if (hasil.jumlahIndikatorTeramati < 5) {
    catatan.push(`Baru ${hasil.jumlahIndikatorTeramati} pernyataan yang Anda tandai sesuai. Hasil ini bisa bergeser bila Anda menjawab lebih lengkap, jadi anggap sebagai gambaran awal.`)
  }
  if (hasil.jumlahIndikatorTeramati >= 30) {
    catatan.push('Anda menandai sebagian besar pernyataan sebagai sesuai, termasuk beberapa yang saling berlawanan. Untuk pola seperti ini sistem cenderung memberi profil Moderat. Coba ulangi dengan jawaban yang lebih membedakan bila Anda ingin hasil yang lebih tajam.')
  }
  if (hasil.seri) {
    catatan.push('Dua profil memiliki nilai yang sama persis, sehingga hasil ini sebaiknya dibaca bersama profil lain di samping.')
  }

  return (
    <div className="hasil" ref={akar}>
      <div className="pembungkus">
        {/* Hasil utama */}
        <section className="hasil__utama" data-warna={uraian.warna}>
          <div className="hasil__profil" data-masuk>
            <p className="label-seksi">{namaDepan ? `Hasil untuk ${namaDepan}` : 'Hasil konsultasi'}</p>
            <h1 className="hasil__judul">
              Profil risiko Anda <em>{tertinggi.nama}</em>
            </h1>
            <p className="hasil__julukan">{uraian.julukan}</p>
            <p className="hasil__ringkasan">{uraian.ringkasan}</p>
            <div className="hasil__keyakinan">
              <p className="hasil__persen">
                <span ref={angka} />
                <small>%</small>
              </p>
              <p className="hasil__persen-ket">tingkat keyakinan sistem pada profil {tertinggi.nama}</p>
            </div>
          </div>

          <div className="hasil__kartu" data-masuk>
            <h2>Sebaran probabilitas</h2>
            <p className="hasil__kartu-sub">Hasil perhitungan Naive Bayes dan Certainty Factor untuk ketiga profil.</p>
            <ul className="hasil__batang-daftar">
              {hasil.urutan.map((p, indeks) => {
                const warna = URAIAN_PROFIL[p.kode].warna
                return (
                  <li key={p.kode} data-warna={warna} className={indeks === 0 ? 'hasil__baris hasil__baris--juara' : 'hasil__baris'}>
                    <div className="hasil__baris-atas">
                      <span className="hasil__baris-nama">
                        <i aria-hidden="true" />
                        {p.nama}
                        {indeks === 0 && <b>Tertinggi</b>}
                      </span>
                      <strong>{formatPersen(p.posterior)}</strong>
                    </div>
                    <div className="hasil__batang" role="img" aria-label={`${p.nama} ${formatPersen(p.posterior)}`}>
                      <span style={{ width: batang ? `${p.posterior * 100}%` : '0%' }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <StatusSimpan status={statusSimpan} pesan={pesanSimpan} saatCobaLagi={saatSimpanUlang} />
          </div>
        </section>

        {catatan.length > 0 && (
          <div className="hasil__catatan" data-masuk>
            {catatan.map((c) => (
              <p key={c}>
                {Ikon.info} <span>{c}</span>
              </p>
            ))}
          </div>
        )}

        {/* Unduh laporan PDF */}
        <section className="hasil__laporan" data-masuk aria-labelledby="hasil-laporan-judul">
          <span className="hasil__laporan-ikon" aria-hidden="true">
            {Ikon.dokumen}
            <b>PDF</b>
          </span>
          <div className="hasil__laporan-isi">
            <p className="label-seksi">Laporan konsultasi</p>
            <h2 id="hasil-laporan-judul">Simpan hasil Anda dalam bentuk PDF</h2>
            <p>
              Laporan ini disusun rapi dan siap dibaca atau dicetak. Cocok untuk arsip pribadi, atau dibawa saat Anda ingin mengecek hasilnya bersama pakar.
            </p>
            <ul className="hasil__laporan-isi-daftar" aria-label="Isi laporan">
              <li>Profil dan persentase</li>
              <li>Grafik sebaran</li>
              <li>Instrumen</li>
              <li>Rincian hitungan</li>
              <li>40 jawaban</li>
            </ul>
          </div>
          <div className="hasil__laporan-aksi">
            <button type="button" className="tombol tombol--emas hasil__unduh" onClick={unduhLaporan} disabled={statusPdf === 'membuat'} aria-busy={statusPdf === 'membuat'}>
              {statusPdf === 'membuat' ? (
                <>
                  <span className="hasil__putar hasil__putar--gelap" aria-hidden="true" /> Menyusun laporan
                </>
              ) : (
                <>
                  {statusPdf === 'galatMuat' ? Ikon.ulang : Ikon.unduh}{' '}
                  {statusPdf === 'selesai' ? 'Unduh lagi' : statusPdf === 'galat' ? 'Coba lagi' : statusPdf === 'galatMuat' ? 'Muat ulang halaman' : 'Unduh laporan PDF'}
                </>
              )}
            </button>
            <p
              className={`hasil__laporan-ket${statusPdf === 'galat' || statusPdf === 'galatMuat' ? ' hasil__laporan-ket--galat' : ''}`}
              role={statusPdf === 'galat' || statusPdf === 'galatMuat' ? 'alert' : 'status'}
            >
              {statusPdf === 'selesai' && <>{Ikon.centang} Laporan sudah terunduh ke perangkat Anda</>}
              {statusPdf === 'galat' && <>Laporan belum bisa dibuat. Silakan coba lagi.</>}
              {statusPdf === 'galatMuat' && <>Laporan belum bisa dimuat. Periksa koneksi internet, lalu muat ulang halaman. Hasil Anda tidak hilang.</>}
              {(statusPdf === 'siap' || statusPdf === 'membuat') && <>Format PDF, sekitar 5 sampai 6 halaman</>}
            </p>
          </div>
        </section>

        {/* Ciri dan saran */}
        <section className="hasil__dua" data-warna={uraian.warna}>
          <div className="hasil__panel" data-masuk>
            <h2>Yang tampak dari jawaban Anda</h2>
            <ul className="hasil__ciri">
              {uraian.ciri.map((c) => (
                <li key={c}>
                  <span>{Ikon.centang}</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="hasil__panel hasil__panel--saran" data-masuk>
            <h2>Saran untuk Anda</h2>
            <p>{uraian.saran}</p>
          </div>
        </section>

        {/* Instrumen */}
        <section className="hasil__instrumen" data-warna={uraian.warna}>
          <div className="hasil__kepala" data-masuk>
            <p className="label-seksi">Rekomendasi instrumen</p>
            <h2 className="hasil__h2">Instrumen yang sejalan dengan profil {tertinggi.nama}</h2>
          </div>
          <ul className="hasil__instrumen-daftar">
            {instrumen.map((nama) => {
              const info = KETERANGAN_INSTRUMEN[nama]
              return (
                <li key={nama} className="hasil__instrumen-kartu" data-masuk>
                  <h3>{nama}</h3>
                  {info && (
                    <>
                      <div className="hasil__risiko" aria-label={`Tingkat risiko ${LABEL_RISIKO[info.risiko]}`}>
                        <span className="hasil__risiko-titik" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <i key={n} className={n <= info.risiko ? 'hasil__risiko-isi' : ''} />
                          ))}
                        </span>
                        <small>Risiko {LABEL_RISIKO[info.risiko].toLowerCase()}</small>
                      </div>
                      <p>{info.uraian}</p>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Rincian perhitungan */}
        <details className="hasil__rincian" data-masuk>
          <summary>
            <span>
              <strong>Lihat rincian perhitungan</strong>
              <small>Setiap angka di bawah ini bisa dicocokkan dengan perhitungan manual di Bab IV</small>
            </span>
            <i aria-hidden="true">{Ikon.panahBawah}</i>
          </summary>

          <div className="hasil__rincian-isi">
            <p>
              Sistem hanya memakai <strong>{hasil.jumlahIndikatorTeramati}</strong> pernyataan yang Anda jawab dengan keyakinan lebih dari nol. Untuk tiap profil, nilai awalnya adalah probabilitas prior,
              lalu dikalikan hasil kali antara likelihood terkoreksi Laplace dan keyakinan Anda pada setiap pernyataan. Hasil kali ini disebut numerator, dan posterior diperoleh dengan membagi numerator
              dengan jumlah ketiga numerator.
            </p>

            <h3>Ringkasan per profil</h3>
            <div className="hasil__tabel-bungkus">
              <table className="hasil__tabel">
                <thead>
                  <tr>
                    <th>Profil</th>
                    <th>Prior</th>
                    <th>Numerator</th>
                    <th>Posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.hasilPerProfil.map((p) => (
                    <tr key={p.kode} className={p.kode === tertinggi.kode ? 'hasil__tabel-juara' : undefined}>
                      <td>{p.kode} {p.nama}</td>
                      <td>{koma(p.prior, 2)}</td>
                      <td><Ilmiah nilai={p.numerator} /></td>
                      <td>{koma(p.posterior, 7)}</td>
                    </tr>
                  ))}
                </tbody>
                {hasil.penyebut !== null && (
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Penyebut (jumlah numerator)</td>
                      <td colSpan={2}><Ilmiah nilai={hasil.penyebut} /></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <h3>Pernyataan yang dipakai</h3>
            <div className="hasil__tabel-bungkus">
              <table className="hasil__tabel hasil__tabel--rapat">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Indikator</th>
                    <th>Jawaban</th>
                    <th>CF</th>
                    <th>P(Ei|H1)</th>
                    <th>P(Ei|H2)</th>
                    <th>P(Ei|H3)</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.indikatorTeramati.map((i, indeks) => (
                    <tr key={i.kode}>
                      <td>{i.kode}</td>
                      <td>{i.nama}</td>
                      <td>{labelJawaban(i.cf)}</td>
                      <td>{koma(i.cf, 1)}</td>
                      {hasil.hasilPerProfil.map((p) => (
                        <td key={p.kode}>{koma(p.faktor[indeks].likelihoodBaru, 4)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hasil__rumus">P(Ei|Hj) baru = (P(Ei|Hj) × 100 + 1) ÷ 102</p>
          </div>
        </details>

        <p className="hasil__peringatan" data-masuk>
          Hasil ini bersifat edukatif dan dihitung dari jawaban Anda saja. Hasil ini bukan nasihat keuangan pribadi, jadi tetap pertimbangkan tujuan, kondisi keuangan, dan konsultasikan dengan perencana keuangan berizin sebelum berinvestasi.
        </p>

        <div className="hasil__aksi hasil__aksi--bawah" data-masuk>
          <button type="button" className="tombol tombol--garis" onClick={saatUlangi}>
            {Ikon.ulang} Ulangi konsultasi
          </button>
          <Link to="/edukasi" className="tombol tombol--emas">
            Pelajari instrumen {Ikon.panah}
          </Link>
        </div>
      </div>
    </div>
  )
}