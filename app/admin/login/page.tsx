import Link from 'next/link'
import { signInAction } from '@/app/admin/actions'
import { hasSupabaseConfig } from '@/lib/supabase/server'
import { LoginForm } from '@/components/admin/login-form'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const configured = hasSupabaseConfig()
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="text-xl font-semibold tracking-[-0.04em] text-foreground">Prompt<span className="text-primary">Avero</span></Link>
        <p className="mt-1 text-xs text-muted-foreground">Administrator sign in</p>
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 pb-10 shadow-sm sm:p-8 sm:pb-12">
          <h1 className="text-xl font-semibold tracking-[-0.03em]">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your prompt library.</p>
          {!configured ? (
            <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              Supabase is not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your local environment.
            </div>
          ) : error ? (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}
          {configured ? <LoginForm action={signInAction} /> : null}
        </section>
      </div>
    </main>
  )
}
