import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Must await: the redirect response is built as soon as this returns, so an
  // un-awaited exchange loses the session cookies it was trying to write.
  if (code) {
    const { error } = await (await serverClient()).auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(error.message)}`)
    return NextResponse.redirect(origin)
  }

  // Supabase reports its own failures (expired link, denied) on the query string.
  const err = searchParams.get('error_description') ?? searchParams.get('error')
  return NextResponse.redirect(err ? `${origin}/?authError=${encodeURIComponent(err)}` : origin)
}
