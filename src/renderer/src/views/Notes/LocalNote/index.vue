<template>
  <div class="notepad-root">
    <!-- 列表 -->
    <div v-if="!isEditing" class="pw">
      <div class="top">
        <div class="left">
          <span class="dot" />
          <div>
            <h1>本地笔记</h1>
            <p>{{ notesList.length }} 条笔记</p>
          </div>
        </div>
        <el-button type="primary" round @click="createNewNote">
          <el-icon><Plus /></el-icon>
          <span>新建笔记</span>
        </el-button>
      </div>

      <div v-if="notesList.length === 0" class="empty">
        <p class="empty-txt">还没有笔记，点击上方按钮创建</p>
      </div>

      <div v-else class="list">
        <div v-for="note in notesList" :key="note.id" class="item" @click="editNote(note.id)">
          <div class="item-left">
            <span class="item-emoji">📝</span>
            <div>
              <div class="item-title">{{ note.title || '无标题笔记' }}</div>
              <div class="item-time">{{ formatDate(note.update_time) }}</div>
            </div>
          </div>
          <button class="item-del" @click.stop="handleDelete(note.id)">×</button>
        </div>
      </div>
    </div>

    <!-- 编辑器 -->
    <div v-else class="editor">
      <div class="editor-top">
        <div class="left">
          <button class="btn-back" @click="backToList">← 返回</button>
          <input v-model="noteTitle" class="input-title" placeholder="无标题笔记" />
          <span class="dot-save" :class="{ unsaved: !isSaved }" />
        </div>
        <div class="right">
          <div class="status">{{ isSaved ? '已保存' : '未保存' }}</div>
          <button v-if="currentNoteId" class="btn-del" @click="handleDelete(currentNoteId)">
            删除
          </button>
          <button class="btn-save" :disabled="saving" @click="saveNote">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
      <div
        style="
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          overflow: hidden;
        "
      >
        <div style="border-bottom: 1px solid #f3f4f6">
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" :mode="mode" />
        </div>
        <Editor
          v-model="valueHtml"
          :default-config="editorConfig"
          :mode="mode"
          @on-created="handleCreated"
          @on-change="handleChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const isEditing = ref(false)
const editorRef = shallowRef<IDomEditor>()
const currentNoteId = ref<number | null>(null)
const noteTitle = ref('')
const valueHtml = ref('<p><br></p>')
const mode = ref('default')
const isSaved = ref(true)
const saving = ref(false)

interface NoteItem {
  id: number
  title: string
  content: string
  type?: string
  create_time: number
  update_time: number
}
const notesList = ref<NoteItem[]>([])

const toolbarConfig = { excludeKeys: ['fullScreen'] }
const editorConfig = { placeholder: '开始记录...' }

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
const handleCreated = (e: IDomEditor) => {
  editorRef.value = e
}

const initialNote = ref({ title: '', content: '' })
const checkModified = () => {
  const t = noteTitle.value.trim()
  const c = valueHtml.value
  const empty = (s: string) => !s || s === '<p><br></p>' || s === '<p></p>'
  return (
    t !== initialNote.value.title ||
    (!empty(initialNote.value.content) && !empty(c) && c !== initialNote.value.content)
  )
}
const handleChange = () => {
  isSaved.value = !checkModified()
}
watch(noteTitle, () => {
  isSaved.value = !checkModified()
})

const formatDate = (t: number) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadList = async () => {
  try {
    notesList.value = await window.api.db.getNotes(userStore.id || 0, 'text')
  } catch {
    /* */
  }
}

const editNote = async (id: number) => {
  try {
    const n = await window.api.db.getNoteById(id, userStore.id || 0)
    if (!n) return
    currentNoteId.value = n.id
    noteTitle.value = n.title
    valueHtml.value = n.content
    initialNote.value = { title: n.title, content: n.content }
    isSaved.value = true
    isEditing.value = true
  } catch {
    ElMessage.error('加载失败')
  }
}

const createNewNote = () => {
  currentNoteId.value = null
  noteTitle.value = ''
  valueHtml.value = '<p><br></p>'
  initialNote.value = { title: '', content: '<p><br></p>' }
  isSaved.value = true
  isEditing.value = true
}

const backToList = async () => {
  if (!isSaved.value) {
    try {
      await ElMessageBox.confirm('未保存的内容将丢失，确定返回？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  isEditing.value = false
  await loadList()
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除？不可恢复。', '删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await window.api.db.deleteNote(id, userStore.id || 0)
    ElMessage.success('已删除')
    if (isEditing.value && currentNoteId.value === id) isEditing.value = false
    await loadList()
  } catch {
    /* */
  }
}

const saveNote = async () => {
  saving.value = true
  try {
    const data = {
      title: noteTitle.value.trim() || '无标题笔记',
      content: valueHtml.value,
      type: 'text',
      user_id: userStore.id || 0
    }
    if (currentNoteId.value) await window.api.db.updateNote({ id: currentNoteId.value, ...data })
    else {
      const n = await window.api.db.addNote(data)
      currentNoteId.value = n.id
    }
    initialNote.value = { title: data.title, content: data.content }
    isSaved.value = true
    ElMessage.success('已保存')
    isEditing.value = false
    await loadList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadList()
  if (route.query.openId) {
    const id = parseInt(route.query.openId as string)
    if (!isNaN(id)) await editNote(id)
  }
})
watch(
  () => route.query.openId,
  async (v) => {
    if (v) {
      const id = parseInt(v as string)
      if (!isNaN(id)) await editNote(id)
    }
  }
)
</script>

<style scoped>
.notepad-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.pw {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.left .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
}
.left h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.left p {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-txt {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 12px var(--el-color-primary-light-8);
}
.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.item-emoji {
  font-size: 20px;
}
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.item-del {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition: all 0.2s;
}
.item:hover .item-del {
  opacity: 1;
}
.item-del:hover {
  background: #fef2f2;
  color: #ef4444;
}

.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.editor-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  gap: 16px;
}
.editor-top .left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.editor-top .right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-back {
  background: none;
  border: none;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}
.btn-back:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.input-title {
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: transparent;
  flex: 1;
}
.input-title::placeholder {
  color: var(--el-text-color-placeholder);
}
.dot-save {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  transition: all 0.3s;
}
.dot-save.unsaved {
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.status {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.btn-del {
  background: #fef2f2;
  border: none;
  color: #ef4444;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-del:hover {
  background: #fee2e2;
}
.btn-save {
  background: var(--el-color-primary);
  border: none;
  color: #fff;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover {
  background: var(--el-color-primary-light-3);
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
