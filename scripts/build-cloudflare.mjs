import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cliPath = fileURLToPath(
  new URL('../node_modules/@opennextjs/cloudflare/dist/cli/index.js', import.meta.url),
)
const result = spawnSync(process.execPath, [cliPath, 'build'], {
  env: { ...process.env, CLOUDFLARE_WORKERS: '1' },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
