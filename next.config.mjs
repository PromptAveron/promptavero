import { readFileSync } from 'node:fs'

const redirectEntries = JSON.parse(
  readFileSync(new URL('./data/redirects.json', import.meta.url), 'utf8'),
)
const imageKitImagePattern = process.env.IMAGEKIT_URL_ENDPOINT
  ? new URL(`${process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, '')}/**`)
  : null

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    agentUpgrade: 'security',
  },
  trailingSlash: true,
  images: {
    formats: ['image/webp'],
    remotePatterns: imageKitImagePattern ? [imageKitImagePattern] : [],
    ...(process.env.CLOUDFLARE_WORKERS === '1' ? { unoptimized: true } : {}),
  },
  async redirects() {
    return redirectEntries.map(({ from, to, permanent = true }) => ({
      source: from,
      destination: to,
      permanent,
    }))
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
