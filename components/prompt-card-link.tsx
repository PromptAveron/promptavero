'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function PromptCardLink({
  href,
  title,
  image,
}: {
  href: string
  title: string
  image: { src: string; width: number; height: number }
}) {
  const [shouldPrefetchImage, setShouldPrefetchImage] = useState(false)

  function prefetchImage() {
    setShouldPrefetchImage(true)
  }

  return (
    <>
      <Link
        href={href}
        aria-label={`View prompt: ${title}`}
        onPointerEnter={prefetchImage}
        onFocus={prefetchImage}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      {shouldPrefetchImage ? (
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 50vw, 100vw"
          loading="eager"
          aria-hidden="true"
          className="pointer-events-none fixed -left-[10000px] top-0 size-px"
        />
      ) : null}
    </>
  )
}
