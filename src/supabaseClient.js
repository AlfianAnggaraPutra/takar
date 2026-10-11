import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Bila variabel lingkungan belum diisi (misalnya .env belum dibuat), aplikasi tetap bisa dibuka
// dan halaman yang butuh database menampilkan pesan yang jelas, bukan layar putih.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

if (!supabase) {
  console.warn('Supabase belum dikonfigurasi: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env')
}