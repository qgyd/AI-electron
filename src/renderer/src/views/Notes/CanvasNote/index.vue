<template>
  <div class="canvas-root">
    <!-- 列表视图 -->
    <div v-if="!isEditing" class="pw">
      <div class="top">
        <div class="left">
          <span class="dot" />
          <div>
            <h1>画板笔记</h1>
            <p>{{ notesList.length }} 个画板</p>
          </div>
        </div>
        <el-button type="primary" round @click="createNewNote">
          <el-icon><Plus /></el-icon>
          <span>新建画板</span>
        </el-button>
      </div>

      <div v-if="notesList.length === 0" class="empty">
        <img
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A+minimalist+flat+illustration+of+a+blank+drawing+canvas+on+an+easel%2C+soft+pastel+colors%2C+clean+white+background%2C+modern+flat+design+style&image_size=square_hd"
          alt="empty"
          class="empty-img"
        />
        <p class="empty-txt">还没有画板，点击上方按钮创建</p>
      </div>

      <div v-else class="grid">
        <div v-for="note in notesList" :key="note.id" class="card" @click="editNote(note.id)">
          <div class="card-preview">
            <span class="card-emoji">🎨</span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ note.title || '无标题画板' }}</div>
            <div class="card-time">{{ formatDate(note.update_time) }}</div>
          </div>
          <button class="card-del" @click.stop="handleDelete(note.id)">×</button>
        </div>
      </div>
    </div>

    <!-- 编辑视图 -->
    <div v-else class="editor">
      <div class="editor-top">
        <div class="left">
          <button class="btn-back" @click="backToList">← 返回</button>
          <input v-model="noteTitle" class="input-title" placeholder="无标题画板" />
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
      <div class="canvas-container">
        <div class="excalidraw-host">
          <Excalid class="excalidraw-wrapper" v-bind="excalidrawProps" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import { applyPureReactInVue } from 'veaury'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useSettingsStore } from '@/store/settings'

const route = useRoute()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

interface CanvasSceneData {
  elements: any[]
  appState: Record<string, any>
  files: Record<string, any>
  scrollToContent: boolean
}

const getCanvasBackground = () => (settingsStore.darkMode ? '#1e1e1e' : '#fafafa')

const createSceneData = (
  elements: any[] = [],
  appState: Record<string, any> = {},
  files: Record<string, any> = {}
): CanvasSceneData => ({
  elements,
  appState: {
    zenModeEnabled: false,
    gridSize: null,
    viewBackgroundColor: getCanvasBackground(),
    ...appState
  },
  files,
  scrollToContent: true
})

const normalizeSceneData = (raw: any): CanvasSceneData => {
  if (Array.isArray(raw)) return createSceneData(raw)
  if (raw && typeof raw === 'object') {
    return createSceneData(
      Array.isArray(raw.elements) ? raw.elements : [],
      raw.appState && typeof raw.appState === 'object' ? raw.appState : {},
      raw.files && typeof raw.files === 'object' ? raw.files : {}
    )
  }
  return createSceneData()
}

const serializeScene = (scene: CanvasSceneData) =>
  JSON.stringify({
    elements: scene.elements || [],
    appState: scene.appState || {},
    files: scene.files || {},
    scrollToContent: true
  })

const UIOptions = {
  canvasActions: {
    //画布操作
    changeViewBackgroundColor: true, //是否展示选择背景色
    clearCanvas: true, //是否显示重置画布
    loadScene: true, //是否显示打开本地文件按钮
    toggleTheme: true, //是否显示切换主题 黑 or 白
    saveAsImage: true, //是否显示保本图标格式按钮
    export: false //是否打开保存到本地按钮
  }
  //   tools:false
}

const Excalid = applyPureReactInVue(Excalidraw)
const excalidrawAPI: any = ref(null)
const isEditing = ref(false)
const currentNoteId = ref<number | null>(null)
const noteTitle = ref('')
const currentScene = ref<CanvasSceneData>(createSceneData())
const isSaved = ref(true)
const saving = ref(false)
const initialSnapshot = ref({
  title: '',
  content: serializeScene(createSceneData())
})

const initialData = computed(() => currentScene.value)

const checkModified = (scene: CanvasSceneData = currentScene.value) => {
  const title = noteTitle.value.trim()
  return (
    title !== initialSnapshot.value.title || serializeScene(scene) !== initialSnapshot.value.content
  )
}

const setExcalidrawAPI = (api: any) => {
  excalidrawAPI.value = api
  api.updateScene({
    ...currentScene.value,
    appState: {
      ...currentScene.value.appState,
      currentItemStrokeColor: settingsStore.darkMode ? '#ffffff' : '#000000',
      currentItemBackgroundColor: 'transparent',
      viewBackgroundColor: getCanvasBackground()
    }
  })
}

const handleExcalidChange = (
  elements: any[],
  appState: Record<string, any>,
  files: Record<string, any>
) => {
  currentScene.value = createSceneData(
    [...(elements || [])],
    {
      zenModeEnabled: appState?.zenModeEnabled,
      gridSize: appState?.gridSize ?? null,
      viewBackgroundColor: appState?.viewBackgroundColor ?? getCanvasBackground()
    },
    files || {}
  )
  isSaved.value = !checkModified(currentScene.value)
}

const excalidrawProps = computed(() => ({
  id: 'Excalidraw',
  initialData: initialData.value,
  UIOptions,
  onChange: handleExcalidChange,
  theme: settingsStore.darkMode ? 'dark' : 'light',
  excalidrawAPI: setExcalidrawAPI,
  langCode: 'zh-CN'
}))

watch(noteTitle, () => {
  isSaved.value = !checkModified()
})

interface NoteItem {
  id: number
  title: string
  content: string
  type?: string
  create_time: number
  update_time: number
}
const notesList = ref<NoteItem[]>([])

const formatDate = (t: number) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadNotesList = async () => {
  try {
    notesList.value = await window.api.db.getNotes(userStore.id || 0, 'canvas')
  } catch {
    /* */
  }
}

const editNote = async (id: number) => {
  try {
    const note = await window.api.db.getNoteById(id, userStore.id || 0)
    if (!note) return
    currentNoteId.value = note.id
    noteTitle.value = note.title
    let scene = createSceneData()
    try {
      scene = normalizeSceneData(JSON.parse(note.content))
    } catch {
      /* */
    }
    currentScene.value = scene
    initialSnapshot.value = {
      title: note.title,
      content: serializeScene(scene)
    }
    isSaved.value = true
    isEditing.value = true
    await nextTick()
    excalidrawAPI.value?.updateScene?.({
      ...scene,
      appState: {
        ...scene.appState,
        viewBackgroundColor: scene.appState?.viewBackgroundColor ?? getCanvasBackground()
      }
    })
  } catch {
    ElMessage.error('加载失败')
  }
}

const createNewNote = () => {
  const scene = createSceneData()
  currentNoteId.value = null
  noteTitle.value = ''
  currentScene.value = scene
  initialSnapshot.value = {
    title: '',
    content: serializeScene(scene)
  }
  isSaved.value = true
  isEditing.value = true
  nextTick(() => {
    excalidrawAPI.value?.updateScene?.({
      ...scene,
      appState: {
        ...scene.appState,
        viewBackgroundColor: getCanvasBackground()
      }
    })
  })
}

const backToList = async () => {
  // if (!isSaved.value) {
  //   try {
  //     await ElMessageBox.confirm('未保存的内容将丢失，确定返回？', '提示', {
  //       confirmButtonText: '确定',
  //       cancelButtonText: '取消',
  //       type: 'warning'
  //     })
  //   } catch {
  //     return
  //   }
  // }
  isEditing.value = false
  await loadNotesList()
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
    if (isEditing.value && currentNoteId.value === id) {
      isEditing.value = false
    }
    await loadNotesList()
  } catch {
    /* */
  }
}

const saveNote = async () => {
  saving.value = true
  try {
    const data = {
      title: noteTitle.value.trim() || '无标题画板',
      content: serializeScene(currentScene.value),
      type: 'canvas',
      user_id: userStore.id || 0
    }
    if (currentNoteId.value) await window.api.db.updateNote({ id: currentNoteId.value, ...data })
    else {
      const n = await window.api.db.addNote(data)
      currentNoteId.value = n.id
    }
    initialSnapshot.value = {
      title: data.title,
      content: data.content
    }
    isSaved.value = true
    ElMessage.success('已保存')
    isEditing.value = false
    await loadNotesList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadNotesList()
  if (route.query.openId) {
    const id = parseInt(route.query.openId as string)
    if (!isNaN(id)) await editNote(id)
  }
})

onUnmounted(() => {
  excalidrawAPI.value = null
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
.canvas-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* ---- 列表 ---- */
.pw {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
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
  background: #7c3aed;
  flex-shrink: 0;
}
.left h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e1b4b;
}
.left p {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.empty-img {
  width: 160px;
  height: 160px;
  border-radius: 16px;
  opacity: 0.6;
}
.empty-txt {
  color: #9ca3af;
  font-size: 14px;
}

.grid {
  /* flex: 1; */
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 4px 0 20px;
}
.card {
  position: relative;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}
.card:hover {
  border-color: #d8b4fe;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.1);
  transform: translateY(-2px);
}
.card-preview {
  height: 100px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-emoji {
  font-size: 36px;
}
.card-body {
  padding: 12px 14px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e1b4b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
.card-del {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition: all 0.2s;
}
.card:hover .card-del {
  opacity: 1;
}
.card-del:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ---- 编辑器 ---- */
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
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}
.btn-back:hover {
  background: #f3f4f6;
  color: #1e1b4b;
}
.input-title {
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 600;
  color: #1e1b4b;
  background: transparent;
  flex: 1;
}
.input-title::placeholder {
  color: #d1d5db;
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
  color: #9ca3af;
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
  background: #7c3aed;
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
  background: #6d28d9;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.excalidraw-host {
  flex: 1;
  height: 100%;
  min-height: 0;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  background: #fafafa;
}
.excalidraw-wrapper {
  display: block;
  width: 100%;
  height: 100%;
}
.excalidraw-host :deep(.excalidraw) {
  width: 100%;
  height: 100%;
}
</style>

<style>
.canvas-container {
  height: 66vh;
  display: flex;
  min-height: 0;
}
</style>
