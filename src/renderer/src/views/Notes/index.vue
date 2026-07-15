<template>
  <div class="notes-root">
    <div class="notes-nav">
      <div
        v-for="t in tabs"
        :key="t.key"
        :class="['nav-item', { active: activeTab === t.key }]"
        @click="go(t.key)"
      >
        <span class="nav-emoji">{{ t.emoji }}</span>
        <span class="nav-label">{{ t.label }}</span>
      </div>
    </div>
    <div class="notes-body">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref('library')

const tabs = [
  { key: 'library', label: '笔记库', emoji: '📚' },
  { key: 'text', label: '本地笔记', emoji: '📝' },
  { key: 'canvas', label: '画板笔记', emoji: '🎨' }
]

const go = (key: string) => router.push(`/notes/${key}`)

watch(() => route.path, (p) => {
  if (p.includes('/notes/library')) activeTab.value = 'library'
  else if (p.includes('/notes/text')) activeTab.value = 'text'
  else if (p.includes('/notes/canvas')) activeTab.value = 'canvas'
}, { immediate: true })
</script>

<style scoped>
.notes-root { height:100%; display:flex; flex-direction:column; overflow:hidden; }
.notes-nav { display:flex; gap:4px; padding:0 0 20px; flex-shrink:0; }
.nav-item { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:10px; font-size:14px; font-weight:500; cursor:pointer; color:var(--el-text-color-secondary); background:transparent; transition:all .2s; border:1px solid transparent; }
.nav-item:hover { background:var(--el-color-primary-light-9); color:var(--el-color-primary); }
.nav-item.active { background:var(--el-color-primary-light-9); color:var(--el-color-primary); border-color:var(--el-color-primary-light-5); box-shadow:0 1px 3px var(--el-color-primary-light-8); }
.nav-emoji { font-size:16px; }
.notes-body { flex:1; overflow:hidden; }
</style>