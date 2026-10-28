'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

export function ConfirmSubmit({
  action,
  fields,
  label,
  confirmation,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>
  fields: Record<string, string>
  label: string
  confirmation: string
  className?: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <form
      action={async (formData) => {
        setPending(true)
        await action(formData)
        setPending(false)
      }}
      onSubmit={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault()
      }}
    >
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button disabled={pending} className={className}>{pending ? 'Working…' : label}</button>
    </form>
  )
}
