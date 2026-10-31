import Link from 'next/link'
import type { ReactNode } from 'react'

export function PromptCardLink({
  href,
  title,
  className,
  children,
}: {
  href: string
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} aria-label={`View prompt: ${title}`} className={className}>
      {children}
    </Link>
  )
}
