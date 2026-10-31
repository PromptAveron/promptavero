'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { btn } from '@/lib/button-styles'
import { copyText } from '@/lib/clipboard'
import { fetchPromptEngagement } from '@/lib/prompt-engagement'
import { getEngagementVisitorId } from '@/lib/prompt-engagement-client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'copied' | 'failed'

export function PromptTextPanel({
  promptId,
  promptSlug,
  promptText,
  initialCopyCount,
  engagementEnabled,
}: {
  promptId: string
  promptSlug: string
  promptText: string
  initialCopyCount: number
  engagementEnabled: boolean
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [copyCount, setCopyCount] = useState(initialCopyCount)
  const [copyError, setCopyError] = useState('')
  const [copying, setCopying] = useState(false)
  const copyingRef = useRef(false)
  const textRef = useRef<HTMLPreElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const isLongPrompt = promptText.trim().split(/\s+/).filter(Boolean).length > 140

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!engagementEnabled) return
    let active = true
    const refreshCounts = async () => {
      try {
        const counts = await fetchPromptEngagement(promptSlug)
        if (active) setCopyCount(counts.copyCount)
      } catch (requestError) {
        console.error('Could not refresh the global prompt copy count.', requestError)
      }
    }

    void refreshCounts()
    window.addEventListener('focus', refreshCounts)
    window.addEventListener('pageshow', refreshCounts)
    return () => {
      active = false
      window.removeEventListener('focus', refreshCounts)
      window.removeEventListener('pageshow', refreshCounts)
    }
  }, [engagementEnabled, promptSlug])

  async function onCopy() {
    if (copyingRef.current) return
    copyingRef.current = true
    setCopying(true)
    setCopyError('')
    try {
      const ok = await copyText(promptText)
      if (!ok && textRef.current) {
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(textRef.current)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setStatus(ok ? 'copied' : 'failed')
      if (ok && engagementEnabled) {
        try {
          const supabase = createSupabaseBrowserClient()
          const { data, error } = await supabase.rpc('record_prompt_copy', {
            p_prompt_id: promptId,
            p_visitor_id: getEngagementVisitorId(),
          })
          if (error) throw error
          if (typeof data !== 'number' || !Number.isInteger(data)) {
            throw new Error('The copy counter returned an invalid response.')
          }
          setCopyCount(data)
        } catch (error) {
          console.error('Could not record the prompt copy.', error)
          setCopyError('The prompt was copied, but its copy count could not be updated.')
        }
      }
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('Could not copy the prompt.', error)
      setStatus('failed')
    } finally {
      copyingRef.current = false
      setCopying(false)
    }
  }

  return (
    <section aria-labelledby="prompt-heading" className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h2 id="prompt-heading" className="text-sm font-semibold">
          Full prompt
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Copied {copyCount.toLocaleString()} Times</span>
          <button
            type="button"
            onClick={onCopy}
            disabled={copying}
            className={cn(
              btn({ size: 'md', variant: status === 'copied' ? 'secondary' : 'primary' }),
              'min-w-[9.5rem]',
            )}
          >
            {status === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {status === 'copied' ? 'Prompt copied!' : 'Copy Prompt'}
          </button>
        </div>
      </div>
      <pre
        ref={textRef}
        className={cn(
          'whitespace-pre-wrap break-words px-4 py-4 font-sans text-[14px] leading-6 text-foreground sm:px-5',
          isLongPrompt && 'max-h-80 overflow-y-auto overscroll-contain',
        )}
      >
        {promptText}
      </pre>
      <p role="status" aria-live="polite" className="min-h-0 px-4 pb-4 text-sm sm:px-5">
        {status === 'failed' ? (
          <span className="text-destructive">
            Couldn&apos;t access the clipboard. The prompt is selected, so press Ctrl+C (or Cmd+C) to copy it.
          </span>
        ) : null}
      </p>
      {copyError ? <p role="alert" className="px-4 pb-4 text-sm text-destructive sm:px-5">{copyError}</p> : null}
    </section>
  )
}
