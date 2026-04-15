import sqlite3 from 'sqlite3'
import crypto from 'crypto'
import { run, all } from '../index'

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 初始化用户表
export const initUserService = (db: sqlite3.Database) => {
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

// 导出用户相关操作
export const userService = {
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
