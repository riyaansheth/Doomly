import { createBrowserClient } from '@supabase/ssr'

export const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const browserClient = () => createBrowserClient(URL, ANON)
