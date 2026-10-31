'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { fetchPromptEngagement } from '@/lib/prompt-engagement'
import { getEngagementVisitorId } from '@/lib/prompt-engagement-client'
import { cn } from '@/lib/utils'

export function PromptLikeButton({
  promptId,
  slug,
  initialCount,
  enabled,
  variant = 'default',
  iconOnly = false,
  className,
}: {
  promptId: string
  slug: string
  initialCount: number
  enabled: boolean
  variant?: 'default' | 'detail'
  iconOnly?: boolean
  className?: string
}) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [animateLike, setAnimateLike] = useState(false)
  const animationTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(animationTimer.current)
  }, [])

  useEffect(() => {
    let active = true
    try {
      const savedLike = localStorage.getItem(`promptavero:liked:${promptId}`) === 'true'
      if (active) {
        setLiked(savedLike)
        if (!enabled) setCount(initialCount + (savedLike ? 1 : 0))
      }
    } catch (storageError) {
      console.error('Could not read the saved prompt like state.', storageError)
      setError('Likes could not be remembered because browser storage is unavailable.')
    }
    if (!enabled) return () => { active = false }
    if (!enabled) return () => { active = false }
    const refreshCounts = async () => {
      try {
        const counts = await fetchPromptEngagement(slug)
        if (active) setCount(counts.likeCount)
      } catch (requestError) {
        console.error('Could not refresh the global prompt like count.', requestError)
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
  }, [enabled, initialCount, promptId, slug])

  async function likePrompt() {
    if (pending) return
    if (!enabled) {
      setError('')
      const nextLiked = !liked
      setLiked(nextLiked)
      setCount((currentCount) => Math.max(0, currentCount + (nextLiked ? 1 : -1)))
      if (nextLiked) {
        setAnimateLike(true)
        window.clearTimeout(animationTimer.current)
        animationTimer.current = window.setTimeout(() => setAnimateLike(false), 700)
      }
      try {
        if (nextLiked) localStorage.setItem(`promptavero:liked:${promptId}`, 'true')
        else localStorage.removeItem(`promptavero:liked:${promptId}`)
      } catch (storageError) {
        console.error('Could not update the saved prompt like state in browser storage.', storageError)
        setError('Your like is active for this page, but browser storage could not remember it.')
      }
      return
    }

    setPending(true)
    setError('')

    try {
      const visitorId = getEngagementVisitorId()
      const supabase = createSupabaseBrowserClient()
      const { data, error: requestError } = await supabase.rpc('toggle_prompt_like', {
        p_prompt_id: promptId,
        p_visitor_id: visitorId,
      })
      if (requestError) throw requestError
      if (
        typeof data !== 'object'
        || data === null
        || !('liked' in data)
        || !('likeCount' in data)
        || typeof data.liked !== 'boolean'
        || typeof data.likeCount !== 'number'
        || !Number.isInteger(data.likeCount)
      ) {
        throw new Error('The like response was invalid.')
      }

      setCount(data.likeCount)
      setLiked(data.liked)
      if (data.liked) {
        setAnimateLike(true)
        window.clearTimeout(animationTimer.current)
        animationTimer.current = window.setTimeout(() => setAnimateLike(false), 700)
      }
      try {
        if (data.liked) localStorage.setItem(`promptavero:liked:${promptId}`, 'true')
        else localStorage.removeItem(`promptavero:liked:${promptId}`)
      } catch (storageError) {
        console.error('Could not update the saved prompt like state in browser storage.', storageError)
        setError(`Your like was ${data.liked ? 'saved' : 'removed'}, but this browser could not remember the change.`)
      }
    } catch (requestError) {
      console.error('Could not save the prompt like.', requestError)
      setError('Couldn’t save your like. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={likePrompt}
        disabled={pending}
        aria-pressed={liked}
        aria-label={`${liked ? 'Liked' : 'Like'} ${count.toLocaleString()} times`}
        title={enabled ? undefined : 'This like is saved only in this browser while database engagement is unavailable.'}
        className={cn(
          'group/like relative inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-80',
          variant === 'detail'
            ? liked
              ? 'w-40 shrink-0 rounded-full border border-primary/30 bg-brand-soft text-brand-text shadow-md shadow-primary/15'
              : 'w-40 shrink-0 rounded-full border border-primary/20 bg-gradient-to-r from-primary to-[#8b5cf6] text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0'
            : iconOnly
              ? liked
                ? 'rounded-full border border-rose-200/50 bg-rose-500/45 text-white shadow-md shadow-black/20 hover:bg-rose-500/60'
                : 'rounded-full border border-white/35 bg-black/35 text-white shadow-md shadow-black/20 hover:border-white/60 hover:bg-black/55 hover:text-rose-100'
              : liked
                ? 'rounded-lg border border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25 hover:bg-rose-600 hover:text-white'
                : 'rounded-lg border border-border bg-card text-foreground hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300',
          className,
        )}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            'size-4 transition-transform duration-200 group-hover/like:scale-110',
            liked && 'fill-current',
            variant === 'detail' && 'size-5',
            animateLike && 'animate-like-pop',
          )}
        />
        {iconOnly ? (
          <span className="text-xs tabular-nums">{count.toLocaleString()}</span>
        ) : (
          <span className={cn(variant === 'detail' && 'whitespace-nowrap rounded-full bg-white/20 px-2 py-0.5 text-sm tabular-nums')}>
            {liked ? 'Liked' : 'Like'} {count.toLocaleString()}
          </span>
        )}
        {animateLike ? (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
            <span className="like-sparkle like-sparkle-one" />
            <span className="like-sparkle like-sparkle-two" />
            <span className="like-sparkle like-sparkle-three" />
            <span className="like-sparkle like-sparkle-four" />
          </span>
        ) : null}
      </button>
      {error ? <p role="alert" className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
