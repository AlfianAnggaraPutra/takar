import { useState } from 'react'
import LayarPembuka from './components/LayarPembuka'

function App() {
  const [splashSelesai, setSplashSelesai] = useState(
    () => sessionStorage.getItem('takar_sudah_lihat_splash') === '1'
  )

  const tutupSplash = () => {
    sessionStorage.setItem('takar_sudah_lihat_splash', '1')
    setSplashSelesai(true)
  }

  if (!splashSelesai) {
    return <LayarPembuka onSelesai={tutupSplash} />
  }

  return <div>Halaman utama TAKAR (nanti diganti komponen beranda sungguhan)</div>
}

export default App