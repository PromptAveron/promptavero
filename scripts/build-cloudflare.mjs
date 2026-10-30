import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const wranglerConfig = JSON.parse(
  readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
)
const cliPath = fileURLToPath(
  new URL('../node_modules/@opennextjs/cloudflare/dist/cli/index.js', import.meta.url),
)
const result = spawnSync(process.execPath, [cliPath, 'build'], {
  env: {
    ...process.env,
    CLOUDFLARE_WORKERS: '1',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || wranglerConfig.vars.NEXT_PUBLIC_SITE_URL,
  },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
