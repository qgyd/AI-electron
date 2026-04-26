<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="title">{{ isRegister ? '账号注册' : '系统登录' }}</h2>
      </template>
      <el-form ref="loginFormRef" :model="loginForm" :rules="rules">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-form-item v-if="isRegister" prop="confirmPassword">
          <el-input
            v-model="loginForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleSubmit">
            {{ isRegister ? '注 册' : '登 录' }}
          </el-button>
        </el-form-item>
        <div class="toggle-mode">
          <el-link type="primary" :underline="false" @click="toggleMode">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const isRegister = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (isRegister.value) {
    if (value === '') {
      callback(new Error('请再次输入密码'))
    } else if (value !== loginForm.password) {
      callback(new Error('两次输入密码不一致!'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

const toggleMode = () => {
  isRegister.value = !isRegister.value
  loginFormRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isRegister.value) {
          // 注册逻辑
          const res = await window.api.db.register({
            username: loginForm.username,
            password: loginForm.password
          })
          if (res.success) {
            ElMessage.success('注册成功，请登录')
            isRegister.value = false
            loginForm.password = ''
            loginForm.confirmPassword = ''
          } else {
            ElMessage.error(res.message || '注册失败')
          }
        } else {
          // 登录逻辑
          const res = await window.api.db.login({
            username: loginForm.username,
            password: loginForm.password
          })
          if (res.success && res.user) {
            userStore.setUser(res.user)
            ElMessage.success('登录成功')
            router.push('/')
          } else {
            ElMessage.error(res.message || '登录失败')
          }
        }
      } catch (err: any) {
        ElMessage.error(err.message || (isRegister.value ? '注册异常' : '登录异常'))
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f0f2f5;
  background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='smallGrid' width='8' height='8' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 8 0 L 0 0 0 8' fill='none' stroke='%23e0e0e0' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23smallGrid)'/%3E%3C/svg%3E");

  .login-card {
    width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

    .title {
      text-align: center;
      margin: 0;
      font-size: 24px;
      color: #303133;
    }

    .login-btn {
      width: 100%;
      margin-top: 10px;
    }

    .toggle-mode {
      text-align: right;
      margin-top: -10px;
      margin-bottom: 10px;
    }
  }
}
</style>
