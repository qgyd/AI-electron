import sqlite3 from 'sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import log from './logger'

// 获取应用的用户数据目录
const userDataPath = app.getPath('userData')

// 确保该目录存在 (如果不存在就创建它)
if (!existsSync(userDataPath)) {
  mkdirSync(userDataPath, { recursive: true })
}

// 数据库文件路径
const dbPath = join(userDataPath, 'mytool_notes.db')
log.info('====== 本地数据库文件路径 ======\n', dbPath)

// 初始化数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    log.error('数据库打开失败: ', err)
  } else {
    // 创建笔记表
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        create_time INTEGER,
        update_time INTEGER
      )
    `)
  }
})

// 封装 db.run 为 Promise
const run = (sql: string, params: any[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
  })
}

// 封装 db.all 为 Promise
const all = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// 导出数据库操作对象
export const dbOperations = {
  // 添加笔记
  addNote: async (note: { title: string; content: string }) => {
    const now = Date.now()
    const id = await run(
      'INSERT INTO notes (title, content, create_time, update_time) VALUES (?, ?, ?, ?)',
      [note.title || '无标题笔记', note.content, now, now]
    )
    return { id, ...note, create_time: now, update_time: now }
  },

  // 更新笔记
  updateNote: async (note: { id: number; title: string; content: string }) => {
    const now = Date.now()
    await run('UPDATE notes SET title = ?, content = ?, update_time = ? WHERE id = ?', [
      note.title || '无标题笔记',
      note.content,
      now,
      note.id
    ])
    return { ...note, update_time: now }
  },

  // 获取笔记列表 (只返回基本信息，不返回富文本内容，为了性能)
  getNotes: async () => {
    return await all(
      'SELECT id, title, create_time, update_time FROM notes ORDER BY update_time DESC'
    )
  },

  // 获取单条笔记详情
  getNoteById: async (id: number) => {
    const rows = await all('SELECT * FROM notes WHERE id = ?', [id])
    return rows[0] || null
  },

  // 删除笔记
  deleteNote: async (id: number) => {
    await run('DELETE FROM notes WHERE id = ?', [id])
    return true
  }
}
