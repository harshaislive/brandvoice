import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

const isDockerStandalone = existsSync('server.js')
const serverPath = isDockerStandalone ? 'server.js' : '.next/standalone/server.js'

// When Coolify runs `npm start` from the repository root, Next's standalone
// server lives under `.next/standalone` and expects public/static assets beside
// it. The Docker image already performs these copies during its build.
if (!isDockerStandalone) {
  mkdirSync('.next/standalone/.next', { recursive: true })
  if (existsSync('.next/static')) {
    cpSync('.next/static', '.next/standalone/.next/static', { recursive: true, force: true })
  }
  if (existsSync('public')) {
    cpSync('public', '.next/standalone/public', { recursive: true, force: true })
  }
}

const server = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env: process.env,
})

server.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
