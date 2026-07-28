import { createClient } from '@supabase/supabase-js'

// Fallbacks so the build works anywhere (the anon key is public by design;
// data is protected server-side by RLS).
const FALLBACK_URL = 'https://dosstciaduzecqfkqoqj.supabase.co'
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvc3N0Y2lhZHV6ZWNxZmtxb3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzM5MDQsImV4cCI6MjEwMDgwOTkwNH0.htMw7ecQ8MiEB8utk2Wh8y3T2M0P-le0j_4AJlLjwks'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'dayofcash.auth',
  },
})
