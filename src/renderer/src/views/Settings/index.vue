<template>
  <div class="settings-container">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <div class="settings-content">
      <el-form label-width="160px" class="settings-form" label-position="left">
        <el-form-item label="系统名称">
          <el-input v-model="settings.sysName" placeholder="请输入系统名称" class="w-full" />
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item label="主题颜色">
          <el-color-picker v-model="settings.theme" :predefine="predefineColors" size="large" />
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item label="暗黑模式">
          <el-switch v-model="settings.darkMode" />
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item label="自动锁屏时间">
          <el-select v-model="settings.lockTime" placeholder="请选择" class="w-full">
            <el-option label="10分钟" value="10" />
            <el-option label="30分钟" value="30" />
            <el-option label="1小时" value="60" />
            <el-option label="永不" value="never" />
          </el-select>
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item label="接收系统通知">
          <el-switch v-model="settings.notify" />
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item label="系统日志位置">
          <div class="log-path-container">
            <el-input v-model="logPath" readonly class="w-full">
              <template #append>
                <el-button @click="changeLogPath">更改</el-button>
              </template>
            </el-input>
            <el-button type="primary" link class="open-dir-btn" @click="openLogFolder">
              打开所在目录
            </el-button>
          </div>
        </el-form-item>

        <el-divider border-style="dashed" />

        <el-form-item>
          <template #label>
            <div style="display: flex; flex-direction: column; line-height: 1.5">
              <span>转换默认输出目录</span>
              <span
                style="font-size: 12px; color: var(--el-text-color-secondary); font-weight: normal"
                >留空则每次弹窗选择</span
              >
            </div>
          </template>
          <div class="log-path-container">
            <el-input v-model="settings.outputDir" placeholder="未设置" readonly class="w-full">
              <template #append>
                <el-button @click="changeOutputDir">选择</el-button>
              </template>
            </el-input>
            <el-button
              v-if="settings.outputDir"
              type="danger"
              link
              class="open-dir-btn"
              @click="settings.outputDir = ''"
            >
              清除
            </el-button>
          </div>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" @click="saveSettings">保存配置</el-button>
          <el-button @click="handleReset">恢复默认</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/store/settings'

const settings = useSettingsStore()
const logPath = ref('')

onMounted(async () => {
  logPath.value = await window.api.log.getPath()
})

const changeLogPath = async () => {
  const newPath = await window.api.log.changePath()
  if (newPath !== logPath.value) {
    logPath.value = newPath
    ElMessage.success('日志位置已更新')
  }
}

const changeOutputDir = async () => {
  const newPath = await window.api.file.selectFolder()
  if (newPath && newPath !== settings.outputDir) {
    settings.outputDir = newPath
    ElMessage.success('默认输出目录已更新')
  }
}

const openLogFolder = () => {
  window.api.log.openFolder()
}

// 预定义的高级好看主题色（参考现代设计工具配色）
const predefineColors = [
  '#1677ff', // 极客蓝 (Ant Design 默认)
  '#409eff', // 元素蓝 (Element Plus 默认)
  '#2f54eb', // 极客深蓝
  '#f5222d', // 经典红
  '#fa541c', // 火山橙
  '#faad14', // 金盏花黄
  '#13c2c2', // 极光青
  '#52c41a', // 活力绿
  '#eb2f96', // 品红
  '#722ed1' // 典雅紫
]

const saveSettings = () => {
  // 因为使用了 pinia-plugin-persistedstate，数据已经自动实时同步到 localStorage
  // 这里主要给用户一个心理确认
  ElMessage.success('配置已保存')
}

const handleReset = () => {
  settings.resetSettings()
  ElMessage.success('已恢复默认配置')
}
</script>

<style scoped lang="scss">
.settings-container {
  max-width: 800px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .settings-content {
    background: var(--el-bg-color);
    border-radius: 12px;
    padding: 24px 32px;
    box-shadow: var(--el-box-shadow-light);
  }

  .settings-form {
    .el-form-item {
      margin-bottom: 0;
      padding: 16px 0;
      align-items: center;

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: var(--el-text-color-regular);
        padding-bottom: 0;
        line-height: 32px;
      }

      :deep(.el-form-item__content) {
        justify-content: flex-end;
      }
    }

    .w-full {
      width: 100%;
      max-width: 400px;
    }

    .log-path-container {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      .w-full {
        max-width: 300px;
      }

      .open-dir-btn {
        margin-left: 8px;
      }
    }

    .el-divider {
      margin: 0;
      border-color: var(--el-border-color-lighter);
    }

    .form-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color-lighter);
      display: flex;
      gap: 12px;

      .el-button {
        padding: 8px 24px;
        border-radius: 6px;
        font-weight: 500;
      }
    }
  }
}
</style>
