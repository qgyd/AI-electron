<template>
  <div class="tool-container wechat-container">
    <div class="page-header">
      <h2>微信助手配置</h2>
      <p class="subtitle">管理仿微信通知弹窗的样式与行为</p>
    </div>

    <div class="content-card settings-form">
      <el-form label-width="140px" label-position="left">
        <el-form-item label="开启消息提醒">
          <el-switch v-model="wechatStore.enabled" />
        </el-form-item>

        <el-divider border-style="dashed" />

        <div class="section-title">系统通知增强</div>

        <el-form-item label="监听系统通知">
          <el-switch v-model="wechatStore.systemWatchEnabled" />
        </el-form-item>

        <el-form-item label="轮询间隔 (ms)">
          <el-input-number v-model="wechatStore.pollIntervalMs" :min="500" :step="250" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <div style="display: flex; flex-direction: column; line-height: 1.5">
              <span>关键词过滤</span>
              <span
                style="font-size: 12px; color: var(--el-text-color-secondary); font-weight: normal"
              >
                用于识别微信通知来源
              </span>
            </div>
          </template>
          <el-select
            v-model="wechatStore.keywords"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="例如：WeChat / 微信"
            class="w-full"
          />
        </el-form-item>

        <el-form-item>
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            description="需要在系统设置里允许微信发送通知。本功能通过读取系统通知数据库实现，属于增强提醒方案，可能受系统版本与隐私策略影响。"
            show-icon
          />
        </el-form-item>

        <el-divider border-style="dashed" />

        <div class="section-title">弹窗尺寸</div>

        <el-form-item label="弹窗宽度 (px)">
          <el-slider v-model="wechatStore.width" :min="200" :max="800" show-input />
        </el-form-item>

        <el-form-item label="弹窗高度 (px)">
          <el-slider v-model="wechatStore.height" :min="50" :max="300" show-input />
        </el-form-item>

        <el-divider border-style="dashed" />

        <div class="section-title">外观样式</div>

        <el-form-item label="背景颜色">
          <el-color-picker v-model="wechatStore.bgColor" show-alpha />
        </el-form-item>

        <el-form-item label="文字颜色">
          <el-color-picker v-model="wechatStore.textColor" show-alpha />
        </el-form-item>

        <el-form-item label="圆角大小 (px)">
          <el-slider v-model="wechatStore.borderRadius" :min="0" :max="50" show-input />
        </el-form-item>

        <el-form-item label="透明度">
          <el-slider v-model="wechatStore.opacity" :min="0" :max="1" :step="0.05" show-input />
        </el-form-item>

        <el-divider border-style="dashed" />

        <div class="section-title">行为设置</div>

        <el-form-item label="自动关闭时间 (毫秒)">
          <el-input-number v-model="wechatStore.duration" :min="1000" :step="500" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="testPopup"> 发送测试消息弹窗 </el-button>
          <el-button @click="wechatStore.resetSettings()"> 恢复默认配置 </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useWechatStore } from '@/store/wechat'

const wechatStore = useWechatStore()

const getPopupConfig = () => {
  return {
    enabled: wechatStore.enabled,
    width: wechatStore.width,
    height: wechatStore.height,
    bgColor: wechatStore.bgColor,
    textColor: wechatStore.textColor,
    borderRadius: wechatStore.borderRadius,
    opacity: wechatStore.opacity,
    duration: wechatStore.duration
  }
}

const startWatch = () => {
  if (!window.api?.wechat) return
  window.api.wechat.startWatch(getPopupConfig(), {
    pollIntervalMs: wechatStore.pollIntervalMs,
    keywords: wechatStore.keywords
  })
}

const stopWatch = () => {
  if (!window.api?.wechat) return
  window.api.wechat.stopWatch()
}

const testPopup = () => {
  if (window.api && window.api.wechat) {
    window.api.wechat.showPopup(getPopupConfig(), '这是一条来自左侧菜单栏配置页面的测试消息！')
  }
}

watch(
  () => wechatStore.systemWatchEnabled,
  (enabled) => {
    if (enabled) startWatch()
    else stopWatch()
  }
)

watch(
  () => [wechatStore.pollIntervalMs, wechatStore.keywords, wechatStore.enabled],
  () => {
    if (wechatStore.systemWatchEnabled) startWatch()
  }
)

onMounted(() => {
  if (wechatStore.systemWatchEnabled) startWatch()
})

onBeforeUnmount(() => {
  stopWatch()
})
</script>

<style scoped lang="scss">
@use '@/assets/tool-layout.scss';

.wechat-container {
  max-width: 800px;
  margin: 0 auto;

  .settings-form {
    padding: 32px 40px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-color-primary);
      margin: 24px 0 12px 0;
    }

    .el-form-item {
      margin-bottom: 24px;
    }
  }
}
</style>
