<template>
  <div class="kv-editor">
    <el-table :data="rows" border size="small" class="kv-table">
      <el-table-column label="" width="54" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row.enabled" @change="emitChange" />
        </template>
      </el-table-column>

      <el-table-column label="Key" min-width="180">
        <template #default="{ row }">
          <el-input v-model="row.key" placeholder="key" @input="emitChange" />
        </template>
      </el-table-column>

      <el-table-column label="Value" min-width="240">
        <template #default="{ row }">
          <el-input v-model="row.value" placeholder="value" @input="emitChange" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="90" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link :disabled="rows.length <= 1" @click="removeRow($index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="kv-actions">
      <el-button type="primary" plain @click="addRow">添加一行</el-button>
      <el-button type="info" plain @click="clearDisabled">清理空行</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KeyValueRow } from '../composables/useApiTester'

const props = defineProps<{
  modelValue: KeyValueRow[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: KeyValueRow[]): void
}>()

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const emitChange = () => {
  emit('update:modelValue', [...rows.value])
}

const addRow = () => {
  rows.value = [...rows.value, { enabled: true, key: '', value: '' }]
}

const removeRow = (index: number) => {
  const next = [...rows.value]
  next.splice(index, 1)
  rows.value = next.length > 0 ? next : [{ enabled: true, key: '', value: '' }]
}

const clearDisabled = () => {
  const next = rows.value.filter((r) => (r.key || '').trim() || (r.value || '').trim())
  rows.value = next.length > 0 ? next : [{ enabled: true, key: '', value: '' }]
}
</script>

<style scoped lang="scss">
.kv-editor {
  .kv-actions {
    margin-top: 12px;
    display: flex;
    gap: 12px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}
</style>
