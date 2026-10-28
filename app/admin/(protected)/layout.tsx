import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { requireAdmin } from '@/lib/supabase/admin'
import { hasSupabaseConfig } from '@/lib/supabase/server'

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseConfig()) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="max-w-lg rounded-xl border border-border bg-card p-7"><h1 className="text-xl font-semibold">Admin setup required</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then apply the database migration before signing in.</p></div></main>
  }
  const { user } = await requireAdmin()
  return (
    <div data-admin-shell className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AdminSidebar email={user.email ?? 'Administrator'} />
        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  )
}
