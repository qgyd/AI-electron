<template>
  <el-form
    ref="infoFormRef"
    :model="infoForm"
    :rules="infoRules"
    label-width="100px"
    class="profile-form"
  >
    <el-form-item label="头像" prop="avatar">
      <div class="avatar-uploader-container">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          accept="image/*"
          @change="handleAvatarChange"
        >
          <div v-loading="isUploadingAvatar" class="avatar-wrapper">
            <el-avatar
              :size="80"
              :src="
                infoForm.avatar ||
                'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
              "
            />
            <div class="avatar-upload-mask">
              <el-icon><Camera /></el-icon>
            </div>
          </div>
        </el-upload>
        <div class="avatar-tip">点击头像可上传本地图片作为新头像</div>
      </div>
    </el-form-item>

    <el-form-item label="头像链接" prop="avatar">
      <el-input v-model="infoForm.avatar" placeholder="或直接输入图片网络地址" clearable />
    </el-form-item>

    <el-form-item label="用户名" prop="username">
      <el-input v-model="infoForm.username" placeholder="请输入新用户名" clearable />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" :loading="isSaving" @click="handleUpdateInfo"> 保存修改 </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const isSaving = ref(false)
const isUploadingAvatar = ref(false)

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

onMounted(() => {
  infoForm.username = userStore.username
  infoForm.avatar = userStore.avatar
})

const handleAvatarChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return
  const isImage = uploadFile.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('请上传图片文件!')
    return
  }

  let filePath = ''
  if (window.api && window.api.media) {
    filePath = window.api.media.getFilePath(uploadFile.raw)
  } else {
    filePath = (uploadFile.raw as any).path || ''
  }

  if (!filePath) {
    ElMessage.error('无法获取文件路径')
    return
  }

  isUploadingAvatar.value = true
  try {
    const name = uploadFile.raw.name
    const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : 'png'

    const res = await window.api.file.upload({
      filePath: filePath,
      bucketType: 1, // 公共空间
      fileType: ext || 'png'
    })

    if (res.success && res.data) {
      let url = res.data.url || (typeof res.data === 'string' ? res.data : null)
      if (url) {
        url = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
        infoForm.avatar = url
        ElMessage.success('头像上传成功，请点击保存生效')
      } else {
        ElMessage.error('未获取到返回的网络地址')
      }
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error: any) {
    console.error('上传头像异常:', error)
    ElMessage.error(error.message || '上传异常')
  } finally {
    isUploadingAvatar.value = false
  }
}

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
</script>

<style scoped lang="scss">
.profile-form {
  margin-top: 32px;

  .avatar-uploader-container {
    display: flex;
    align-items: center;
    gap: 24px;

    .avatar-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;

      &:hover .avatar-upload-mask {
        opacity: 1;
      }
    }

    .avatar-upload-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 24px;
    }

    .avatar-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
