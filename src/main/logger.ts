import log from 'electron-log'
import { shell } from 'electron'
import path from 'path'

log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

log.transports.file.level = 'info'
log.transports.console.level = 'info'

const pad2 = (n: number) => String(n).padStart(2, '0')

const formatYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const defaultLogDir = path.dirname(log.transports.file.getFile().path)
let customLogDir: string | null = null

const resolveDailyLogPath = (date: Date) => {
  const dir = customLogDir || defaultLogDir
  const fileName = `${formatYmd(date)}.log`
  return path.join(dir, fileName)
}

log.transports.file.resolvePathFn = (_, message) => resolveDailyLogPath(message?.date || new Date())

export const getLogPath = () => {
  return resolveDailyLogPath(new Date())
}

export const openLogFolder = () => {
  const folder = customLogDir || defaultLogDir
  shell.openPath(folder)
}

export const setLogPath = (newPath: string) => {
  customLogDir = newPath
  const fullPath = resolveDailyLogPath(new Date())
  log.info(`Log directory changed: ${newPath}`)
  return fullPath
}

export default log
