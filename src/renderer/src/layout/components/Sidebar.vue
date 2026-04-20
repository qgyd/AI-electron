<template>
  <el-aside :width="isCollapse ? '80px' : '200px'" class="aside">
    <div class="logo" :class="{ 'is-collapse': isCollapse }">
      <img :src="settingsStore.sysLogo || defaultLogo" alt="logo" />
      <span v-show="!isCollapse">{{ settingsStore.sysName }}</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="el-menu-vertical"
      :collapse="isCollapse"
      text-color="var(--el-text-color-regular)"
      :active-text-color="settingsStore.theme"
      router
    >
      <el-menu-item index="/api-test">
        <el-icon><Connection /></el-icon>
        <template #title>接口测试</template>
      </el-menu-item>

      <el-sub-menu index="/format">
        <template #title>
          <el-icon><DocumentCopy /></el-icon>
          <span>格式转换</span>
        </template>
        <el-menu-item index="/format-convert">
          <template #title>JSON格式化</template>
        </el-menu-item>
        <el-menu-item index="/image-convert">
          <template #title>图片格式转换</template>
        </el-menu-item>
        <el-menu-item index="/file-upload">
          <template #title>云端文件上传</template>
        </el-menu-item>
        <el-menu-item index="/audio-convert">
          <template #title>音频转换裁剪</template>
        </el-menu-item>
        <el-menu-item index="/video-convert">
          <template #title>视频转换裁剪</template>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/notepad">
        <el-icon><Edit /></el-icon>
        <template #title>本地记事本</template>
      </el-menu-item>

      <el-menu-item index="/novel-reader">
        <el-icon><Reading /></el-icon>
        <template #title>小说阅读</template>
      </el-menu-item>

      <el-menu-item index="/ai-chat">
        <el-icon><ChatDotSquare /></el-icon>
        <template #title>AI 智能助手</template>
      </el-menu-item>

      <!-- <el-menu-item index="/qq-chat">
        <el-icon><ChatDotRound /></el-icon>
        <template #title>QQ 聊天</template>
      </el-menu-item> -->

      <!-- <el-menu-item index="/wechat-assistant">
        <el-icon><ChatLineSquare /></el-icon>
        <template #title>微信助手</template>
      </el-menu-item> -->

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>

      <el-menu-item index="/about">
        <el-icon><InfoFilled /></el-icon>
        <template #title>关于系统</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/store/settings'
import defaultLogo from '@/assets/img/user.png'
import {
  Connection,
  DocumentCopy,
  Edit,
  Reading,
  Setting,
  ChatDotSquare,
  InfoFilled
} from '@element-plus/icons-vue'

// 接收父组件传入的 isCollapse 状态
defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()
const settingsStore = useSettingsStore()

// 根据当前路由路径高亮菜单项
const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.aside {
  background-color: var(--el-bg-color);
  transition: width 0.3s;
  overflow-x: hidden;
  border-right: 1px solid var(--el-border-color-light);
  z-index: 10;

  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    padding-left: 20px;
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 600;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    white-space: nowrap;
    overflow: hidden;
    transition: padding 0.3s;

    img {
      width: 28px;
      height: 28px;
      transition: all 0.3s;
    }

    span {
      margin-left: 12px;
      transition: opacity 0.3s;
    }

    &.is-collapse {
      padding-left: 0;
      justify-content: center;
    }
  }

  .el-menu-vertical {
    border-right: none;
    display: flex;
    flex-direction: column;
    height: calc(100% - 64px); // 减去 logo 的高度
    background-color: var(--el-bg-color);

    /* 修复 Element Plus 菜单折叠时的一些奇怪样式 */
    &:not(.el-menu--collapse) {
      width: 200px;
    }

    .el-menu-item,
    :deep(.el-sub-menu__title) {
      margin: 4px 12px;
      border-radius: 8px;
      height: 44px;
      line-height: 44px;

      &:hover {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }

    .el-menu-item.is-active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

/* 修复菜单收缩时，内部图标和文字的对齐问题 */
:deep(.el-menu--collapse) {
  width: 80px; /* 和 aside 收缩宽度保持一致 */
  .el-menu-item,
  .el-sub-menu__title {
    margin: 8px auto;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 !important; /* 强制覆盖 element-plus 的 padding */

    .el-icon {
      margin: 0;
      font-size: 18px;
    }
  }
}
:deep(.el-menu-tooltip__trigger) {
  padding: 0 10px;
}
</style>
