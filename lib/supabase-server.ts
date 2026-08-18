// Separate from lib/supabase.ts because next/headers cannot be reached from
// anything a Client Component imports.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { URL, ANON } from './supabase'

export async function serverClient() {
  const store = await cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Throws in Server Components; middleware handles the refresh there.
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)) } catch {}
      },
    },
  })
}
