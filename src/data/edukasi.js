// Isi halaman Edukasi, dan daftar instrumen yang juga dipakai Beranda.
// Teks diubah di sini, tidak perlu menyentuh JSX.
//
// Penjelasan di sini bersifat umum dan edukatif. Pemetaan profil ke instrumen mengikuti basis
// pengetahuan TAKAR (sama dengan halaman hasil konsultasi).

export const LABEL_RISIKO = ['', 'Sangat rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat tinggi']

// Warna aksen mengikuti tingkat risiko: teal untuk yang tenang, emas untuk menengah, terakota untuk yang berani.
export const warnaRisiko = (risiko) => (risiko <= 2 ? 'teal' : risiko === 3 ? 'emas' : 'terakota')

export const DAFTAR_INSTRUMEN = [
  {
    slug: 'deposito-bank',
    nama: 'Deposito Bank',
    ikon: 'deposito',
    risiko: 1,
    profil: ['konservatif'],
    ringkas: 'Uang disimpan di bank untuk jangka waktu tertentu, dengan bunga yang sudah diketahui sejak hari pertama.',
    cara: 'Anda memilih tenor, misalnya 1, 3, 6, atau 12 bulan. Selama tenor berjalan, bunga yang dijanjikan tidak berubah walaupun suku bunga di pasar naik atau turun. Saat jatuh tempo, pokok dan bunga bisa diambil atau diperpanjang.',
    kelebihan: 'Hasilnya pasti dan mudah dihitung. Simpanan di bank dijamin LPS sampai batas tertentu, selama memenuhi syarat penjaminan.',
    risikoUtama: 'Risikonya bukan nilai yang turun, melainkan nilai yang kalah dari inflasi. Bila bunga lebih kecil dari kenaikan harga barang, daya beli uang Anda sebenarnya menyusut pelan-pelan.',
    cair: 'Saat jatuh tempo',
    cairCatatan: 'Dicairkan sebelum waktunya biasanya terkena penalti.',
    horizon: 'Sesuai tenor, umumnya 1 sampai 12 bulan',
    cocokUntuk: 'Dana yang pasti dipakai dalam waktu dekat, atau bagian aman dari portofolio Anda.',
    periksa: ['Besar bunga dan pajak yang dikenakan', 'Aturan dan penalti pencairan sebelum jatuh tempo', 'Apakah bank tersebut dijamin LPS dan bunganya masih di bawah batas penjaminan'],
  },
  {
    slug: 'reksa-dana-pasar-uang',
    nama: 'Reksa Dana Pasar Uang',
    ikon: 'pasarUang',
    risiko: 1,
    profil: ['konservatif'],
    ringkas: 'Uang Anda digabung dengan uang investor lain, lalu dikelola manajer investasi di instrumen jangka pendek.',
    cara: 'Isinya umumnya deposito dan surat utang yang jatuh tempo kurang dari satu tahun. Karena isinya berumur pendek, nilai per unitnya (NAB) cenderung naik pelan dan jarang bergejolak.',
    kelebihan: 'Lebih fleksibel dari deposito karena bisa dicairkan kapan saja tanpa menunggu jatuh tempo. Modal awalnya pun relatif kecil.',
    risikoUtama: 'Bukan simpanan, jadi tidak dijamin LPS. NAB tetap bisa turun tipis, misalnya saat ada gangguan di pasar atau penerbit surat utang bermasalah.',
    cair: 'Beberapa hari kerja',
    cairCatatan: 'Lamanya bergantung pada aturan produk dan penyedia.',
    horizon: 'Kurang dari 1 tahun',
    cocokUntuk: 'Dana darurat atau dana yang perlu mudah diambil, tetapi tidak ingin hanya diam di tabungan.',
    periksa: ['Izin manajer investasi dan agen penjual di OJK', 'Biaya pembelian, pencairan, dan pengelolaan', 'Batas waktu pengajuan pencairan agar dana cair sesuai kebutuhan'],
  },
  {
    slug: 'emas',
    nama: 'Emas',
    ikon: 'emas',
    risiko: 2,
    profil: ['konservatif', 'moderat'],
    ringkas: 'Logam mulia yang sejak lama dipakai orang untuk menyimpan nilai, terutama saat harga barang naik.',
    cara: 'Anda bisa membeli emas batangan, menabung emas lewat penyedia resmi, atau membeli emas digital. Harga emas mengikuti harga di pasar dunia dan nilai tukar rupiah, jadi bisa berubah setiap hari.',
    kelebihan: 'Cenderung menjaga daya beli dalam jangka panjang dan tidak bergantung pada kinerja satu perusahaan.',
    risikoUtama: 'Harga bisa turun berbulan-bulan. Ada selisih antara harga beli dan harga jual, dan emas tidak memberi bunga atau dividen. Emas fisik juga perlu disimpan dengan aman.',
    cair: 'Mudah, tetapi ada selisih harga',
    cairCatatan: 'Menjual cepat berarti menerima harga jual kembali, bukan harga beli.',
    horizon: 'Menengah sampai panjang, 3 tahun atau lebih',
    cocokUntuk: 'Pelindung nilai di samping instrumen lain, bukan satu-satunya tempat menaruh dana.',
    periksa: ['Selisih harga beli dan harga jual', 'Penyedia emas digital atau tabungan emas terdaftar dan diawasi regulator', 'Biaya cetak, simpan, atau administrasi'],
  },
  {
    slug: 'reksa-dana-pendapatan-tetap',
    nama: 'Reksa Dana Pendapatan Tetap',
    ikon: 'obligasi',
    risiko: 2,
    profil: ['moderat'],
    ringkas: 'Reksa dana yang sebagian besar isinya obligasi dan surat utang lain.',
    cara: 'Minimal 80 persen dananya ditaruh di surat utang. Hasilnya datang dari bunga (kupon) obligasi dan dari naik turunnya harga obligasi itu sendiri.',
    kelebihan: 'Potensi hasilnya biasanya lebih tinggi dari deposito dan reksa dana pasar uang, dengan gejolak yang masih lebih ringan dari saham.',
    risikoUtama: 'Saat suku bunga naik, harga obligasi cenderung turun, dan NAB ikut tertekan. Ada juga risiko penerbit surat utang gagal membayar.',
    cair: 'Beberapa hari kerja',
    cairCatatan: 'Dalam kondisi pasar tertekan, nilai pencairan bisa lebih rendah dari yang diharapkan.',
    horizon: 'Menengah, 1 sampai 3 tahun atau lebih',
    cocokUntuk: 'Yang ingin hasil di atas deposito dan sanggup melihat nilai sesekali turun.',
    periksa: ['Komposisi isi portofolio dan peringkat penerbit surat utangnya', 'Kinerja produk dalam beberapa tahun terakhir, bukan hanya beberapa bulan', 'Biaya pengelolaan dan biaya pencairan'],
  },
  {
    slug: 'reksa-dana-campuran',
    nama: 'Reksa Dana Campuran',
    ikon: 'campuran',
    risiko: 3,
    profil: ['moderat'],
    ringkas: 'Reksa dana yang isinya dibagi ke saham, obligasi, dan pasar uang sekaligus.',
    cara: 'Manajer investasi menggeser porsi tiap aset sesuai kondisi pasar. Saat saham terlihat mahal, porsinya bisa dikurangi, dan sebaliknya.',
    kelebihan: 'Satu produk sudah berisi beberapa jenis aset, jadi Anda tidak perlu membagi dana sendiri.',
    risikoUtama: 'Hasilnya sangat bergantung pada keputusan manajer investasi. Porsi saham yang cukup besar membuat NAB bisa turun cukup dalam saat pasar jatuh.',
    cair: 'Beberapa hari kerja',
    cairCatatan: 'Sama seperti reksa dana lain, ada jeda sampai dana masuk ke rekening.',
    horizon: 'Menengah sampai panjang, 3 tahun atau lebih',
    cocokUntuk: 'Yang ingin tumbuh tetapi belum siap penuh di saham, dan mau menyerahkan pengaturan komposisinya.',
    periksa: ['Batas porsi saham dan obligasi yang tertulis di prospektus', 'Rekam jejak manajer investasi', 'Biaya pengelolaan, karena umumnya lebih tinggi dari reksa dana pasar uang'],
  },
  {
    slug: 'reksa-dana-saham',
    nama: 'Reksa Dana Saham',
    ikon: 'sahamKelola',
    risiko: 4,
    profil: ['agresif'],
    ringkas: 'Reksa dana yang sebagian besar isinya saham, dikelola oleh manajer investasi.',
    cara: 'Minimal 80 persen dananya ditaruh di saham, jadi Anda ikut memiliki banyak perusahaan sekaligus tanpa harus memilih satu per satu.',
    kelebihan: 'Potensi hasilnya tertinggi di antara jenis reksa dana, dan risikonya lebih tersebar daripada membeli satu saham.',
    risikoUtama: 'NAB bisa turun dalam dan lama saat pasar saham lesu. Hasil masa lalu tidak menjamin hasil ke depan.',
    cair: 'Beberapa hari kerja',
    cairCatatan: 'Menjual saat pasar sedang turun berarti mengunci kerugian.',
    horizon: 'Panjang, 5 tahun atau lebih',
    cocokUntuk: 'Dana jangka panjang yang tidak akan dipakai dalam waktu dekat, dan pemiliknya tenang saat nilainya turun.',
    periksa: ['Isi portofolio dan sebaran sektornya', 'Rekam jejak produk melewati masa pasar naik dan pasar turun', 'Biaya pengelolaan serta biaya penjualan kembali'],
  },
  {
    slug: 'saham',
    nama: 'Saham',
    ikon: 'saham',
    risiko: 5,
    profil: ['agresif'],
    ringkas: 'Bukti kepemilikan atas sebagian perusahaan yang tercatat di Bursa Efek Indonesia.',
    cara: 'Anda membeli lewat perusahaan sekuritas. Satuan minimal pembelian adalah 1 lot, atau 100 lembar. Untung bisa datang dari selisih harga jual dan beli, dan dari dividen bila perusahaan membagikannya.',
    kelebihan: 'Potensi pertumbuhan tertinggi dalam jangka panjang, dan Anda sendiri yang memilih perusahaan mana yang ingin dimiliki.',
    risikoUtama: 'Harga bisa turun tajam dalam waktu singkat, dan perusahaan bisa bermasalah. Memilih saham juga butuh waktu untuk mempelajari kondisi perusahaannya.',
    cair: 'Bisa dijual saat bursa buka',
    cairCatatan: 'Saham yang sepi peminat sulit dijual pada harga yang diinginkan.',
    horizon: 'Panjang, 5 tahun atau lebih',
    cocokUntuk: 'Yang punya waktu belajar, tahan melihat nilai turun, dan sudah memiliki dana aman terpisah.',
    periksa: ['Kondisi keuangan dan arah bisnis perusahaannya', 'Perusahaan sekuritas berizin dan terdaftar sebagai anggota bursa', 'Seberapa besar porsi saham terhadap seluruh dana Anda'],
  },
]

export const DAFTAR_PROFIL = [
  {
    slug: 'konservatif',
    kode: 'H1',
    nama: 'Konservatif',
    julukan: 'Penjaga dana pokok',
    warna: 'teal',
    ikon: 'perisai',
    pembuka: 'Bagi Anda, uang yang tetap utuh lebih berharga daripada peluang untung besar yang belum pasti.',
    baris: [
      { judul: 'Saat nilai turun 10 persen', isi: 'Gelisah dan ingin segera menarik dana, bahkan sebelum tahu penyebabnya.' },
      { judul: 'Yang paling dicari', isi: 'Kepastian dan kemudahan mengambil dana kapan saja dibutuhkan.' },
      { judul: 'Jangka waktu yang nyaman', isi: 'Pendek sampai menengah.' },
      { judul: 'Yang perlu diwaspadai', isi: 'Terlalu aman juga ada harganya. Hasil yang kecil bisa kalah dari inflasi bila dibiarkan bertahun-tahun.' },
    ],
    instrumen: ['deposito-bank', 'reksa-dana-pasar-uang', 'emas'],
  },
  {
    slug: 'moderat',
    kode: 'H2',
    nama: 'Moderat',
    julukan: 'Penyeimbang',
    warna: 'emas',
    ikon: 'timbang',
    pembuka: 'Anda mau menerima nilai yang naik turun, asalkan hasilnya sepadan dan tidak berlebihan.',
    baris: [
      { judul: 'Saat nilai turun 10 persen', isi: 'Tidak nyaman, tetapi bisa menunggu sambil mengecek apakah alasan awal berinvestasi masih berlaku.' },
      { judul: 'Yang paling dicari', isi: 'Keseimbangan antara keamanan dan pertumbuhan.' },
      { judul: 'Jangka waktu yang nyaman', isi: 'Menengah.' },
      { judul: 'Yang perlu diwaspadai', isi: 'Mudah ragu di tengah jalan. Sering berpindah-pindah instrumen biasanya malah menggerus hasil.' },
    ],
    instrumen: ['emas', 'reksa-dana-pendapatan-tetap', 'reksa-dana-campuran'],
  },
  {
    slug: 'agresif',
    kode: 'H3',
    nama: 'Agresif',
    julukan: 'Pengejar pertumbuhan',
    warna: 'terakota',
    ikon: 'naik',
    pembuka: 'Anda melihat risiko sebagai bagian dari peluang dan siap menanggungnya demi pertumbuhan yang lebih besar.',
    baris: [
      { judul: 'Saat nilai turun 10 persen', isi: 'Tetap tenang, melihatnya sebagai bagian dari perjalanan, bahkan mempertimbangkan menambah.' },
      { judul: 'Yang paling dicari', isi: 'Pertumbuhan jangka panjang setinggi yang masuk akal.' },
      { judul: 'Jangka waktu yang nyaman', isi: 'Panjang, dengan dana yang siap dikunci bertahun-tahun.' },
      { judul: 'Yang perlu diwaspadai', isi: 'Semua dana di satu tempat. Tanpa dana aman terpisah, pasar yang turun bisa memaksa Anda menjual di saat yang paling merugikan.' },
    ],
    instrumen: ['reksa-dana-saham', 'saham'],
  },
]

export const PERSIAPAN = [
  {
    judul: 'Siapkan dana darurat dulu',
    isi: 'Simpan cadangan untuk beberapa bulan pengeluaran di tempat yang mudah diambil. Dengan begitu, investasi Anda tidak perlu dijual paksa ketika ada kebutuhan mendadak.',
    ikon: 'bantal',
  },
  {
    judul: 'Selesaikan utang yang berbunga mahal',
    isi: 'Bunga kartu kredit atau pinjaman online hampir pasti lebih besar daripada hasil investasi mana pun. Melunasinya lebih dulu sering kali langkah paling menguntungkan.',
    ikon: 'rantai',
  },
  {
    judul: 'Tentukan tujuan dan waktunya',
    isi: 'Uang untuk tahun depan dan uang untuk pensiun butuh tempat yang berbeda. Semakin dekat waktu pakainya, semakin sedikit alasan menaruhnya di instrumen yang naik turun.',
    ikon: 'sasaran',
  },
  {
    judul: 'Pastikan penyedianya berizin',
    isi: 'Cek apakah bank, manajer investasi, sekuritas, atau penyedia emas digital terdaftar dan diawasi OJK. Hasil yang dijanjikan pasti dan sangat tinggi adalah tanda untuk berhati-hati.',
    ikon: 'izin',
  },
]

export const ISTILAH = [
  { istilah: 'Imbal hasil', arti: 'Keuntungan dari investasi, biasanya dinyatakan dalam persen per tahun.' },
  { istilah: 'Risiko', arti: 'Kemungkinan hasil yang Anda terima berbeda dari yang diharapkan, termasuk kemungkinan rugi.' },
  { istilah: 'Volatilitas', arti: 'Seberapa sering dan seberapa jauh harga naik turun. Makin tinggi, makin tidak tenang.' },
  { istilah: 'Likuiditas', arti: 'Seberapa cepat suatu aset bisa diubah jadi uang tunai tanpa kehilangan banyak nilai.' },
  { istilah: 'Diversifikasi', arti: 'Membagi dana ke beberapa tempat supaya satu yang jatuh tidak menyeret semuanya.' },
  { istilah: 'Inflasi', arti: 'Kenaikan harga barang dan jasa dari waktu ke waktu, yang membuat nilai uang berkurang.' },
  { istilah: 'Horizon investasi', arti: 'Lamanya Anda berencana menyimpan dana sebelum dipakai.' },
  { istilah: 'NAB', arti: 'Nilai Aktiva Bersih, harga satu unit reksa dana pada hari tertentu.' },
  { istilah: 'Manajer investasi', arti: 'Perusahaan berizin yang mengelola dana reksa dana atas nama para investornya.' },
  { istilah: 'Obligasi', arti: 'Surat utang. Anda meminjamkan uang kepada penerbit dan menerima bunga secara berkala.' },
  { istilah: 'Dividen', arti: 'Bagian laba perusahaan yang dibagikan kepada pemegang sahamnya.' },
  { istilah: 'Dana darurat', arti: 'Cadangan tunai untuk keperluan mendadak, terpisah dari uang yang diinvestasikan.' },
]

export const KEKELIRUAN = [
  {
    anggapan: 'Reksa dana pasti aman karena dikelola profesional.',
    kenyataan: 'Dikelola ahli tidak berarti dijamin untung. NAB tetap naik turun mengikuti isi portofolionya, dan reksa dana tidak dijamin LPS.',
  },
  {
    anggapan: 'Harga emas pasti naik terus.',
    kenyataan: 'Dalam jangka panjang emas cenderung menjaga nilai, tetapi harganya bisa melemah berbulan-bulan. Selisih harga beli dan jual juga ikut memakan hasil.',
  },
  {
    anggapan: 'Beli saham itu sama saja dengan berjudi.',
    kenyataan: 'Saham adalah kepemilikan atas usaha nyata. Yang mendekati judi adalah membeli tanpa tahu apa yang dibeli, hanya karena ikut-ikutan.',
  },
  {
    anggapan: 'Menunggu uang banyak baru mulai berinvestasi.',
    kenyataan: 'Banyak produk bisa dimulai dengan modal kecil. Yang lebih menentukan adalah kebiasaan menyisihkan dana secara rutin dan lamanya waktu.',
  },
  {
    anggapan: 'Profil risiko saya akan sama selamanya.',
    kenyataan: 'Usia, tanggungan, penghasilan, dan pengalaman berubah, begitu juga rasa nyaman terhadap risiko. Ukur ulang ketika hidup Anda berubah besar.',
  },
]