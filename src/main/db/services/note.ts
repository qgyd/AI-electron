import sqlite3 from 'sqlite3'
import { run, all } from '../index'

// 初始化表
export const initNoteService = (db: sqlite3.Database) => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      create_time INTEGER,
      update_time INTEGER,
      user_id INTEGER DEFAULT 0
    )
  `,
    () => {
      // 兼容旧版本，如果没有 user_id 列则添加
      db.all("PRAGMA table_info(notes)", (err, rows: any[]) => {
        if (!err && rows) {
          const hasUserId = rows.some((row) => row.name === 'user_id')
          if (!hasUserId) {
            db.run("ALTER TABLE notes ADD COLUMN user_id INTEGER DEFAULT 0")
          }
        }
      })
    }
  )
}

// 导出笔记相关操作
export const noteService = {
  addNote: async (note: { title: string; content: string; user_id: number }) => {
    const now = Date.now()
    const id = await run(
      'INSERT INTO notes (title, content, create_time, update_time, user_id) VALUES (?, ?, ?, ?, ?)',
      [note.title || '无标题笔记', note.content, now, now, note.user_id || 0]
    )
    return { id, ...note, create_time: now, update_time: now }
  },

  updateNote: async (note: { id: number; title: string; content: string; user_id: number }) => {
    const now = Date.now()
    await run(
      'UPDATE notes SET title = ?, content = ?, update_time = ? WHERE id = ? AND user_id = ?',
      [note.title || '无标题笔记', note.content, now, note.id, note.user_id || 0]
    )
    return { ...note, update_time: now }
  },

  getNotes: async (user_id: number) => {
    return await all(
      'SELECT id, title, create_time, update_time FROM notes WHERE user_id = ? ORDER BY update_time DESC',
      [user_id || 0]
    )
  },

  getNoteById: async (id: number, user_id: number) => {
    const rows = await all('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, user_id || 0])
    return rows[0] || null
  },

  deleteNote: async (id: number, user_id: number) => {
    await run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, user_id || 0])
    return true
  }
}
