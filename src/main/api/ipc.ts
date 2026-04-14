import { ipcMain } from 'electron'
import log from '../logger'

type AnyFn = (...args: any[]) => any

const safeStringify = (value: any) => {
  const seen = new WeakSet()
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof key === 'string' && /token|authorization|password|secret|cookie/i.test(key)) {
        return '[REDACTED]'
      }
      if (typeof val === 'string') {
        if (val.startsWith('data:')) return `[data-url length=${val.length}]`
        if (val.length > 200) return `${val.slice(0, 200)}...(+${val.length - 200})`
        return val
      }
      if (typeof val === 'bigint') return val.toString()
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      return val
    },
    2
  )
}

const summarize = (value: any) => {
  if (value === null) return { type: 'null' }
  if (value === undefined) return { type: 'undefined' }
  if (typeof value === 'string')
    return { type: 'string', length: value.length, preview: value.slice(0, 120) }
  if (typeof value === 'number') return { type: 'number', value }
  if (typeof value === 'boolean') return { type: 'boolean', value }
  if (Array.isArray(value)) return { type: 'array', length: value.length }
  if (typeof value === 'object') return { type: 'object', keys: Object.keys(value).slice(0, 20) }
  return { type: typeof value }
}

export function ipcHandleWithLog(channel: string, handler: AnyFn) {
  ipcMain.handle(channel, async (event, ...args) => {
    const start = Date.now()
    try {
      log.info(`[IPC] ${channel} ->`, safeStringify(args.map(summarize)))
      const result = await handler(event, ...args)
      const cost = Date.now() - start
      log.info(`[IPC] ${channel} <- (${cost}ms)`, safeStringify(summarize(result)))
      return result
    } catch (err: any) {
      const cost = Date.now() - start
      log.error(`[IPC] ${channel} !! (${cost}ms)`, err)
      throw err
    }
  })
}

export function ipcOnWithLog(channel: string, listener: AnyFn) {
  ipcMain.on(channel, (event, ...args) => {
    const start = Date.now()
    try {
      log.info(`[IPC] ${channel} ->`, safeStringify(args.map(summarize)))
      const result = listener(event, ...args)
      const cost = Date.now() - start
      log.info(`[IPC] ${channel} <- (${cost}ms)`, safeStringify(summarize(result)))
      return result
    } catch (err: any) {
      const cost = Date.now() - start
      log.error(`[IPC] ${channel} !! (${cost}ms)`, err)
      throw err
    }
  })
}
