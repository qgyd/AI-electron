<template>
  <div class="notepad-container">
    <div class="page-header">
      <h2>本地记事本</h2>
      <div v-if="!isEditing" class="header-actions">
        <el-button type="primary" @click="createNewNote">
          <el-icon class="el-icon--left"><Plus /></el-icon>
          创建笔记
        </el-button>
      </div>
      <div v-else class="header-actions">
        <el-button @click="backToList">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <el-button v-if="currentNoteId" type="danger" plain @click="deleteNote(currentNoteId)">
          <el-icon class="el-icon--left"><Delete /></el-icon>
          删除笔记
        </el-button>
        <el-button type="primary" :loading="saving" @click="saveNote">
          <el-icon class="el-icon--left"><DocumentChecked /></el-icon>
          保存笔记
        </el-button>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-if="!isEditing" class="notes-grid">
      <el-row :gutter="24">
        <!-- 创建新笔记卡片 -->
        <el-col :span="8" :xl="6" :lg="8" :md="12" :sm="12" :xs="24">
          <div class="note-card create-card" @click="createNewNote">
            <el-icon class="create-icon"><Plus /></el-icon>
            <span class="create-text">创建新笔记</span>
          </div>
        </el-col>

        <!-- 笔记列表卡片 -->
        <el-col
          v-for="note in notesList"
          :key="note.id"
          :span="8"
          :xl="6"
          :lg="8"
          :md="12"
          :sm="12"
          :xs="24"
        >
          <div class="note-card" @click="editNote(note.id)">
            <div class="note-card-header">
              <h3 class="note-title">{{ note.title || '无标题笔记' }}</h3>
              <el-dropdown @command="(cmd) => handleCommand(cmd, note.id)" @click.stop>
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" class="text-danger">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="note-card-footer">
              <span class="note-time">创建于: {{ formatDate(note.create_time) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-empty
        v-if="notesList.length === 0"
        description="暂无笔记，快去创建吧"
        :image-size="120"
        style="margin-top: 60px"
      />
    </div>

    <!-- 编辑视图 -->
    <div v-else class="editor-view">
      <div class="editor-card">
        <div class="title-input-wrapper">
          <input v-model="noteTitle" type="text" class="title-input" placeholder="无标题笔记..." />
          <div class="save-status" :class="{ saved: isSaved }">
            <el-icon><Select v-if="isSaved" /><Loading v-else /></el-icon>
            {{ isSaved ? '已安全保存' : '未保存更改' }}
          </div>
        </div>

        <div
          class="editor-wrapper"
          style="border: 1px solid var(--el-border-color); border-radius: 8px; overflow: hidden"
        >
          <!-- 工具栏 -->
          <Toolbar
            style="
              border-bottom: 1px solid var(--el-border-color);
              background-color: var(--el-fill-color-light);
            "
            :editor="editorRef"
            :default-config="toolbarConfig"
            :mode="mode"
          />
          <!-- 编辑器 -->
          <Editor
            v-model="valueHtml"
            style="height: calc(100vh - 280px); overflow-y: hidden"
            :default-config="editorConfig"
            :mode="mode"
            @on-created="handleCreated"
            @on-change="handleChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'

// 视图状态
const isEditing = ref(false)

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>()

// 内容和状态
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
  create_time: number
}

const notesList = ref<NoteItem[]>([])

// 工具栏配置
const toolbarConfig = {
  excludeKeys: ['fullScreen']
}

// 编辑器配置
const editorConfig = {
  placeholder: '在这里写下你的灵感...',
  MENU_CONF: {}
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

// 记录进入编辑状态时的初始内容
const initialNoteData = ref({ title: '', content: '' })

// 比较内容是否发生实质性修改
const checkIsModified = () => {
  const currentTitle = noteTitle.value.trim()
  const currentContent = valueHtml.value

  // 处理空编辑器内容的边缘情况（wangEditor 的空内容通常是 <p><br></p>）
  const isEmptyContent = (content: string) => {
    return !content || content === '<p><br></p>' || content === '<p></p>'
  }

  const isTitleModified = currentTitle !== initialNoteData.value.title

  // 如果初始内容为空，当前内容也为空，则认为未修改
  if (isEmptyContent(initialNoteData.value.content) && isEmptyContent(currentContent)) {
    return isTitleModified
  }

  return isTitleModified || currentContent !== initialNoteData.value.content
}

const handleChange = () => {
  // 只有真正发生了修改，才将状态标记为未保存
  if (checkIsModified()) {
    isSaved.value = false
  } else {
    isSaved.value = true
  }
}

// 监听标题输入框的变化，实时判断
watch(noteTitle, () => {
  if (checkIsModified()) {
    isSaved.value = false
  } else {
    isSaved.value = true
  }
})

// 格式化时间
const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 获取笔记列表
const loadNotesList = async () => {
  try {
    notesList.value = await window.api.db.getNotes()
  } catch (e) {
    console.error('获取笔记列表失败:', e)
    ElMessage.error('读取数据库失败')
  }
}

// 处理卡片下拉菜单点击
const handleCommand = (command: string, id: number) => {
  if (command === 'edit') {
    editNote(id)
  } else if (command === 'delete') {
    deleteNote(id)
  }
}

// 进入编辑模式 (修改)
const editNote = async (id: number) => {
  try {
    const note = await window.api.db.getNoteById(id)
    if (note) {
      currentNoteId.value = note.id
      noteTitle.value = note.title
      valueHtml.value = note.content

      // 记录初始状态，用于比对
      initialNoteData.value = {
        title: note.title,
        content: note.content
      }

      isSaved.value = true
      isEditing.value = true
    }
  } catch (e) {
    ElMessage.error('加载笔记详情失败')
  }
}

// 新建笔记
const createNewNote = () => {
  currentNoteId.value = null
  noteTitle.value = ''
  valueHtml.value = '<p><br></p>'

  // 记录空状态
  initialNoteData.value = {
    title: '',
    content: '<p><br></p>'
  }

  isSaved.value = true
  isEditing.value = true
}

// 返回列表
const backToList = async () => {
  // 返回前，再次做最终的比对
  if (checkIsModified() && !isSaved.value) {
    try {
      await ElMessageBox.confirm('当前笔记未保存，确定要返回吗？未保存的内容将丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  isEditing.value = false
  await loadNotesList()
}

// 删除笔记
const deleteNote = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条笔记记录吗？此操作不可恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await window.api.db.deleteNote(id)
    ElMessage.success('笔记已删除')
    if (isEditing.value && currentNoteId.value === id) {
      isEditing.value = false
    }
    await loadNotesList()
  } catch {
    // 取消删除
  }
}

// 保存笔记到 SQLite
const saveNote = async () => {
  saving.value = true
  try {
    const noteData = {
      title: noteTitle.value.trim() || '无标题笔记',
      content: valueHtml.value
    }

    if (currentNoteId.value) {
      // 更新现有笔记
      await window.api.db.updateNote({ id: currentNoteId.value, ...noteData })
    } else {
      // 新增笔记
      const newNote = await window.api.db.addNote(noteData)
      currentNoteId.value = newNote.id
    }

    // 保存成功后，更新初始状态记录，防止保存后立即返回又弹窗
    initialNoteData.value = {
      title: noteData.title,
      content: noteData.content
    }

    isSaved.value = true
    ElMessage.success('笔记已保存到本地数据库')
  } catch (e) {
    console.error('保存失败', e)
    ElMessage.error('保存失败，请检查数据库状态')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadNotesList()
})
</script>

<style scoped lang="scss">
.notepad-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-shrink: 0;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  /* --- 列表视图样式 --- */
  .notes-grid {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 24px;

    .el-col {
      margin-bottom: 24px;
    }

    .note-card {
      background: var(--el-bg-color);
      border-radius: 12px;
      padding: 24px;
      height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid var(--el-border-color-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        border-color: var(--el-color-primary-light-5);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: var(--el-color-primary-light-5);
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover::before {
        opacity: 1;
      }

      .note-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .note-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-color-primary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .more-icon {
          color: var(--el-text-color-secondary);
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
          }
        }
      }

      .note-card-footer {
        .note-time {
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }

      /* 创建新笔记特殊样式 */
      &.create-card {
        justify-content: center;
        align-items: center;
        border: 2px dashed var(--el-border-color);
        background-color: transparent;
        box-shadow: none;

        &::before {
          display: none;
        }

        &:hover {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);

          .create-icon,
          .create-text {
            color: var(--el-color-primary);
          }
        }

        .create-icon {
          font-size: 32px;
          color: var(--el-text-color-secondary);
          margin-bottom: 12px;
          transition: color 0.3s;
        }

        .create-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
          transition: color 0.3s;
        }
      }
    }
  }

  /* --- 编辑视图样式 --- */
  .editor-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .editor-card {
      flex: 1;
      background: var(--el-bg-color);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--el-box-shadow-light);
      display: flex;
      flex-direction: column;
      min-width: 0;

      .title-input-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px dashed var(--el-border-color-lighter);
        flex-shrink: 0;

        .title-input {
          flex: 1;
          font-size: 24px;
          font-weight: bold;
          color: var(--el-text-color-primary);
          border: none;
          outline: none;
          background: transparent;
          padding: 0;

          &::placeholder {
            color: var(--el-text-color-placeholder);
            font-weight: normal;
          }
        }

        .save-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--el-text-color-secondary);

          &.saved {
            color: var(--el-color-success);
          }
        }
      }

      .editor-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;

        :deep(.w-e-toolbar) {
          background-color: var(--el-fill-color-light) !important;
          border-color: var(--el-border-color) !important;

          .w-e-bar-item {
            button {
              color: var(--el-text-color-regular);
              &:hover {
                background-color: var(--el-fill-color);
              }
            }
          }
        }

        :deep(.w-e-text-container) {
          background-color: var(--el-bg-color) !important;
          color: var(--el-text-color-primary);
          flex: 1;

          [data-slate-editor] {
            padding: 20px 40px;
          }
        }
      }
    }
  }
}

// 适配暗黑模式的富文本编辑器样式
:global(.dark .editor-wrapper) {
  --w-e-textarea-bg-color: var(--el-bg-color);
  --w-e-textarea-color: var(--el-text-color-primary);
  --w-e-toolbar-bg-color: var(--el-fill-color-light);
  --w-e-toolbar-color: var(--el-text-color-regular);
  --w-e-toolbar-active-bg-color: var(--el-fill-color);
  --w-e-toolbar-active-color: var(--el-color-primary);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
