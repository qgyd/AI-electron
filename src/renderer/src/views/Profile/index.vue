<template>
  <div class="tool-container profile-container">
    <div class="page-header">
      <h2>个人设置</h2>
      <p class="subtitle">管理您的账号信息和安全设置</p>
    </div>

    <div class="content-card">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="基本信息" name="info">
          <BasicInfo />
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <SecuritySetting />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BasicInfo from './components/BasicInfo.vue'
import SecuritySetting from './components/SecuritySetting.vue'

const activeTab = ref('info')
</script>

<style scoped lang="scss">
@use '@/assets/tool-layout.scss';

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;

  .content-card {
    padding: 24px 32px;
  }
}

.profile-tabs {
  :deep(.el-tabs__item) {
    font-size: 16px;
    padding: 0 24px;
  }
}
</style>
