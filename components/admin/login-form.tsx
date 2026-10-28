'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className="mt-5 flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60">
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium">Email address</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium">Password</label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="h-10 w-full rounded-md border border-border bg-card px-3 pr-10 text-sm outline-none focus:border-primary" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <SubmitButton />
    </form>
  )
}
