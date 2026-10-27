// Basis pengetahuan TAKAR. Seluruh angka di file ini diambil langsung dari
// DATA_SEKRISPI_ALFIAN.xlsx (sheet INFORMASI dan DATA & BOBOT PAKAR) dan
// bersifat tetap. Jangan diubah lewat antarmuka; ubah hanya bila pakar
// memang merevisi bobotnya, lalu hitung ulang contoh kasus di Bab IV.

// Profil risiko (hipotesis).
export const DAFTAR_PROFIL = [
  { kode: 'H1', nama: 'Konservatif' },
  { kode: 'H2', nama: 'Moderat' },
  { kode: 'H3', nama: 'Agresif' },
]

// Probabilitas prior P(Hj), bobot awal dari pakar. Prior adalah distribusi peluang atas seluruh hipotesis
// (tiga profil yang saling lepas), sehingga jumlahnya harus tepat 1: 0,55 + 0,35 + 0,10 = 1.
export const PROBABILITAS_PRIOR = {
  "H1": 0.55,
  "H2": 0.35,
  "H3": 0.10
}

// Parameter koreksi Laplace: n = jumlah sampel pakar, k = jumlah kelas.
export const PARAMETER_LAPLACE = { n: 100, k: 2 }

// Skala keyakinan pengguna (Certainty Factor).
export const PILIHAN_JAWABAN = [
  { label: 'Tidak', nilai: 0 },
  { label: 'Sedikit Sesuai', nilai: 0.4 },
  { label: 'Cukup Sesuai', nilai: 0.6 },
  { label: 'Sesuai', nilai: 0.8 },
  { label: 'Sangat Sesuai', nilai: 1 },
]

// 40 indikator. likelihood = P(Ei|Hj) awal dari pakar, sebelum koreksi Laplace.
export const DAFTAR_INDIKATOR = [
  { kode: 'E1', nama: "Preferensi modal kecil",
    pertanyaan: "Saya merasa lebih nyaman memulai investasi dengan modal yang kecil terlebih dahulu agar potensi kerugian yang saya tanggung tidak terlalu memberatkan",
    likelihood: { H1: 0.85, H2: 0.5, H3: 0.15 } },
  { kode: 'E2', nama: "Kesiapan modal menengah",
    pertanyaan: "Saya merasa sudah memiliki dana yang cukup untuk mulai berinvestasi di luar kebutuhan hidup sehari-hari tanpa mengganggu keuangan pribadi saya",
    likelihood: { H1: 0.55, H2: 0.75, H3: 0.5 } },
  { kode: 'E3', nama: "Kesediaan alokasi modal besar",
    pertanyaan: "Saya bersedia mengalokasikan dana dalam jumlah yang cukup besar untuk investasi karena saya meyakini potensi keuntungan jangka panjangnya",
    likelihood: { H1: 0, H2: 0.4, H3: 0.85 } },
  { kode: 'E4', nama: "Kesiapan investasi usia muda",
    pertanyaan: "Saya merasa usia muda adalah waktu yang paling ideal untuk mulai berinvestasi karena masih tersedia banyak waktu untuk belajar dan memulihkan kerugian",
    likelihood: { H1: 0.4, H2: 0.55, H3: 0.7 } },
  { kode: 'E5', nama: "Kesadaran investasi usia produktif",
    pertanyaan: "Saya merasa saat ini adalah momentum yang tepat untuk berinvestasi secara serius karena kondisi penghasilan dan karier saya sudah mulai stabil",
    likelihood: { H1: 0.5, H2: 0.8, H3: 0.45 } },
  { kode: 'E6', nama: "Urgensi investasi menjelang pensiun",
    pertanyaan: "Saya merasa perlu segera mengamankan dan mengoptimalkan investasi saya karena masa pensiun sudah semakin dekat dan waktu terus berjalan",
    likelihood: { H1: 0.8, H2: 0.5, H3: 0.05 } },
  { kode: 'E7', nama: "Orientasi jangka pendek",
    pertanyaan: "Saya berencana menggunakan hasil investasi dalam waktu dekat sehingga saya membutuhkan instrumen yang mudah dicairkan kapan saja tanpa sanksi",
    likelihood: { H1: 0.8, H2: 0.35, H3: 0 } },
  { kode: 'E8', nama: "Orientasi jangka menengah",
    pertanyaan: "Saya merasa nyaman membiarkan investasi saya berjalan selama beberapa tahun ke depan sebelum mulai menikmati hasilnya secara bertahap",
    likelihood: { H1: 0.45, H2: 0.85, H3: 0.5 } },
  { kode: 'E9', nama: "Orientasi jangka panjang",
    pertanyaan: "Saya bersedia tidak menyentuh dana investasi saya dalam jangka waktu yang sangat panjang karena saya yakin hasilnya akan jauh lebih optimal",
    likelihood: { H1: 0.2, H2: 0.5, H3: 0.9 } },
  { kode: 'E10', nama: "Kekhawatiran saat nilai turun",
    pertanyaan: "Saya merasa khawatir dan tidak tenang ketika nilai investasi saya mengalami penurunan meskipun penurunan tersebut hanya bersifat sementara",
    likelihood: { H1: 0.9, H2: 0.45, H3: 0.1 } },
  { kode: 'E11', nama: "Kesediaan ambil risiko tinggi",
    pertanyaan: "Saya bersedia mengambil risiko investasi yang lebih tinggi karena saya percaya peluang keuntungan besar selalu datang beriringan dengan risiko yang sepadan",
    likelihood: { H1: 0, H2: 0.55, H3: 0.9 } },
  { kode: 'E12', nama: "Preferensi hasil stabil dan pasti",
    pertanyaan: "Saya jauh lebih tenang dengan investasi yang memberikan imbal hasil kecil namun konsisten dibandingkan investasi yang menjanjikan keuntungan besar namun tidak menentu",
    likelihood: { H1: 0.9, H2: 0.5, H3: 0.1 } },
  { kode: 'E13', nama: "Respons panik saat merugi",
    pertanyaan: "Apabila investasi saya mengalami kerugian yang cukup signifikan, dorongan pertama saya adalah segera menarik dana dan beralih ke instrumen yang lebih aman",
    likelihood: { H1: 0.85, H2: 0.4, H3: 0.1 } },
  { kode: 'E14', nama: "Ketahanan menghadapi volatilitas",
    pertanyaan: "Saya mampu tetap tenang dan tidak terburu-buru mengambil keputusan meskipun pasar sedang bergejolak dan nilai investasi saya berfluktuasi tajam",
    likelihood: { H1: 0.1, H2: 0.6, H3: 0.9 } },
  { kode: 'E15', nama: "Penerimaan risiko demi imbal tinggi",
    pertanyaan: "Saya percaya bahwa untuk memperoleh keuntungan investasi yang benar-benar signifikan, saya harus siap menerima kemungkinan mengalami kerugian yang sama besarnya",
    likelihood: { H1: 0, H2: 0.45, H3: 0.85 } },
  { kode: 'E16', nama: "Kenyamanan dengan ketidakpastian",
    pertanyaan: "Saya merasa tidak masalah dengan ketidakpastian hasil investasi karena bagi saya proses belajar dari pengalaman investasi itu sendiri sudah sangat berharga",
    likelihood: { H1: 0.1, H2: 0.55, H3: 0.85 } },
  { kode: 'E17', nama: "Tujuan lindung nilai inflasi",
    pertanyaan: "Saya berinvestasi terutama karena ingin memastikan nilai uang saya tidak tergerus inflasi sehingga daya beli saya tetap terjaga di masa depan",
    likelihood: { H1: 0.75, H2: 0.6, H3: 0.25 } },
  { kode: 'E18', nama: "Tujuan dana darurat",
    pertanyaan: "Saya berinvestasi dengan prioritas memiliki cadangan dana yang bisa diakses dengan cepat dan mudah ketika situasi mendesak atau darurat tiba-tiba terjadi",
    likelihood: { H1: 0.85, H2: 0.4, H3: 0 } },
  { kode: 'E19', nama: "Tujuan dana pendidikan atau keluarga",
    pertanyaan: "Saya berinvestasi dengan tujuan menyiapkan dana untuk kebutuhan besar keluarga di masa mendatang seperti biaya pendidikan anak atau pernikahan",
    likelihood: { H1: 0.65, H2: 0.75, H3: 0.3 } },
  { kode: 'E20', nama: "Tujuan dana pensiun",
    pertanyaan: "Saya berinvestasi dengan tujuan utama membangun aset yang cukup untuk memenuhi seluruh kebutuhan hidup saya secara mandiri di masa pensiun kelak",
    likelihood: { H1: 0.7, H2: 0.75, H3: 0.4 } },
  { kode: 'E21', nama: "Tujuan pertumbuhan kekayaan agresif",
    pertanyaan: "Saya berinvestasi dengan ambisi yang jelas untuk menumbuhkan kekayaan secara signifikan dan menjadikan investasi sebagai sumber penghasilan utama di masa depan",
    likelihood: { H1: 0, H2: 0.45, H3: 0.9 } },
  { kode: 'E22', nama: "Tujuan diversifikasi aset",
    pertanyaan: "Saya berinvestasi untuk menyebarkan aset saya ke berbagai instrumen yang berbeda sehingga kekayaan saya tidak bergantung hanya pada satu sumber saja",
    likelihood: { H1: 0.5, H2: 0.8, H3: 0.6 } },
  { kode: 'E23', nama: "Pengalaman minim investasi",
    pertanyaan: "Saya masih sangat baru di dunia investasi dan belum pernah mencoba instrumen investasi apapun sebelumnya",
    likelihood: { H1: 0.7, H2: 0.35, H3: 0 } },
  { kode: 'E24', nama: "Pengalaman investasi berisiko rendah",
    pertanyaan: "Saya sudah pernah berinvestasi di instrumen yang relatif aman dan likuid seperti deposito, tabungan berjangka, atau reksa dana pasar uang",
    likelihood: { H1: 0.75, H2: 0.6, H3: 0.2 } },
  { kode: 'E25', nama: "Pengalaman investasi berisiko menengah",
    pertanyaan: "Saya sudah pernah berinvestasi di instrumen dengan tingkat risiko menengah seperti reksa dana campuran atau obligasi",
    likelihood: { H1: 0.2, H2: 0.8, H3: 0.5 } },
  { kode: 'E26', nama: "Pengalaman investasi berisiko tinggi",
    pertanyaan: "Saya sudah terbiasa berinvestasi di instrumen berisiko tinggi seperti saham, reksa dana saham, atau instrumen pasar modal lainnya",
    likelihood: { H1: 0, H2: 0.4, H3: 0.9 } },
  { kode: 'E27', nama: "Kemampuan analisis mandiri",
    pertanyaan: "Saya merasa mampu menganalisis dan mengevaluasi potensi suatu instrumen investasi secara mandiri tanpa harus bergantung pada rekomendasi orang lain",
    likelihood: { H1: 0.15, H2: 0.5, H3: 0.85 } },
  { kode: 'E28', nama: "Pemahaman konsep risiko dan imbal hasil",
    pertanyaan: "Saya memahami dengan baik bahwa setiap instrumen investasi memiliki tingkat risiko dan potensi imbal hasil yang berbeda-beda dan saling berkaitan",
    likelihood: { H1: 0.55, H2: 0.75, H3: 0.85 } },
  { kode: 'E29', nama: "Preferensi investasi pasif",
    pertanyaan: "Saya lebih menyukai investasi yang tidak perlu saya pantau setiap saat dan cukup saya biarkan berkembang secara otomatis tanpa banyak intervensi",
    likelihood: { H1: 0.8, H2: 0.55, H3: 0.1 } },
  { kode: 'E30', nama: "Kesediaan pantau berkala",
    pertanyaan: "Saya bersedia meluangkan waktu setiap bulan untuk mengevaluasi kinerja investasi saya dan mempertimbangkan penyesuaian bila diperlukan",
    likelihood: { H1: 0.35, H2: 0.8, H3: 0.55 } },
  { kode: 'E31', nama: "Keinginan kelola aktif harian",
    pertanyaan: "Saya menikmati proses mengamati pergerakan pasar setiap hari dan secara aktif mengambil keputusan untuk membeli atau menjual instrumen investasi",
    likelihood: { H1: 0, H2: 0.2, H3: 0.85 } },
  { kode: 'E32', nama: "Preferensi delegasi ke profesional",
    pertanyaan: "Saya lebih percaya dan merasa lebih aman menyerahkan pengelolaan investasi kepada manajer investasi atau penasihat keuangan profesional yang berpengalaman",
    likelihood: { H1: 0.7, H2: 0.55, H3: 0.15 } },
  { kode: 'E33', nama: "Keinginan belajar terus menerus",
    pertanyaan: "Saya antusias untuk terus belajar dan mengembangkan pengetahuan investasi saya agar dapat membuat keputusan yang semakin baik dari waktu ke waktu",
    likelihood: { H1: 0.4, H2: 0.7, H3: 0.9 } },
  { kode: 'E34', nama: "Kebutuhan likuiditas tinggi",
    pertanyaan: "Saya perlu memastikan sebagian dana investasi saya tetap mudah dicairkan kapan saja karena saya tidak bisa memprediksi kapan saya akan membutuhkannya",
    likelihood: { H1: 0.85, H2: 0.45, H3: 0.15 } },
  { kode: 'E35', nama: "Kenyamanan dana terkunci menengah",
    pertanyaan: "Saya merasa nyaman apabila dana investasi saya tidak bisa dicairkan selama beberapa tahun asalkan imbal hasil yang ditawarkan cukup menarik",
    likelihood: { H1: 0.3, H2: 0.75, H3: 0.55 } },
  { kode: 'E36', nama: "Kesediaan dana terkunci jangka panjang",
    pertanyaan: "Saya bersedia mengunci dana investasi saya dalam jangka waktu yang sangat panjang karena saya tidak membutuhkannya dalam waktu dekat",
    likelihood: { H1: 0.15, H2: 0.5, H3: 0.85 } },
  { kode: 'E37', nama: "Prioritas keamanan dana pokok",
    pertanyaan: "Bagi saya, menjaga keamanan dan keutuhan dana pokok yang saya investasikan jauh lebih penting daripada mengejar potensi imbal hasil yang lebih tinggi",
    likelihood: { H1: 0.95, H2: 0.55, H3: 0.1 } },
  { kode: 'E38', nama: "Kestabilan penghasilan",
    pertanyaan: "Saya memiliki sumber penghasilan yang tetap dan stabil setiap bulannya sehingga saya tidak perlu khawatir kebutuhan dasar saya tidak terpenuhi",
    likelihood: { H1: 0.6, H2: 0.75, H3: 0.65 } },
  { kode: 'E39', nama: "Kemampuan menabung dan investasi rutin",
    pertanyaan: "Saya mampu menyisihkan sebagian penghasilan secara rutin setiap bulan khusus untuk keperluan investasi tanpa mengganggu anggaran kebutuhan pokok",
    likelihood: { H1: 0.65, H2: 0.8, H3: 0.7 } },
  { kode: 'E40', nama: "Kebebasan dari tanggungan finansial besar",
    pertanyaan: "Saat ini saya tidak memiliki beban cicilan atau utang besar yang harus dilunasi sehingga saya memiliki keleluasaan finansial untuk berinvestasi",
    likelihood: { H1: 0.55, H2: 0.65, H3: 0.75 } },
]

// Rekomendasi instrumen untuk setiap profil.
export const REKOMENDASI_INSTRUMEN = {
  "H1": [
    "Deposito Bank",
    "Reksa Dana Pasar Uang",
    "Emas"
  ],
  "H2": [
    "Reksa Dana Pendapatan Tetap",
    "Reksa Dana Campuran",
    "Emas"
  ],
  "H3": [
    "Reksa Dana Saham",
    "Saham"
  ]
}