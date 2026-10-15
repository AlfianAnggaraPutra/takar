// Teks tampilan untuk halaman Konsultasi dan Hasil. Angka perhitungan ada di basisPengetahuan.js,
// file ini hanya berisi kata-kata yang dibaca pengguna.

export const LABEL_RISIKO = ['', 'Sangat rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat tinggi']

// Pekerjaan yang bisa dipilih di formulir data diri.
export const DAFTAR_PEKERJAAN = [
  'Pelajar atau Mahasiswa',
  'Karyawan Swasta',
  'Pegawai Negeri, BUMN, TNI, atau Polri',
  'Guru atau Dosen',
  'Wirausaha',
  'Profesional atau Freelancer',
  'Ibu Rumah Tangga',
  'Pensiunan',
  'Belum Bekerja',
  'Lainnya',
]

// Empat langkah pengisian, masing-masing tepat 10 pernyataan. Urutan tampil SAMA dengan urutan kode
// indikator di Excel (E1 sampai E40), supaya saat contoh kasus diinput ulang, nomor pernyataan di layar
// sama dengan nomor indikatornya. Pengelompokan di bawah hanya judul topik, bukan perubahan urutan.
// Uji uji/ujiMesinInferensi.mjs memastikan urutannya benar-benar E1, E2, ..., E40.
const rentang = (dari, sampai) => Array.from({ length: sampai - dari + 1 }, (_, n) => `E${dari + n}`)

export const LANGKAH_KONSULTASI = [
  {
    judul: 'Modal, usia, dan jangka waktu',
    kelompok: [
      { judul: 'Modal dan usia', kode: rentang(1, 6) },
      { judul: 'Jangka waktu dan rasa tenang', kode: rentang(7, 10) },
    ],
  },
  {
    judul: 'Sikap terhadap risiko dan tujuan',
    kelompok: [
      { judul: 'Sikap terhadap risiko', kode: rentang(11, 16) },
      { judul: 'Tujuan berinvestasi', kode: rentang(17, 20) },
    ],
  },
  {
    judul: 'Tujuan, pengalaman, dan pengelolaan',
    kelompok: [
      { judul: 'Tujuan berinvestasi', kode: rentang(21, 22) },
      { judul: 'Pengalaman dan pemahaman', kode: rentang(23, 28) },
      { judul: 'Cara mengelola investasi', kode: rentang(29, 30) },
    ],
  },
  {
    judul: 'Pengelolaan, likuiditas, dan keuangan',
    kelompok: [
      { judul: 'Cara mengelola investasi', kode: rentang(31, 33) },
      { judul: 'Likuiditas dan dana terkunci', kode: rentang(34, 36) },
      { judul: 'Keamanan dana dan kondisi keuangan', kode: rentang(37, 40) },
    ],
  },
]
export const JUMLAH_PER_LANGKAH = 10

export const URAIAN_PROFIL = {
  H1: {
    warna: 'teal',
    julukan: 'Penjaga dana pokok',
    ringkasan:
      'Anda lebih tenang ketika uang yang ditanam tetap utuh. Hasil kecil yang pasti terasa lebih berharga daripada peluang besar yang penuh ketidakpastian, dan Anda ingin dana mudah diambil ketika sewaktu-waktu dibutuhkan.',
    ciri: [
      'Penurunan nilai investasi, sekecil apa pun, cepat membuat Anda gelisah',
      'Keamanan dana pokok lebih penting daripada imbal hasil tinggi',
      'Anda butuh dana yang mudah dicairkan kapan saja',
    ],
    saran:
      'Mulailah dari instrumen yang nilainya stabil. Setelah pengalaman Anda bertambah, porsi instrumen lain bisa ditambah sedikit demi sedikit.',
  },
  H2: {
    warna: 'emas',
    julukan: 'Penyeimbang',
    ringkasan:
      'Anda bersedia menerima naik turunnya nilai investasi selama imbal hasilnya sepadan. Anda tidak mengejar keuntungan setinggi mungkin, tetapi juga tidak ingin uang Anda hanya diam.',
    ciri: [
      'Nyaman membiarkan dana berjalan beberapa tahun',
      'Menimbang keamanan dan pertumbuhan secara berimbang',
      'Mau meluangkan waktu untuk mengevaluasi investasi secara berkala',
    ],
    saran:
      'Bagi dana ke beberapa instrumen supaya penurunan di satu tempat tidak menggerus keseluruhan, dan tinjau komposisinya secara berkala.',
  },
  H3: {
    warna: 'terakota',
    julukan: 'Pengejar pertumbuhan',
    ringkasan:
      'Anda memandang risiko sebagai bagian dari peluang. Anda siap menahan penurunan nilai dalam jangka pendek demi pertumbuhan jangka panjang, dan Anda senang mengamati serta belajar dari pasar.',
    ciri: [
      'Tetap tenang ketika pasar bergejolak',
      'Berorientasi jangka panjang dan siap mengunci dana',
      'Punya pengalaman atau semangat belajar yang tinggi',
    ],
    saran:
      'Tetap sisakan dana aman dan sebarkan ke beberapa instrumen. Risiko tinggi sebaiknya tetap dikendalikan, bukan dihindari sepenuhnya.',
  },
}

// Keterangan singkat tiap instrumen. Kuncinya sama dengan nama di REKOMENDASI_INSTRUMEN.
export const KETERANGAN_INSTRUMEN = {
  'Deposito Bank': {
    risiko: 1,
    uraian: 'Simpanan berjangka dengan bunga yang sudah diketahui sejak awal. Dana baru bisa dicairkan saat jatuh tempo.',
  },
  'Reksa Dana Pasar Uang': {
    risiko: 1,
    uraian: 'Dana ditempatkan di deposito dan surat utang jangka pendek, nilainya relatif stabil dan mudah dicairkan.',
  },
  Emas: {
    risiko: 2,
    uraian: 'Sejak lama dipakai untuk menjaga nilai terhadap inflasi. Harganya bisa naik turun dalam jangka pendek, tetapi cenderung terjaga dalam jangka panjang.',
  },
  'Reksa Dana Pendapatan Tetap': {
    risiko: 2,
    uraian: 'Sebagian besar isinya obligasi dan surat utang. Potensi hasilnya lebih tinggi dari deposito dengan risiko yang masih terukur.',
  },
  'Reksa Dana Campuran': {
    risiko: 3,
    uraian: 'Dibagi ke saham, obligasi, dan pasar uang. Cocok untuk menjaga keseimbangan antara pertumbuhan dan keamanan.',
  },
  'Reksa Dana Saham': {
    risiko: 4,
    uraian: 'Sebagian besar isinya saham dan dikelola manajer investasi. Potensi hasilnya tinggi, begitu pula risiko naik turunnya.',
  },
  Saham: {
    risiko: 5,
    uraian: 'Kepemilikan atas perusahaan yang tercatat di bursa. Peluang untung dari selisih harga dan dividen, dengan nilai yang bisa berubah tajam.',
  },
}