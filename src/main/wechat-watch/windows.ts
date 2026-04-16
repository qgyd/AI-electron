import sqlite3 from 'sqlite3'
import { existsSync, copyFileSync } from 'fs'
import path from 'path'

type Stopper = () => void

export function startWindowsWechatNotificationWatch(options: {
  userDataDir: string
  pollIntervalMs: number
  keywords: string[]
  onMessage: (message: string) => void
}): Stopper {
  const localAppData = process.env.LOCALAPPDATA || ''
  const sourceDbPath = path.join(
    localAppData,
    'Microsoft',
    'Windows',
    'Notifications',
    'wpndatabase.db'
  )

  if (!sourceDbPath || !existsSync(sourceDbPath)) return () => undefined

  const copyPath = path.join(options.userDataDir, 'wechat-notify-windows.db')

  let lastId = ''
  const timer = setInterval(
    async () => {
      try {
        copyFileSync(sourceDbPath, copyPath)
        const latest = await readLatestFromDb(copyPath, options.keywords)
        if (!latest) return

        if (latest.id && latest.id !== lastId) {
          lastId = latest.id
          options.onMessage(latest.message)
        }
      } catch {
        // ignore
      }
    },
    Math.max(500, options.pollIntervalMs)
  )

  return () => clearInterval(timer)
}

async function readLatestFromDb(
  dbPath: string,
  keywords: string[]
): Promise<{ id: string; message: string } | null> {
  const rows = await queryAll(dbPath, `SELECT * FROM Notification ORDER BY Id DESC LIMIT 80`)
  if (!rows || rows.length === 0) return null

  const keywordLower = (keywords || []).map((k) => String(k).toLowerCase()).filter(Boolean)

  for (const row of rows) {
    const text = rowToText(row).toLowerCase()
    if (keywordLower.length > 0 && !keywordLower.some((k) => text.includes(k))) continue

    const id = String(row.Id ?? row.RecordId ?? row.NotificationId ?? '')
    const message = '收到一条新微信消息'
    return { id, message }
  }

  return null
}

function rowToText(row: any) {
  const parts: string[] = []
  for (const key of Object.keys(row || {})) {
    const v = row[key]
    if (typeof v === 'string') parts.push(v)
  }
  return parts.join(' ')
}

function queryAll(dbPath: string, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, () => undefined)
    db.all(sql, params, (err, rows) => {
      db.close()
      if (err) resolve([])
      else resolve(rows || [])
    })
  })
}
