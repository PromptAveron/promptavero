'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { PromptImage } from '@/types/content'

function extensionOf(src: string) {
  const match = /\.([a-z0-9]+)(?:\?|$)/i.exec(src)
  return match ? match[1].toLowerCase() : 'webp'
}

export function PromptGallery({
  slug,
  title,
  images,
}: {
  slug: string
  title: string
  images: PromptImage[]
}) {
  const [selected, setSelected] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const current = images[selected]

  async function download(index: number) {
    const image = images[index]
    setError('')
    setBusy(true)
    try {
      const response = await fetch(image.src)
      if (!response.ok) throw new Error(`Request failed with ${response.status}`)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${slug}-${index + 1}.${extensionOf(image.src)}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch {
      setError('The image couldn’t be downloaded. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function showImage(index: number) {
    setSelected((index + images.length) % images.length)
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-2.5 shadow-lg shadow-foreground/10 sm:p-3">
      <div className="relative isolate aspect-square max-h-[78vh] overflow-hidden rounded-xl bg-muted">
        <Image
          src={current.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          aria-hidden="true"
          className="z-0 scale-110 object-cover blur-3xl opacity-50"
        />
        <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-br from-background/30 via-background/10 to-foreground/25" />
        <div className="absolute inset-[2%] z-10">
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading={selected === 0 ? 'eager' : 'lazy'}
            fetchPriority={selected === 0 ? 'high' : 'auto'}
            className="object-contain"
          />
        </div>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => showImage(selected - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => showImage(selected + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="View image fullscreen"
            className="inline-flex size-10 items-center justify-center rounded-lg bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Eye className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => download(selected)}
            disabled={busy}
            aria-label={busy ? 'Preparing image download' : 'Download image'}
            className="inline-flex size-10 items-center justify-center rounded-lg bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          >
            <Download className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label="Image variations">
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show variation ${index + 1}`}
                aria-current={index === selected}
                className={cn(
                  'relative block size-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition-all duration-200',
                  index === selected
                    ? 'border-primary'
                    : 'border-border opacity-75 hover:opacity-100',
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="96px"
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[96vw] gap-0 bg-black p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{current.alt}</DialogDescription>
          <Image
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes="96vw"
            className="mx-auto max-h-[88vh] w-auto rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
