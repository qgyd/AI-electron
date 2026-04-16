<template>
  <div class="reader-settings">
    <div class="setting-group">
      <span class="label">字号：</span>
      <el-button-group>
        <el-button :icon="Minus" :disabled="fontSize <= 12" @click="decreaseFont" />
        <el-button class="font-value">{{ fontSize }}px</el-button>
        <el-button :icon="Plus" :disabled="fontSize >= 48" @click="increaseFont" />
      </el-button-group>
    </div>

    <div class="setting-group">
      <span class="label">主题：</span>
      <el-radio-group v-model="currentTheme">
        <el-radio-button label="light">白天</el-radio-button>
        <el-radio-button label="sepia">护眼</el-radio-button>
        <el-radio-button label="dark">夜间</el-radio-button>
      </el-radio-group>
    </div>

    <div class="setting-group">
      <el-button type="danger" plain @click="emit('exit')">
        <el-icon><Close /></el-icon> 退出阅读
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus, Close } from '@element-plus/icons-vue'
import type { ReaderTheme } from '../composables/useNovelReader'

const props = defineProps<{
  fontSize: number
  theme: ReaderTheme
}>()

const emit = defineEmits(['update:fontSize', 'update:theme', 'exit'])

const currentTheme = computed({
  get: () => props.theme,
  set: (val) => emit('update:theme', val)
})

const decreaseFont = () => {
  if (props.fontSize > 12) emit('update:fontSize', props.fontSize - 2)
}

const increaseFont = () => {
  if (props.fontSize < 48) emit('update:fontSize', props.fontSize + 2)
}
</script>

<style scoped lang="scss">
.reader-settings {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .setting-group {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .font-value {
      width: 60px;
      pointer-events: none;
    }
  }
}
</style>
