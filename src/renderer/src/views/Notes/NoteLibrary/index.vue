<template>
  <div class="library-root">
    <div class="top">
      <div class="left">
        <span class="dot" />
        <div>
          <h1>笔记库</h1>
          <p>共 {{ notesList.length }} 条笔记</p>
        </div>
      </div>
      <el-select v-model="filterType" size="small" placeholder="全部类型" class="filter" @change="loadList">
        <el-option label="全部" value="" />
        <el-option label="本地笔记" value="text" />
        <el-option label="画板笔记" value="canvas" />
      </el-select>
    </div>

    <div v-if="notesList.length === 0" class="empty">
      <p class="empty-txt">暂无笔记</p>
    </div>

    <div v-else class="list">
      <div v-for="note in notesList" :key="note.id" class="item" @click="openNote(note)">
        <div class="item-left">
          <span class="item-emoji">{{ note.type === 'text' ? '📝' : '🎨' }}</span>
          <div>
            <div class="item-title">{{ note.title || '无标题' }}</div>
            <div class="item-time">{{ formatDate(note.update_time) }}</div>
          </div>
        </div>
        <div class="item-right">
          <span :class="['type-tag', note.type]">{{ note.type === 'text' ? '文字' : '画板' }}</span>
          <button class="item-del" @click.stop="handleDelete(note)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const filterType = ref('')

interface NoteItem { id: number; title: string; content: string; type?: string; create_time: number; update_time: number }
const notesList = ref<NoteItem[]>([])

const formatDate = (t: number) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadList = async () => {
  try { notesList.value = await window.api.db.getNotes(userStore.id || 0, filterType.value || undefined) } catch { /* */ }
}

const openNote = (note: NoteItem) => {
  router.push(`/notes/${note.type === 'text' ? 'text' : 'canvas'}?openId=${note.id}`)
}

const handleDelete = async (note: NoteItem) => {
  try {
    const t = note.type === 'text' ? '笔记' : '画板'
    await ElMessageBox.confirm(`确定删除这个${t}？`, '删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await window.api.db.deleteNote(note.id, userStore.id || 0)
    ElMessage.success('已删除'); await loadList()
  } catch { /* */ }
}

onMounted(loadList)
</script>

<style scoped>
.library-root { height:100%; display:flex; flex-direction:column; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.top { display:flex; align-items:center; justify-content:space-between; padding:20px 0; flex-shrink:0; }
.left { display:flex; align-items:center; gap:12px; }
.left .dot { width:8px; height:8px; border-radius:50%; background:#7c3aed; flex-shrink:0; }
.left h1 { margin:0; font-size:22px; font-weight:700; color:#1e1b4b; }
.left p { margin:0; font-size:13px; color:#9ca3af; }
.filter { width:140px; }

.empty { flex:1; display:flex; align-items:center; justify-content:center; }
.empty-txt { color:#9ca3af; font-size:14px; }

.list { flex:1; overflow-y:auto; padding:4px 0 20px; display:flex; flex-direction:column; gap:8px; }
.item { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#fff; border:1px solid #f3f4f6; border-radius:12px; cursor:pointer; transition:all .2s; }
.item:hover { border-color:#d8b4fe; box-shadow:0 2px 12px rgba(124,58,237,.08); }
.item-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
.item-emoji { font-size:20px; }
.item-title { font-size:14px; font-weight:600; color:#1e1b4b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-time { font-size:11px; color:#9ca3af; margin-top:2px; }
.item-right { display:flex; align-items:center; gap:10px; }
.type-tag { font-size:11px; padding:2px 8px; border-radius:20px; font-weight:500; }
.type-tag.text { background:#ede9fe; color:#7c3aed; }
.type-tag.canvas { background:#d1fae5; color:#059669; }
.item-del { width:24px; height:24px; border:none; border-radius:50%; background:transparent; color:#9ca3af; cursor:pointer; font-size:16px; line-height:1; opacity:0; transition:all .2s; }
.item:hover .item-del { opacity:1; }
.item-del:hover { background:#fef2f2; color:#ef4444; }
</style>