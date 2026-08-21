'use client'
import { useEffect, useState } from 'react'

// Web push wants the key as bytes, not base64url.
const toBytes = (base64url: string) => {
  const b64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export default function PushToggle() {
  const [state, setState] = useState<'off' | 'on' | 'unsupported' | 'blocked' | 'working'>('off')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setState('unsupported')
    if (Notification.permission === 'denied') return setState('blocked')
    navigator.serviceWorker.getRegistration()
      .then((r) => r?.pushManager.getSubscription())
      .then((s) => setState(s ? 'on' : 'off'))
  }, [])

  if (state === 'unsupported') return null
  if (state === 'blocked') return <p className="tag">Notifications are blocked in your browser settings.</p>

  const enable = async () => {
    setState('working')
    try {
      if (await Notification.requestPermission() !== 'granted') return setState('blocked')
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub),
      })
      setState(res.ok ? 'on' : 'off')
    } catch {
      setState('off')
    }
  }

  return state === 'on'
    ? <span className="tag">Exam reminders on ✓</span>
    : <button className="ghost" disabled={state === 'working'} onClick={enable}>
        {state === 'working' ? 'Enabling…' : 'Remind me before exams'}
      </button>
}
