import { spawnSync } from 'node:child_process'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://placeholder:placeholder@127.0.0.1:3306/placeholder'
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(cmd, ['prisma', 'generate'], {
  stdio: 'inherit',
  env: process.env,
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

process.exit(1)
