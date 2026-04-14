import sqlite3 from 'sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import crypto from 'crypto'
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

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

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

    // 创建用户表
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        avatar TEXT,
        create_time INTEGER
      )
    `,
      () => {
        // 检查是否有默认用户，没有则创建 admin / 123456
        db.get('SELECT count(*) as count FROM users', (err, row: any) => {
          if (!err && row && row.count === 0) {
            const defaultPassword = hashPassword('123456')
            const now = Date.now()
            db.run(
              'INSERT INTO users (username, password, avatar, create_time) VALUES (?, ?, ?, ?)',
              [
                'admin',
                defaultPassword,
                'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                now
              ]
            )
          }
        })
      }
    )
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
  },

  // ---------------- 用户系统 API ----------------
  login: async ({ username, password }: any) => {
    const hashed = hashPassword(password)
    const rows = await all(
      'SELECT id, username, avatar FROM users WHERE username = ? AND password = ?',
      [username, hashed]
    )
    if (rows && rows.length > 0) {
      return { success: true, user: rows[0] }
    }
    return { success: false, message: '用户名或密码错误' }
  },

  updateUserInfo: async ({ id, username, avatar }: any) => {
    try {
      await run('UPDATE users SET username = ?, avatar = ? WHERE id = ?', [username, avatar, id])
      return { success: true }
    } catch (e: any) {
      return { success: false, message: e.message.includes('UNIQUE') ? '用户名已存在' : '更新失败' }
    }
  },

  updatePassword: async ({ id, oldPassword, newPassword }: any) => {
    const hashedOld = hashPassword(oldPassword)
    const hashedNew = hashPassword(newPassword)
    const rows = await all('SELECT id FROM users WHERE id = ? AND password = ?', [id, hashedOld])
    if (rows && rows.length > 0) {
      await run('UPDATE users SET password = ? WHERE id = ?', [hashedNew, id])
      return { success: true }
    }
    return { success: false, message: '原密码错误' }
  }
}
