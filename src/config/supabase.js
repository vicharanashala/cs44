import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://lzxpxzlsfioxknshbgao.supabase.co'

const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseAnonKey = (envKey && envKey !== 'your_supabase_anon_key_here' && envKey.length > 30) ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eHB4emxzZmlveGtuc2hiZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzY2MTAsImV4cCI6MjA5NTcxMjYxMH0.K-maF1fnvKbh3MK1FbbE0sxFDEYdhBttLGT2ezgIcU0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
})
