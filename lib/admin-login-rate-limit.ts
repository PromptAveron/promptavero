import 'server-only'
import { headers } from 'next/headers'
import { createSupabasePublicClient } from '@/lib/supabase/server'

const ipHashPattern = /^[0-9a-f]{64}$/

function getRateLimitSecret(): string {
  const secret = process.env.ADMIN_LOGIN_RATE_LIMIT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_LOGIN_RATE_LIMIT_SECRET must contain at least 32 characters.')
  }
  return secret
}

async function getClientIpHash(secret: string): Promise<string> {
  const requestHeaders = await headers()
  const cloudflareIp = requestHeaders.get('cf-connecting-ip')?.trim()
  const localForwardedIp = process.env.NODE_ENV !== 'production'
    ? requestHeaders.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    : undefined
  const ip = cloudflareIp || localForwardedIp

  if (!ip) {
    throw new Error('Could not determine the client IP for admin sign-in rate limiting.')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function reserveAdminLoginAttempt() {
  const serverSecret = getRateLimitSecret()
  const ipHash = await getClientIpHash(serverSecret)
  const { data, error } = await createSupabasePublicClient().rpc('reserve_admin_login_attempt', {
    p_ip_hash: ipHash,
    p_server_secret: serverSecret,
  })
  if (error) throw new Error(`Could not check the admin sign-in rate limit: ${error.message}`)

  const decision = data?.[0]
  if (!decision || typeof decision.allowed !== 'boolean') {
    throw new Error('The admin sign-in rate-limit check returned an invalid response.')
  }

  return { ipHash, ...decision }
}

export async function clearAdminLoginAttempts(ipHash: string) {
  if (!ipHashPattern.test(ipHash)) {
    throw new Error('The admin sign-in rate-limit key is invalid.')
  }

  const serverSecret = getRateLimitSecret()
  const { error } = await createSupabasePublicClient().rpc('clear_admin_login_attempts', {
    p_ip_hash: ipHash,
    p_server_secret: serverSecret,
  })
  if (error) throw new Error(`Could not reset the admin sign-in rate limit: ${error.message}`)
}
