import type { ReactNode } from 'react'

export const metadata = {
  title: 'Admin | PromptAvero',
  robots: { index: false, follow: false },
}

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <div data-admin-shell className="min-h-screen bg-background text-foreground">{children}</div>
}
