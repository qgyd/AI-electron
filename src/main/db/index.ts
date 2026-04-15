import sqlite3 from 'sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import log from '../logger'
import { initUserService } from './services/user'
import { initNoteService } from './services/note'

// 获取应用的用户数据目录
const userDataPath = app.getPath('userData')

// 确保该目录存在
if (!existsSync(userDataPath)) {
  mkdirSync(userDataPath, { recursive: true })
}

// 数据库文件路径
const dbPath = join(userDataPath, 'mytool_notes.db')
log.info('====== 本地数据库文件路径 ======\n', dbPath)

// 初始化数据库
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    log.error('数据库打开失败: ', err)
  } else {
    // 初始化各个子模块的数据表
    initNoteService(db)
    initUserService(db)
  }
})

// 封装 db.run 为 Promise
export const run = (sql: string, params: any[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
  })
}

// 封装 db.all 为 Promise
export const all = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}
