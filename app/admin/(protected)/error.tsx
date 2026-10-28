'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-12 max-w-xl rounded-lg border border-red-200 bg-card p-6">
      <h1 className="text-lg font-semibold">This admin action could not be completed</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || 'An unexpected error occurred. Please try again.'}</p>
      <button onClick={reset} className="mt-5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Try again</button>
    </div>
  )
}
