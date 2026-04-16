import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: {
      title: '登录系统',
      hidden: true
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/api-test', // 访问首页时重定向到接口测试
    children: [
      {
        path: 'api-test',
        name: 'ApiTest',
        component: () => import('@/views/ApiTest/index.vue'),
        meta: {
          title: '接口测试',
          icon: 'Connection'
        }
      },
      {
        path: 'format-convert',
        name: 'FormatConvert',
        component: () => import('@/views/FormatConvert/index.vue'),
        meta: {
          title: 'JSON格式化',
          icon: 'DocumentCopy'
        }
      },
      {
        path: 'image-convert',
        name: 'ImageConvert',
        component: () => import('@/views/ImageConvert/index.vue'),
        meta: {
          title: '图片格式转换',
          icon: 'Picture'
        }
      },
      {
        path: 'file-upload',
        name: 'FileUpload',
        component: () => import('@/views/FileUpload/index.vue'),
        meta: {
          title: '云端文件上传',
          icon: 'UploadFilled'
        }
      },
      {
        path: 'audio-convert',
        name: 'AudioConvert',
        component: () => import('@/views/AudioConvert/index.vue'),
        meta: {
          title: '音频转换裁剪',
          icon: 'Microphone'
        }
      },
      {
        path: 'video-convert',
        name: 'VideoConvert',
        component: () => import('@/views/VideoConvert/index.vue'),
        meta: {
          title: '视频转换裁剪',
          icon: 'VideoCamera'
        }
      },
      {
        path: 'notepad',
        name: 'Notepad',
        component: () => import('@/views/Notepad/index.vue'),
        meta: {
          title: '本地记事本',
          icon: 'Edit'
        }
      },
      {
        path: 'novel-reader',
        name: 'NovelReader',
        component: () => import('@/views/NovelReader/index.vue'),
        meta: {
          title: '小说阅读',
          icon: 'Reading'
        }
      },
      {
        path: 'ai-chat',
        name: 'AIChat',
        component: () => import('@/views/AIChat/index.vue'),
        meta: {
          title: 'AI 智能助手',
          icon: 'ChatDotSquare'
        }
      },
      {
        path: 'wechat-assistant',
        name: 'WechatAssistant',
        component: () => import('@/views/WechatAssistant/index.vue'),
        meta: {
          title: '微信助手',
          icon: 'ChatLineSquare'
        }
      },
      {
        path: 'qq-chat',
        name: 'QQChat',
        component: () => import('@/views/QQChat/index.vue'),
        meta: {
          title: 'QQ聊天',
          icon: 'ChatDotRound'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings/index.vue'),
        meta: {
          title: '系统设置',
          icon: 'Setting'
        }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About/index.vue'),
        meta: {
          title: '关于',
          icon: 'InfoFilled'
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: {
          title: '个人设置',
          hidden: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 简单的路由守卫（路由拦截拦截）
router.beforeEach((to, _from, next): void => {
  // 设置页面标题
  document.title = `${to.meta.title || 'MyTool'}`

  const userStore = useUserStore()

  if (!userStore.id && to.path !== '/login') {
    next('/login')
  } else if (userStore.id && to.path === '/login') {
    next('/')
  } else {
    next()
  }
})

export default router
