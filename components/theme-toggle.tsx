'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { btn } from '@/lib/button-styles'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={btn({ variant: 'ghost', size: 'icon' })}
      aria-label="Toggle light and dark theme"
    >
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </button>
  )
}
