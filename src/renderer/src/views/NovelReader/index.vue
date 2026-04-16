<template>
  <div class="tool-container novel-reader-container">
    <!-- 如果没有内容，显示导入选择界面 -->
    <template v-if="!content">
      <div class="page-header">
        <h2>小说阅读</h2>
        <p class="subtitle">支持本地 TXT 导入和在线小说链接阅读，自动识别 GBK 中文编码</p>
      </div>

      <div v-loading="loading" class="content-card import-card">
        <el-tabs v-model="activeTab" class="import-tabs">
          <el-tab-pane label="本地导入" name="local">
            <div class="import-panel">
              <el-icon class="upload-icon"><Document /></el-icon>
              <h3>选择本地小说文件 (.txt)</h3>
              <p>支持 UTF-8 和 GBK 编码，拒绝乱码</p>

              <input
                ref="fileInput"
                type="file"
                accept=".txt"
                style="display: none"
                @change="handleFileChange"
              />
              <el-button type="primary" size="large" @click="triggerFileSelect">
                浏览本地文件
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="在线阅读" name="online">
            <div class="import-panel">
              <el-icon class="upload-icon"><Link /></el-icon>
              <h3>输入在线小说文本地址</h3>
              <p>例如：https://example.com/novel.txt (突破跨域限制)</p>

              <div class="online-input">
                <el-input
                  v-model="onlineUrl"
                  placeholder="https://"
                  size="large"
                  clearable
                  @keyup.enter="handleOnlineLoad"
                >
                  <template #append>
                    <el-button :loading="loading" @click="handleOnlineLoad"> 开始阅读 </el-button>
                  </template>
                </el-input>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- 如果已有内容，显示阅读器界面 -->
    <template v-else>
      <div class="reader-layout">
        <!-- 顶部设置栏 -->
        <ReaderSettings v-model:font-size="fontSize" v-model:theme="theme" @exit="clearContent" />

        <!-- 核心阅读区 -->
        <ReaderContent :content="content" :title="title" :font-size="fontSize" :theme="theme" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Document, Link } from '@element-plus/icons-vue'
import { useNovelReader } from './composables/useNovelReader'
import ReaderSettings from './components/ReaderSettings.vue'
import ReaderContent from './components/ReaderContent.vue'

const { content, title, loading, fontSize, theme, loadLocalFile, loadOnlineUrl, clearContent } =
  useNovelReader()

const activeTab = ref('local')
const fileInput = ref<HTMLInputElement | null>(null)
const onlineUrl = ref('')

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    loadLocalFile(target.files[0])
    // 清空 input 值，允许重复选择同一个文件
    target.value = ''
  }
}

const handleOnlineLoad = () => {
  loadOnlineUrl(onlineUrl.value)
}
</script>

<style scoped lang="scss">
@use '@/assets/tool-layout.scss';

.novel-reader-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;

  .page-header {
    padding: 24px 24px 0;
  }

  .import-card {
    margin: 24px;
    padding: 32px;
    border-radius: 12px;

    .import-tabs {
      max-width: 600px;
      margin: 0 auto;

      :deep(.el-tabs__item) {
        font-size: 16px;
      }
    }

    .import-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      background-color: var(--el-fill-color-lighter);
      border-radius: 8px;
      border: 1px dashed var(--el-border-color);
      margin-top: 24px;

      .upload-icon {
        font-size: 64px;
        color: var(--el-color-primary-light-3);
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0 0 32px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      .online-input {
        width: 100%;
        max-width: 400px;
      }
    }
  }

  .reader-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
}
</style>
