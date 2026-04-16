<template>
  <div class="reader-content-wrapper" :class="`theme-${theme}`">
    <el-scrollbar ref="scrollbarRef" class="reader-scrollbar">
      <div class="text-container" :style="{ fontSize: `${fontSize}px`, lineHeight: 1.8 }">
        <h1 class="novel-title">{{ title }}</h1>
        <div class="novel-body">{{ content }}</div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ReaderTheme } from '../composables/useNovelReader'

defineProps<{
  content: string
  title: string
  fontSize: number
  theme: ReaderTheme
}>()

const scrollbarRef = ref<any>(null)

defineExpose({
  scrollToTop: () => scrollbarRef.value?.setScrollTop(0)
})
</script>

<style scoped lang="scss">
.reader-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    background-color 0.3s,
    color 0.3s;

  &.theme-light {
    background-color: #f5f5f5;
    color: #333333;
    .novel-title {
      color: #111111;
      border-bottom: 1px solid #e0e0e0;
    }
  }

  &.theme-sepia {
    background-color: #fbf0d9;
    color: #5c4b37;
    .novel-title {
      color: #4a3c2c;
      border-bottom: 1px solid #e8dcc6;
    }
  }

  &.theme-dark {
    background-color: #1a1a1a;
    color: #a0a0a0;
    .novel-title {
      color: #cccccc;
      border-bottom: 1px solid #333333;
    }
  }

  .reader-scrollbar {
    height: 100%;

    .text-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px 100px;
      box-sizing: border-box;

      .novel-title {
        font-size: 2em;
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
      }

      .novel-body {
        white-space: pre-wrap;
        word-wrap: break-word;
        text-align: justify;
        text-indent: 2em; /* 首行缩进 */
      }
    }
  }
}
</style>
