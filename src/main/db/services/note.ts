import sqlite3 from 'sqlite3'
import { run, all } from '../index'

// 初始化表
export const initNoteService = (db: sqlite3.Database) => {
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

// 导出笔记相关操作
export const noteService = {
  addNote: async (note: { title: string; content: string }) => {
    const now = Date.now()
    const id = await run(
      'INSERT INTO notes (title, content, create_time, update_time) VALUES (?, ?, ?, ?)',
      [note.title || '无标题笔记', note.content, now, now]
    )
    return { id, ...note, create_time: now, update_time: now }
  },

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

  getNotes: async () => {
    return await all(
      'SELECT id, title, create_time, update_time FROM notes ORDER BY update_time DESC'
    )
  },

  getNoteById: async (id: number) => {
    const rows = await all('SELECT * FROM notes WHERE id = ?', [id])
    return rows[0] || null
  },

  deleteNote: async (id: number) => {
    await run('DELETE FROM notes WHERE id = ?', [id])
    return true
  }
}
