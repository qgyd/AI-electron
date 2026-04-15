<template>
  <div class="body-editor">
    <div class="toolbar">
      <el-radio-group v-model="model.mode" size="small" @change="emitChange">
        <el-radio-button label="json">JSON</el-radio-button>
        <el-radio-button label="text">Text</el-radio-button>
      </el-radio-group>

      <div class="toolbar-actions">
        <el-button size="small" :disabled="model.mode !== 'json'" @click="formatJson"
          >格式化</el-button
        >
        <el-button size="small" :disabled="model.mode !== 'json'" @click="validateJson"
          >校验</el-button
        >
      </div>
    </div>

    <el-input
      v-model="model.text"
      type="textarea"
      :rows="10"
      resize="none"
      placeholder="输入请求 Body"
      @input="emitChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { BodyState } from '../composables/useApiTester'

const props = defineProps<{
  modelValue: BodyState
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BodyState): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const emitChange = () => {
  emit('update:modelValue', { ...model.value })
}

const formatJson = () => {
  if (props.disabled) return
  const text = (model.value.text || '').trim()
  if (!text) return
  try {
    const obj = JSON.parse(text)
    model.value = { ...model.value, text: JSON.stringify(obj, null, 2) }
    emitChange()
  } catch (e: any) {
    ElMessage.error(e.message || 'JSON 格式不正确')
  }
}

const validateJson = () => {
  if (props.disabled) return
  const text = (model.value.text || '').trim()
  if (!text) {
    ElMessage.warning('Body 为空')
    return
  }
  try {
    JSON.parse(text)
    ElMessage.success('JSON 格式正确')
  } catch (e: any) {
    ElMessage.error(e.message || 'JSON 格式不正确')
  }
}
</script>

<style scoped lang="scss">
.body-editor {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
