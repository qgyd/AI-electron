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
          <el-button type="primary" @click="testPopup">
            发送测试消息弹窗
          </el-button>
          <el-button @click="wechatStore.resetSettings()">
            恢复默认配置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWechatStore } from '@/store/wechat'

const wechatStore = useWechatStore()

const testPopup = () => {
  // 从 Store 获取纯数据对象
  const config = {
    enabled: wechatStore.enabled,
    width: wechatStore.width,
    height: wechatStore.height,
    bgColor: wechatStore.bgColor,
    textColor: wechatStore.textColor,
    borderRadius: wechatStore.borderRadius,
    opacity: wechatStore.opacity,
    duration: wechatStore.duration
  }

  if (window.api && window.api.wechat) {
    window.api.wechat.showPopup(config, '这是一条来自左侧菜单栏配置页面的测试消息！')
  }
}
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
