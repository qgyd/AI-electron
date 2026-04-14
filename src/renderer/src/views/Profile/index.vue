<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人设置</h2>
      <p class="subtitle">管理您的账号信息和安全设置</p>
    </div>

    <div class="content-card">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="info">
          <el-form
            ref="infoFormRef"
            :model="infoForm"
            :rules="infoRules"
            label-width="100px"
            class="profile-form"
          >
            <el-form-item label="头像" prop="avatar">
              <div class="avatar-uploader">
                <el-avatar
                  :size="80"
                  :src="
                    infoForm.avatar ||
                    'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
                  "
                />
                <div class="avatar-tip">暂不支持上传本地图片，请填入图片URL</div>
              </div>
            </el-form-item>

            <el-form-item label="头像链接" prop="avatar">
              <el-input v-model="infoForm.avatar" placeholder="输入图片网络地址" clearable />
            </el-form-item>

            <el-form-item label="用户名" prop="username">
              <el-input v-model="infoForm.username" placeholder="请输入新用户名" clearable />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="isSaving" @click="handleUpdateInfo">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 修改密码 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
            class="profile-form"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入原密码"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
              />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="isSaving" @click="handleUpdatePassword">
                更新密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const activeTab = ref('info')
const isSaving = ref(false)

// --- 基本信息 ---
const infoFormRef = ref<FormInstance>()
const infoForm = reactive({
  username: '',
  avatar: ''
})

const infoRules = reactive<FormRules>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  avatar: [
    { required: true, message: '头像链接不能为空', trigger: 'blur' },
    { type: 'url', message: '请输入正确的图片URL', trigger: 'blur' }
  ]
})

// --- 安全设置 ---
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPwd = (_rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const pwdRules = reactive<FormRules>({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPwd, trigger: 'blur' }]
})

onMounted(() => {
  // 初始化表单数据
  infoForm.username = userStore.username
  infoForm.avatar = userStore.avatar
})

const handleUpdateInfo = async () => {
  if (!infoFormRef.value) return
  await infoFormRef.value.validate(async (valid) => {
    if (valid) {
      isSaving.value = true
      try {
        const res = await window.api.db.updateUserInfo({
          id: userStore.id,
          username: infoForm.username,
          avatar: infoForm.avatar
        })
        if (res.success) {
          ElMessage.success('个人信息更新成功')
          userStore.setUser({
            ...userStore.$state,
            username: infoForm.username,
            avatar: infoForm.avatar
          })
        } else {
          ElMessage.error(res.message || '更新失败')
        }
      } catch (err: any) {
        ElMessage.error(err.message || '更新异常')
      } finally {
        isSaving.value = false
      }
    }
  })
}

const handleUpdatePassword = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      isSaving.value = true
      try {
        const res = await window.api.db.updatePassword({
          id: userStore.id,
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        })
        if (res.success) {
          ElMessage.success('密码修改成功，请重新登录')
          userStore.logout()
          router.push('/login')
        } else {
          ElMessage.error(res.message || '密码修改失败')
        }
      } catch (err: any) {
        ElMessage.error(err.message || '密码修改异常')
      } finally {
        isSaving.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
@import '@/assets/tool-layout.scss';

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

.profile-form {
  margin-top: 32px;

  .avatar-uploader {
    display: flex;
    align-items: center;
    gap: 24px;

    .avatar-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
