import sqlite3 from 'sqlite3'
import { existsSync, copyFileSync } from 'fs'
import os from 'os'
import path from 'path'

type Stopper = () => void

export function startMacosWechatNotificationWatch(options: {
  userDataDir: string
  pollIntervalMs: number
  keywords: string[]
  onMessage: (message: string) => void
}): Stopper {
  const dbPathCandidates = [
    path.join(os.homedir(), 'Library/Application Support/NotificationCenter/db2/db'),
    path.join(os.homedir(), 'Library/Application Support/NotificationCenter/db/db')
  ]

  const sourceDbPath = dbPathCandidates.find((p) => existsSync(p))
  if (!sourceDbPath) return () => undefined

  const copyPath = path.join(options.userDataDir, 'wechat-notify-macos.db')

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
  const rows = await queryAll(dbPath, `SELECT * FROM record ORDER BY delivered_date DESC LIMIT 50`)
  if (!rows || rows.length === 0) return null

  const keywordLower = (keywords || []).map((k) => String(k).toLowerCase()).filter(Boolean)

  for (const row of rows) {
    const text = rowToText(row).toLowerCase()
    if (keywordLower.length > 0 && !keywordLower.some((k) => text.includes(k))) continue

    const id = String(row.rec_id ?? row.id ?? row.notification_id ?? row.delivered_date ?? '')
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
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err)
    })

    db.all(sql, params, (err, rows) => {
      db.close()
      if (err) resolve([])
      else resolve(rows || [])
    })
  })
}
