// 启动 Vite 开发服务器，并在就绪后自动打开默认浏览器
// 跨平台：Windows 用 cmd /c start，macOS 用 open，Linux 用 xdg-open
import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { platform } from 'node:os'

// createServer 会自动读取 vite.config.ts，包括 React 插件、tsconfigPaths 等
const server = await createServer()
await server.listen()

const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5173/'

console.log('')
console.log(`  ➜  Local:   ${url}`)
console.log('')

const plat = platform()
const opener = {
  win32:  { cmd: 'cmd',       args: ['/c', 'start', '', url] },
  darwin: { cmd: 'open',      args: [url] },
  linux:  { cmd: 'xdg-open',  args: [url] },
}[plat] ?? { cmd: 'xdg-open', args: [url] }

try {
  // detached + unref：让浏览器进程独立于本脚本运行
  spawn(opener.cmd, opener.args, { detached: true, stdio: 'ignore' }).unref()
  console.log(`  ➜  已自动打开浏览器：${url}`)
} catch {
  console.log(`  ➜  浏览器未能自动打开，请手动访问：${url}`)
}

// 保持进程运行，按 Ctrl+C 退出
