'use client'

import { useEffect, useRef, useState } from 'react'
import { Link2, Share2 } from 'lucide-react'
import { btn } from '@/lib/button-styles'
import { copyText } from '@/lib/clipboard'

export function ShareActions({ url, title }: { url: string; title: string }) {
  const [message, setMessage] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function notify(text: string) {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(''), 3000)
  }

  async function copyUrl() {
    notify((await copyText(url)) ? 'Prompt URL copied!' : 'Couldn’t copy the URL. Copy it from the address bar instead.')
  }

  async function share() {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: `${title} — AI image prompt`, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    await copyUrl()
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-nowrap gap-1 sm:gap-2">
        <button
          type="button"
          onClick={share}
          className={btn({ variant: 'outline', size: 'md', className: 'h-10 gap-1 px-2 text-[11px] sm:h-12 sm:gap-2 sm:px-4 sm:text-sm' })}
        >
          <Share2 aria-hidden="true" />
          <span className="sm:hidden">Share</span>
          <span className="hidden sm:inline">Share Prompt</span>
        </button>
        <button
          type="button"
          onClick={copyUrl}
          className={btn({ variant: 'outline', size: 'md', className: 'h-10 gap-1 px-2 text-[11px] sm:h-12 sm:gap-2 sm:px-4 sm:text-sm' })}
        >
          <Link2 aria-hidden="true" />
          <span className="sm:hidden">Copy URL</span>
          <span className="hidden sm:inline">Copy Prompt URL</span>
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
