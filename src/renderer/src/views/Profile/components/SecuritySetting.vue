<template>
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
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const isSaving = ref(false)

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
.profile-form {
  margin-top: 32px;
}
</style>
