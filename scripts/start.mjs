import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

const serverPath = existsSync('server.js')
  ? 'server.js'
  : '.next/standalone/server.js'

const server = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env: process.env,
})

server.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
