<template>
  <el-container class="layout-container">
    <Sidebar :is-collapse="isCollapse" />

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">小工具</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <!-- 快捷暗黑模式切换 -->
          <div
            class="action-item"
            :title="settingsStore.darkMode ? '切换为亮色模式' : '切换为暗黑模式'"
            @click="toggleDarkMode"
          >
            <el-icon :class="{ 'is-dark': settingsStore.darkMode }">
              <Moon v-if="settingsStore.darkMode" />
              <Sunny v-else />
            </el-icon>
          </div>

          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link user-info">
              <el-avatar
                size="small"
                :src="
                  userStore.avatar ||
                  'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
                "
              />
              <span class="username">{{ userStore.username }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <el-scrollbar>
          <div class="main-content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade-transform" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import Sidebar from './components/Sidebar.vue'
import { useSettingsStore } from '@/store/settings'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const userStore = useUserStore()

const isCollapse = ref(false)

const currentRouteName = computed(() => route.meta.title || route.name)

const toggleCollapse = (): void => {
  isCollapse.value = !isCollapse.value
}

const toggleDarkMode = (): void => {
  settingsStore.darkMode = !settingsStore.darkMode
}

const handleCommand = (command: string): void => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确认退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  flex: 1;
  width: 100vw;
  overflow: hidden;

  .header {
    background-color: var(--el-bg-color);
    box-shadow: 0 1px 4px var(--el-box-shadow-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 64px;
    z-index: 9;

    .header-left {
      display: flex;
      align-items: center;

      .collapse-icon {
        font-size: 22px;
        cursor: pointer;
        margin-right: 20px;
        color: var(--el-text-color-regular);
        // padding: 6px;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
        }
      }

      .el-breadcrumb {
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .action-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--el-text-color-regular);
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
        }

        .el-icon {
          font-size: 18px;

          &.is-dark {
            color: #fadb14; // 月亮图标使用黄色，更醒目
          }
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;
        outline: none;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background-color 0.3s;

        &:hover {
          background-color: var(--el-color-info-light-9);
        }

        .username {
          margin: 0 8px;
          color: var(--el-text-color-primary);
          font-size: 14px;
        }
      }
    }
  }

  .main {
    background-color: var(--el-bg-color-page);
    padding: 0;
    box-sizing: border-box;
    height: calc(100% - 64px); // 减去 header 高度
    overflow: hidden; // 隐藏原生滚动条

    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden; // 防止出现横向滚动条
    }

    .main-content-wrapper {
      padding: 24px;
      min-height: 100%;
      box-sizing: border-box;

      /* 全局隐藏原生滚动条的类，以防万一 */
      ::-webkit-scrollbar {
        display: none;
      }
      * {
        scrollbar-width: none;
      }
    }
  }
}

// 页面切换动画
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
