<template>
  <div class="ai-chat-page">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <div class="header-left">
        <el-icon :size="20"><Cpu /></el-icon>
        <h2>AI 实验室</h2>
        <el-tag size="small" type="info" effect="plain">Agnes 模型测试</el-tag>
      </div>
      <div class="header-right">
        <el-button text @click="showSettings = !showSettings">
          <el-icon><Setting /></el-icon>
          {{ showSettings ? '收起设置' : '参数设置' }}
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="chat-tabs">
      <el-tab-pane name="chat">
        <template #label>
          <span class="tab-label"
            ><el-icon><ChatDotRound /></el-icon> 对话</span
          >
        </template>
      </el-tab-pane>
      <el-tab-pane name="image">
        <template #label>
          <span class="tab-label"
            ><el-icon><Picture /></el-icon> 图片生成</span
          >
        </template>
      </el-tab-pane>
      <el-tab-pane name="video">
        <template #label>
          <span class="tab-label"
            ><el-icon><VideoCamera /></el-icon> 视频生成</span
          >
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 参数设置面板（共享） -->
    <el-collapse-transition>
      <div v-show="showSettings" class="settings-panel">
        <el-card shadow="never">
          <el-form :model="sharedConfig" label-width="100px" size="default">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="API 地址">
                  <el-input
                    v-model="sharedConfig.baseURL"
                    placeholder="https://apihub.agnes-ai.com"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="API Key">
                  <el-input
                    v-model="sharedConfig.apiKey"
                    type="password"
                    show-password
                    placeholder="sk-..."
                    clearable
                  />
                </el-form-item>
              </el-col>

              <!-- 对话专属设置 -->
              <template v-if="activeTab === 'chat'">
                <el-col :span="12">
                  <el-form-item label="对话模型">
                    <el-input
                      v-model="sharedConfig.chatModel"
                      placeholder="agnes-2.0-flash"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Temperature">
                    <el-slider
                      v-model="sharedConfig.temperature"
                      :min="0"
                      :max="2"
                      :step="0.1"
                      :marks="{ 0: '0', 0.7: '0.7', 1: '1', 2: '2' }"
                      show-input
                      :show-input-controls="false"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Max Tokens">
                    <el-input-number
                      v-model="sharedConfig.maxTokens"
                      :min="64"
                      :max="32768"
                      :step="256"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="System Prompt">
                    <el-input
                      v-model="sharedConfig.systemPrompt"
                      type="textarea"
                      :rows="2"
                      placeholder="你是一个有帮助的AI助手。"
                    />
                  </el-form-item>
                </el-col>
              </template>

              <!-- 图片生成专属设置 -->
              <template v-if="activeTab === 'image'">
                <el-col :span="12">
                  <el-form-item label="图片模型">
                    <el-input
                      v-model="sharedConfig.imageModel"
                      placeholder="agnes-image-2.0-flash"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="默认尺寸">
                    <el-select v-model="sharedConfig.imageSize" style="width: 100%">
                      <el-option
                        v-for="s in IMAGE_SIZES"
                        :key="s.value"
                        :label="s.label"
                        :value="s.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </template>

              <!-- 视频生成专属设置 -->
              <template v-if="activeTab === 'video'">
                <el-col :span="12">
                  <el-form-item label="视频模型">
                    <el-input
                      v-model="sharedConfig.videoModel"
                      placeholder="agnes-video-v2.0"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="默认帧数">
                    <el-input-number
                      v-model="sharedConfig.videoNumFrames"
                      :min="16"
                      :max="241"
                      :step="1"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="默认帧率">
                    <el-select v-model="sharedConfig.videoFrameRate" style="width: 100%">
                      <el-option
                        v-for="r in [16, 24, 30]"
                        :key="r"
                        :label="`${r} fps`"
                        :value="r"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </template>
            </el-row>
          </el-form>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- ==================== 对话 Tab ==================== -->
    <template v-if="activeTab === 'chat'">
      <div ref="messagesContainer" class="chat-messages">
        <div v-if="messages.length === 0" class="chat-placeholder">
          <el-icon :size="64" color="var(--app-text-tertiary, #94a3b8)"><ChatDotRound /></el-icon>
          <p class="placeholder-title">AI 模型测试对话框</p>
          <p class="placeholder-desc">配置 API 参数后，开始与 Agnes 模型对话</p>
          <div class="placeholder-tips">
            <el-tag
              v-for="tip in quickTips"
              :key="tip"
              class="tip-tag"
              @click="handleQuickTip(tip)"
              >{{ tip }}</el-tag
            >
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="msg.role">
          <div class="message-avatar">
            <el-avatar v-if="msg.role === 'user'" :size="36" icon="UserFilled" />
            <el-avatar v-else :size="36" style="background: #3b82f6"
              ><el-icon :size="20"><Cpu /></el-icon
            ></el-avatar>
          </div>
          <div class="message-body">
            <div class="message-role">
              {{ msg.role === 'user' ? '你' : sharedConfig.chatModel || 'AI'
              }}<span class="message-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="message-content">
              <div
                v-if="msg.role === 'assistant'"
                class="markdown-body"
                v-html="renderMarkdown(msg.content)"
              />
              <div v-else class="user-text">{{ msg.content }}</div>
              <span v-if="msg.role === 'assistant' && msg.streaming" class="streaming-cursor"
                >▍</span
              >
              <div v-if="msg.error" class="message-error">
                <el-icon><WarningFilled /></el-icon>{{ msg.error }}
              </div>
            </div>
            <div
              v-if="msg.role === 'assistant' && !msg.streaming && !msg.error"
              class="message-actions"
            >
              <el-button text size="small" @click="copyMessage(msg.content)"
                ><el-icon><CopyDocument /></el-icon>复制</el-button
              >
              <el-button text size="small" @click="regenerateMessage(idx)"
                ><el-icon><Refresh /></el-icon>重新生成</el-button
              >
            </div>
          </div>
        </div>

        <div v-if="loading && !streamingContent" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar :size="36" style="background: #3b82f6"
              ><el-icon :size="20"><Cpu /></el-icon
            ></el-avatar>
          </div>
          <div class="message-body">
            <div class="message-content">
              <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="lastUsage" class="usage-info">
        <span
          >本次消耗：{{ lastUsage.prompt_tokens }} prompt +
          {{ lastUsage.completion_tokens }} completion = {{ lastUsage.total_tokens }} tokens</span
        >
      </div>

      <div class="chat-input-area">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          resize="none"
          :disabled="loading"
          @keydown.enter="handleEnterKey"
        />
        <div class="input-actions">
          <span class="char-count">{{ inputText.length }} 字符</span>
          <el-button
            v-if="!loading"
            type="primary"
            :disabled="!inputText.trim()"
            @click="sendMessage"
            ><el-icon><Promotion /></el-icon>发送</el-button
          >
          <el-button v-else type="danger" @click="stopStreaming"
            ><el-icon><CloseBold /></el-icon>停止</el-button
          >
        </div>
        <el-button
          text
          type="danger"
          size="small"
          :disabled="messages.length === 0"
          style="margin-top: 8px"
          @click="handleClearChat"
          ><el-icon><Delete /></el-icon>清空对话</el-button
        >
      </div>
    </template>

    <!-- ==================== 图片生成 Tab ==================== -->
    <template v-if="activeTab === 'image'">
      <div class="media-gen-body">
        <div class="media-input-area">
          <el-input
            v-model="imagePrompt"
            type="textarea"
            :rows="4"
            placeholder="描述你想生成的图片... 例如：A clean product photo of a glass cube on a white studio background, soft shadows, high detail"
            resize="none"
            :disabled="imageLoading"
          />
          <div class="media-gen-options">
            <div class="option-group">
              <span class="option-label">尺寸：</span>
              <el-select v-model="imageSize" :disabled="imageLoading" style="width: 160px">
                <el-option
                  v-for="s in IMAGE_SIZES"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </div>
            <el-button
              type="primary"
              :loading="imageLoading"
              :disabled="!imagePrompt.trim()"
              @click="generateImage"
              ><el-icon><Picture /></el-icon>生成图片</el-button
            >
          </div>
        </div>

        <div v-if="imageLoading" class="media-loading-area">
          <div class="media-loading-placeholder">
            <el-icon :size="48" class="is-loading"><Loading /></el-icon>
            <p>正在生成图片，请稍候...</p>
          </div>
        </div>

        <div v-if="currentImage && !imageLoading" class="media-result-area">
          <el-card shadow="hover" class="media-result-card">
            <div class="media-result-header">
              <span class="result-label">生成结果</span>
              <span class="result-meta"
                >{{ currentImage.size }} · {{ formatTime(currentImage.timestamp) }}</span
              >
              <div class="result-actions">
                <el-button text size="small" @click="copyText(currentImage.url)"
                  ><el-icon><CopyDocument /></el-icon>复制链接</el-button
                >
                <el-button
                  text
                  size="small"
                  @click="downloadFile(currentImage.url, `agnes-image-${currentImage.id}.png`)"
                  ><el-icon><Download /></el-icon>下载</el-button
                >
              </div>
            </div>
            <div class="media-result-body">
              <img
                :src="currentImage.url"
                :alt="currentImage.prompt"
                @click="previewMedia = { type: 'image', url: currentImage.url }"
              />
              <p class="media-prompt-text">{{ currentImage.prompt }}</p>
            </div>
          </el-card>
        </div>

        <div v-if="imageError" class="media-error-area">
          <el-alert
            :title="imageError"
            type="error"
            show-icon
            :closable="true"
            @close="imageError = ''"
          />
        </div>

        <div v-if="imageHistory.length > 0" class="media-history-area">
          <div class="history-header">
            <span>历史记录（{{ imageHistory.length }}）</span>
            <el-button
              text
              size="small"
              type="danger"
              @click="
                () => {
                  imageHistory = []
                  currentImage = null
                }
              "
              ><el-icon><Delete /></el-icon>清空</el-button
            >
          </div>
          <div class="history-grid">
            <div
              v-for="img in imageHistory"
              :key="img.id"
              class="history-item"
              :class="{ active: currentImage?.id === img.id }"
              @click="currentImage = img"
            >
              <img :src="img.url" :alt="img.prompt" />
              <div class="history-item-overlay">
                <span>{{ img.size }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!currentImage && !imageLoading && !imageError && imageHistory.length === 0"
          class="media-placeholder"
        >
          <el-icon :size="64" color="var(--app-text-tertiary, #94a3b8)"><Picture /></el-icon>
          <p class="placeholder-title">AI 图片生成</p>
          <p class="placeholder-desc">输入描述词，使用 Agnes 图片模型生成图片</p>
        </div>
      </div>
    </template>

    <!-- ==================== 视频生成 Tab ==================== -->
    <template v-if="activeTab === 'video'">
      <div class="media-gen-body">
        <!-- 输入区 -->
        <div class="media-input-area">
          <el-input
            v-model="videoPrompt"
            type="textarea"
            :rows="4"
            placeholder="描述你想生成的视频... 例如：A cinematic shot of a cat walking on the beach at sunset, soft ocean waves, warm golden lighting, realistic motion"
            resize="none"
            :disabled="videoLoading"
          />
          <div class="media-gen-options video-options">
            <div class="option-group">
              <span class="option-label">分辨率：</span>
              <el-select
                v-model="videoPreset"
                :disabled="videoLoading"
                style="width: 160px"
                @change="onVideoPresetChange"
              >
                <el-option
                  v-for="p in VIDEO_PRESETS"
                  :key="p.label"
                  :label="p.label"
                  :value="p.label"
                />
              </el-select>
            </div>
            <div class="option-group">
              <span class="option-label">帧数：</span>
              <el-input-number
                v-model="videoNumFrames"
                :min="16"
                :max="241"
                :step="1"
                :disabled="videoLoading"
                controls-position="right"
                size="default"
                style="width: 130px"
              />
            </div>
            <div class="option-group">
              <span class="option-label">帧率：</span>
              <el-select v-model="videoFrameRate" :disabled="videoLoading" style="width: 100px">
                <el-option v-for="r in [16, 24, 30]" :key="r" :label="`${r} fps`" :value="r" />
              </el-select>
            </div>
            <el-button
              type="primary"
              :loading="videoLoading"
              :disabled="!videoPrompt.trim()"
              @click="generateVideo"
              ><el-icon><VideoCamera /></el-icon>生成视频</el-button
            >
          </div>
          <div class="video-params-hint">
            分辨率 {{ currentVideoPreset.width }}×{{ currentVideoPreset.height }} ·
            {{ videoNumFrames }} 帧 · {{ videoFrameRate }} fps
            <span v-if="videoNumFrames > 0 && videoFrameRate > 0">
              · ≈{{ (videoNumFrames / videoFrameRate).toFixed(1) }}秒</span
            >
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="videoLoading" class="media-loading-area">
          <div class="media-loading-placeholder">
            <el-icon :size="48" class="is-loading"><Loading /></el-icon>
            <p>{{ videoStatusText || '正在提交视频生成任务...' }}</p>
            <p class="loading-sub">
              生成 {{ videoNumFrames }} 帧视频 ·
              {{ (videoNumFrames / videoFrameRate).toFixed(1) }} 秒
            </p>
            <el-button
              text
              type="danger"
              size="small"
              style="margin-top: 12px"
              @click="cancelVideoPolling"
              >取消</el-button
            >
          </div>
        </div>

        <!-- 当前结果 -->
        <div v-if="currentVideo && !videoLoading" class="media-result-area">
          <el-card shadow="hover" class="media-result-card">
            <div class="media-result-header">
              <span class="result-label">生成结果</span>
              <span class="result-meta">
                {{ currentVideo.sizeDisplay || `${currentVideo.width}×${currentVideo.height}` }}
                <template v-if="currentVideo.seconds"> · {{ currentVideo.seconds }}秒</template>
                · {{ currentVideo.numFrames }}帧 · {{ currentVideo.frameRate }}fps ·
                {{ formatTime(currentVideo.timestamp) }}
              </span>
              <div class="result-actions">
                <el-button text size="small" @click="copyText(currentVideo.url)"
                  ><el-icon><CopyDocument /></el-icon>复制链接</el-button
                >
                <el-button
                  text
                  size="small"
                  @click="downloadFile(currentVideo.url, `agnes-video-${currentVideo.id}.mp4`)"
                  ><el-icon><Download /></el-icon>下载</el-button
                >
              </div>
            </div>
            <div class="media-result-body">
              <video
                :src="currentVideo.url"
                controls
                autoplay
                loop
                muted
                playsinline
                class="video-player"
              />
              <p class="media-prompt-text">{{ currentVideo.prompt }}</p>
            </div>
          </el-card>
        </div>

        <!-- 错误 -->
        <div v-if="videoError" class="media-error-area">
          <el-alert
            :title="videoError"
            type="error"
            show-icon
            :closable="true"
            @close="videoError = ''"
          />
        </div>

        <!-- 历史记录 -->
        <div v-if="videoHistory.length > 0" class="media-history-area">
          <div class="history-header">
            <span>历史记录（{{ videoHistory.length }}）</span>
            <el-button
              text
              size="small"
              type="danger"
              @click="
                () => {
                  videoHistory = []
                  currentVideo = null
                }
              "
              ><el-icon><Delete /></el-icon>清空</el-button
            >
          </div>
          <div class="history-grid video-grid">
            <div
              v-for="v in videoHistory"
              :key="v.id"
              class="history-item video-history-item"
              :class="{ active: currentVideo?.id === v.id }"
              @click="currentVideo = v"
            >
              <video :src="v.url" muted preload="metadata" />
              <div class="history-item-overlay">
                <span>{{ v.width }}×{{ v.height }}</span>
                <el-icon :size="16"><VideoPlay /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="!currentVideo && !videoLoading && !videoError && videoHistory.length === 0"
          class="media-placeholder"
        >
          <el-icon :size="64" color="var(--app-text-tertiary, #94a3b8)"><VideoCamera /></el-icon>
          <p class="placeholder-title">AI 视频生成</p>
          <p class="placeholder-desc">输入描述词，使用 Agnes 视频模型生成视频</p>
        </div>
      </div>
    </template>

    <!-- 媒体预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="预览"
      width="auto"
      :close-on-click-modal="true"
      center
    >
      <img
        v-if="previewMedia?.type === 'image'"
        :src="previewMedia.url"
        alt="preview"
        style="max-width: 100%; max-height: 80vh; border-radius: 6px"
      />
      <video
        v-else-if="previewMedia?.type === 'video'"
        :src="previewMedia.url"
        controls
        autoplay
        loop
        style="max-width: 90vw; max-height: 80vh; border-radius: 6px"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/store/settings'

// ==================== 常量 ====================

const IMAGE_SIZES = [
  { label: '512×512 (正方形)', value: '512x512' },
  { label: '1024×768 (横版)', value: '1024x768' },
  { label: '768×1024 (竖版)', value: '768x1024' },
  { label: '1024×1024 (正方形)', value: '1024x1024' },
  { label: '1792×1024 (宽屏)', value: '1792x1024' },
  { label: '1024×1792 (长图)', value: '1024x1792' }
]

const VIDEO_PRESETS = [
  { label: '1152×768 (3:2 横版)', width: 1152, height: 768 },
  { label: '768×1152 (2:3 竖版)', width: 768, height: 1152 },
  { label: '1024×1024 (1:1 方形)', width: 1024, height: 1024 },
  { label: '1280×720 (16:9 横版)', width: 1280, height: 720 },
  { label: '720×1280 (9:16 竖版)', width: 720, height: 1280 }
]

// ==================== 类型 ====================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  streaming?: boolean
  error?: string
}

interface SharedConfig {
  baseURL: string
  apiKey: string
  chatModel: string
  imageModel: string
  videoModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  imageSize: string
  videoNumFrames: number
  videoFrameRate: number
}

interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface ImageRecord {
  id: number
  url: string
  prompt: string
  size: string
  timestamp: number
}

interface VideoRecord {
  id: number
  url: string
  prompt: string
  width: number
  height: number
  numFrames: number
  frameRate: number
  timestamp: number
  seconds?: string
  sizeDisplay?: string
}

// ==================== Markdown ====================

marked.setOptions({ breaks: true, gfm: true })

// ==================== 共享状态 ====================

// 设置面板状态
const activeTab = ref<'chat' | 'image' | 'video'>('chat')
const showSettings = ref(false)

// 从全局设置存储读取配置，不写死任何 Key
const settings = useSettingsStore()

function buildSharedConfig(): SharedConfig {
  return {
    baseURL: settings.aiBaseUrl || 'https://apihub.agnes-ai.com',
    apiKey: settings.aiApiKey || '',
    chatModel: settings.aiModel || 'agnes-2.0-flash',
    imageModel: settings.aiImageModel || 'agnes-image-2.0-flash',
    videoModel: settings.aiVideoModel || 'agnes-video-v2.0',
    temperature: settings.aiTemperature ?? 0.7,
    maxTokens: settings.aiMaxTokens ?? 4096,
    systemPrompt: settings.aiSystemPrompt || '你是一个有帮助的AI助手，请用中文回答。',
    imageSize: settings.aiImageSize || '1024x768',
    videoNumFrames: settings.aiVideoNumFrames ?? 121,
    videoFrameRate: settings.aiVideoFrameRate ?? 24,
  }
}

const sharedConfig = reactive<SharedConfig>(buildSharedConfig())

// ==================== 对话状态 ====================

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const streamingContent = ref('')
const lastUsage = ref<TokenUsage | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const abortController = ref<AbortController | null>(null)

const quickTips = [
  '介绍一下你自己',
  '用Python写一个快速排序',
  '解释一下什么是RESTful API',
  '写一首关于编程的诗'
]

// ==================== 图片生成状态 ====================

const imagePrompt = ref('')
const imageSize = ref('1024x768')
const imageLoading = ref(false)
const imageError = ref('')
const currentImage = ref<ImageRecord | null>(null)
const imageHistory = ref<ImageRecord[]>([])
let imageIdCounter = 0

// ==================== 视频生成状态 ====================

const videoPrompt = ref('')
const videoPreset = ref(VIDEO_PRESETS[0].label)
const videoNumFrames = ref(121)
const videoFrameRate = ref(24)
const videoLoading = ref(false)
const videoError = ref('')
const videoStatusText = ref('')
const currentVideo = ref<VideoRecord | null>(null)
const videoHistory = ref<VideoRecord[]>([])
let videoIdCounter = 0
let videoPollTimer: ReturnType<typeof setInterval> | null = null

const currentVideoPreset = computed(
  () => VIDEO_PRESETS.find((p) => p.label === videoPreset.value) || VIDEO_PRESETS[0]
)
function onVideoPresetChange() {
  // 纯展示用，实际宽高在 generateVideo 时从 preset 取
}

// ==================== 媒体预览 ====================

const previewVisible = ref(false)
const previewMedia = ref<{ type: 'image' | 'video'; url: string } | null>(null)

// ==================== 持久化 ====================

function saveToSettings() {
  // 同步回全局设置存储
  settings.aiBaseUrl = sharedConfig.baseURL
  settings.aiApiKey = sharedConfig.apiKey
  settings.aiModel = sharedConfig.chatModel
  settings.aiImageModel = sharedConfig.imageModel
  settings.aiVideoModel = sharedConfig.videoModel
  settings.aiTemperature = sharedConfig.temperature
  settings.aiMaxTokens = sharedConfig.maxTokens
  settings.aiSystemPrompt = sharedConfig.systemPrompt
  settings.aiImageSize = sharedConfig.imageSize
  settings.aiVideoNumFrames = sharedConfig.videoNumFrames
  settings.aiVideoFrameRate = sharedConfig.videoFrameRate
}

const STORAGE_KEY = 'ai-chat-config'

function loadConfig() {
  // 先同步全局设置到 sharedConfig
  Object.assign(sharedConfig, buildSharedConfig())
  // 再用 localStorage 覆盖（如果有本地保存的个性化配置）
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 只覆盖非敏感字段，apiKey 始终从 settings store 读取
      const { apiKey, ...safeProps } = parsed
      Object.assign(sharedConfig, safeProps)
    }
  } catch {
    /* ignore */
  }
  // 确保 apiKey 来自 settings store
  sharedConfig.apiKey = settings.aiApiKey || ''
  // 同步到本地 ref
  videoNumFrames.value = sharedConfig.videoNumFrames ?? 121
  videoFrameRate.value = sharedConfig.videoFrameRate ?? 24
}

function saveConfig() {
  // 持久化到 localStorage
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        baseURL: sharedConfig.baseURL,
        chatModel: sharedConfig.chatModel,
        imageModel: sharedConfig.imageModel,
        videoModel: sharedConfig.videoModel,
        temperature: sharedConfig.temperature,
        maxTokens: sharedConfig.maxTokens,
        systemPrompt: sharedConfig.systemPrompt,
        imageSize: sharedConfig.imageSize,
        videoNumFrames: sharedConfig.videoNumFrames,
        videoFrameRate: sharedConfig.videoFrameRate
      })
    )
  } catch {
    /* ignore */
  }
  // 同步回全局设置存储
  saveToSettings()
}

watch(() => ({ ...sharedConfig }), saveConfig, { deep: true })

onMounted(() => {
  loadConfig()
  imageSize.value = sharedConfig.imageSize
  videoNumFrames.value = sharedConfig.videoNumFrames ?? 121
  videoFrameRate.value = sharedConfig.videoFrameRate ?? 24
})

watch(imageSize, (v) => {
  sharedConfig.imageSize = v
})
watch(videoNumFrames, (v) => {
  sharedConfig.videoNumFrames = v
})
watch(videoFrameRate, (v) => {
  sharedConfig.videoFrameRate = v
})

// ==================== 通用工具 ====================

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function copyText(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制到剪贴板'))
    .catch(() => ElMessage.error('复制失败'))
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ==================== 对话方法 ====================

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text) as string
  } catch {
    return escapeHtml(text)
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  })
}

function handleEnterKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function handleQuickTip(tip: string) {
  inputText.value = tip
  sendMessage()
}

function handleClearChat() {
  messages.value = []
  lastUsage.value = null
  streamingContent.value = ''
}

function copyMessage(text: string) {
  copyText(text)
}

async function regenerateMessage(idx: number) {
  const targetMsg = messages.value[idx]
  if (!targetMsg || targetMsg.role !== 'assistant') return
  let lastUserMsg: ChatMessage | null = null
  for (let i = idx - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      lastUserMsg = messages.value[i]
      break
    }
  }
  if (!lastUserMsg) return
  messages.value.splice(idx, 1)
  await callAI()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  messages.value.push({ role: 'user', content: text, timestamp: Date.now() })
  scrollToBottom()
  await callAI()
}

function stopStreaming() {
  abortController.value?.abort()
  abortController.value = null
  loading.value = false
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg?.streaming) lastMsg.streaming = false
}

async function callAI() {
  if (!sharedConfig.apiKey.trim()) {
    ElMessage.warning('请先配置 API Key')
    showSettings.value = true
    return
  }
  if (!sharedConfig.baseURL.trim()) {
    ElMessage.warning('请先配置 API 地址')
    showSettings.value = true
    return
  }

  loading.value = true
  streamingContent.value = ''
  lastUsage.value = null

  const apiMessages: { role: string; content: string }[] = []
  if (sharedConfig.systemPrompt.trim())
    apiMessages.push({ role: 'system', content: sharedConfig.systemPrompt.trim() })
  apiMessages.push(
    ...messages.value
      .filter((m) => !m.streaming && !m.error)
      .map((m) => ({ role: m.role, content: m.content }))
  )

  const controller = new AbortController()
  abortController.value = controller
  const aiMessageIdx = messages.value.length
  messages.value.push({ role: 'assistant', content: '', timestamp: Date.now(), streaming: true })
  scrollToBottom()

  try {
    const baseURL = sharedConfig.baseURL.replace(/\/+$/, '')
    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sharedConfig.apiKey}`
      },
      body: JSON.stringify({
        model: sharedConfig.chatModel,
        messages: apiMessages,
        temperature: sharedConfig.temperature,
        max_tokens: sharedConfig.maxTokens,
        stream: true
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      let errorMsg = `HTTP ${response.status}`
      try {
        const ej = JSON.parse(errorText)
        errorMsg = ej.error?.message || ej.message || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }
    if (!response.body) throw new Error('响应体为空，不支持流式读取')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '',
      fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const t = line.trim()
        if (!t || !t.startsWith('data: ')) continue
        const ds = t.slice(6)
        if (ds === '[DONE]') continue
        try {
          const chunk = JSON.parse(ds)
          const delta = chunk.choices?.[0]?.delta
          if (delta?.content) {
            fullContent += delta.content
            messages.value[aiMessageIdx].content = fullContent
            scrollToBottom()
          }
          if (chunk.usage) lastUsage.value = chunk.usage as TokenUsage
        } catch {
          /* ignore */
        }
      }
    }

    messages.value[aiMessageIdx].streaming = false
    if (!fullContent.trim()) messages.value[aiMessageIdx].error = '模型未返回任何内容'
    if (!lastUsage.value) {
      lastUsage.value = {
        prompt_tokens: estimateTokens(apiMessages.map((m) => m.content).join(' ')),
        completion_tokens: estimateTokens(fullContent),
        total_tokens: 0
      }
      lastUsage.value.total_tokens =
        lastUsage.value.prompt_tokens + lastUsage.value.completion_tokens
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      messages.value[aiMessageIdx].streaming = false
      if (!messages.value[aiMessageIdx].content.trim())
        messages.value[aiMessageIdx].error = '已停止生成'
    } else {
      messages.value[aiMessageIdx].streaming = false
      messages.value[aiMessageIdx].error = err.message || '请求失败，请检查 API 配置'
    }
  } finally {
    loading.value = false
    abortController.value = null
    scrollToBottom()
  }
}

function estimateTokens(text: string): number {
  let tokens = 0
  for (const char of text) {
    if (/[一-鿿]/.test(char)) tokens += 0.6
    else if (/\s/.test(char)) tokens += 0.25
    else tokens += 0.25
  }
  return Math.ceil(tokens)
}

// ==================== 图片生成方法 ====================

async function generateImage() {
  const prompt = imagePrompt.value.trim()
  if (!prompt) return
  if (!sharedConfig.apiKey.trim()) {
    ElMessage.warning('请先配置 API Key')
    showSettings.value = true
    return
  }
  if (!sharedConfig.baseURL.trim()) {
    ElMessage.warning('请先配置 API 地址')
    showSettings.value = true
    return
  }

  imageLoading.value = true
  imageError.value = ''
  currentImage.value = null

  try {
    const baseURL = sharedConfig.baseURL.replace(/\/+$/, '')
    const response = await fetch(`${baseURL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sharedConfig.apiKey}`
      },
      body: JSON.stringify({
        model: sharedConfig.imageModel,
        prompt,
        size: imageSize.value,
        extra_body: { response_format: 'url' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      let errorMsg = `HTTP ${response.status}`
      try {
        const ej = JSON.parse(errorText)
        errorMsg = ej.error?.message || ej.message || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }

    const result = await response.json()
    const imageUrl = result.data?.[0]?.url || result.url
    if (!imageUrl) throw new Error('API 未返回图片链接')

    const record: ImageRecord = {
      id: ++imageIdCounter,
      url: imageUrl,
      prompt,
      size: imageSize.value,
      timestamp: Date.now()
    }
    currentImage.value = record
    imageHistory.value.unshift(record)
    imagePrompt.value = ''
    ElMessage.success('图片生成成功')
  } catch (err: any) {
    imageError.value =
      err.name === 'AbortError' ? '请求已取消' : err.message || '生成失败，请检查 API 配置'
  } finally {
    imageLoading.value = false
  }
}

// ==================== 视频生成方法 ====================

async function generateVideo() {
  const prompt = videoPrompt.value.trim()
  if (!prompt) return
  if (!sharedConfig.apiKey.trim()) {
    ElMessage.warning('请先配置 API Key')
    showSettings.value = true
    return
  }
  if (!sharedConfig.baseURL.trim()) {
    ElMessage.warning('请先配置 API 地址')
    showSettings.value = true
    return
  }

  const preset = currentVideoPreset.value

  videoLoading.value = true
  videoError.value = ''
  currentVideo.value = null
  videoStatusText.value = '正在提交视频生成任务...'

  let videoId = ''

  try {
    const baseURL = sharedConfig.baseURL.replace(/\/+$/, '')

    // Step 1: POST 创建视频任务
    videoStatusText.value = '正在提交视频生成任务...'
    const createRes = await fetch(`${baseURL}/v1/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sharedConfig.apiKey}`
      },
      body: JSON.stringify({
        model: sharedConfig.videoModel,
        prompt,
        width: preset.width,
        height: preset.height,
        num_frames: videoNumFrames.value,
        frame_rate: videoFrameRate.value
      })
    })

    if (!createRes.ok) {
      const errorText = await createRes.text().catch(() => 'Unknown error')
      console.error('❌ POST /v1/videos 失败:', createRes.status, errorText)
      let errorMsg = `HTTP ${createRes.status}`
      try {
        const ej = JSON.parse(errorText)
        errorMsg = ej.error?.message || ej.message || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }

    const createResult = await createRes.json()
    console.log('🔍 POST /v1/videos 响应:', JSON.stringify(createResult, null, 2))

    // video_id 才是轮询用的 ID（不是 id/task_id）
    videoId = createResult.video_id || ''

    if (!videoId) {
      // 也许直接返回了 url（同步模式），兼容一下
      const directUrl = createResult.url || createResult.data?.[0]?.url
      if (directUrl) {
        finalizeVideoRecord(prompt, preset, directUrl)
        return
      }
      throw new Error('API 未返回 video_id，响应: ' + JSON.stringify(createResult).slice(0, 200))
    }

    // Step 2: 轮询查询视频状态
    ElMessage.info('视频任务已提交，正在轮询进度...')
    await pollVideoStatus(videoId, prompt, preset)
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message === '用户取消') {
      videoError.value = ''
      ElMessage.info('已取消视频生成')
    } else {
      videoError.value = err.message || '生成失败，请检查 API 配置'
    }
  } finally {
    videoLoading.value = false
    videoStatusText.value = ''
    clearVideoPolling()
  }
}

async function pollVideoStatus(
  videoId: string,
  prompt: string,
  preset: { width: number; height: number }
) {
  const baseURL = sharedConfig.baseURL.replace(/\/+$/, '')
  const maxAttempts = 120
  let attempt = 0

  return new Promise<void>((resolve, reject) => {
    videoPollTimer = setInterval(async () => {
      attempt++
      videoStatusText.value = `视频生成中... (第 ${attempt} 次查询)`

      try {
        // 使用 agnesapi 端点轮询（参考原始代码中的调用方式）
        const pollRes = await fetch(`${baseURL}/agnesapi?video_id=${encodeURIComponent(videoId)}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${sharedConfig.apiKey}` }
        })

        if (!pollRes.ok) {
          if (attempt >= maxAttempts) {
            reject(new Error(`轮询超时：已查询 ${attempt} 次仍未成功`))
            return
          }
          return
        }

        const pollData = await pollRes.json()

        // 仅在首次轮询时打印完整响应，方便调试字段名
        if (attempt === 1) {
          console.log('🔍 轮询响应结构:', JSON.stringify(pollData, null, 2))
        }

        // ── 优先使用 progress 字段显示进度 ──
        const progress = pollData.progress ?? pollData.data?.[0]?.progress
        if (progress !== undefined && progress !== null) {
          videoStatusText.value = `视频生成中... ${progress}%（第 ${attempt} 次查询）`
        }

        // ── 状态判断 ──
        const status = pollData.status || pollData.state || pollData.data?.[0]?.status || ''

        // 完成：progress=100 或 status=completed/succeeded/ready/done
        if (
          progress === 100 ||
          status === 'completed' ||
          status === 'succeeded' ||
          status === 'ready' ||
          status === 'done'
        ) {
          // remixed_from_video_id 是实际的视频 URL
          const videoUrl =
            pollData.remixed_from_video_id ||
            pollData.url ||
            pollData.video_url ||
            pollData.result?.url ||
            pollData.output_url ||
            pollData.data?.[0]?.url ||
            pollData.data?.[0]?.video_url ||
            ''
          if (!videoUrl) {
            reject(
              new Error(`视频已完成但未返回链接，响应: ${JSON.stringify(pollData).slice(0, 300)}`)
            )
            return
          }
          // 从响应中提取补充信息
          const meta = {
            seconds: pollData.seconds,
            size: pollData.size || preset
          }
          finalizeVideoRecord(prompt, preset, videoUrl, meta)
          resolve()
          return
        }

        // 失败：error 字段非空
        if (status === 'failed' || status === 'error' || pollData.error) {
          const errMsg =
            pollData.error || pollData.message || pollData.data?.[0]?.error || '视频生成失败'
          reject(new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)))
          return
        }

        // 还可能有提前返回 url 的情况
        const earlyUrl =
          pollData.remixed_from_video_id ||
          pollData.url ||
          pollData.video_url ||
          pollData.result?.url ||
          pollData.output_url ||
          pollData.data?.[0]?.url
        if (earlyUrl && (progress === 100 || status === 'completed')) {
          const meta = { seconds: pollData.seconds, size: pollData.size || preset }
          finalizeVideoRecord(prompt, preset, earlyUrl, meta)
          resolve()
          return
        }

        if (attempt >= maxAttempts) {
          reject(
            new Error(
              `轮询超时：已查询 ${attempt} 次，视频仍在处理中（progress=${progress ?? '?'}）`
            )
          )
        }
      } catch (pollErr: any) {
        if (attempt >= maxAttempts) {
          reject(new Error(`轮询出错（${pollErr.message}），已重试 ${attempt} 次`))
        }
      }
    }, 5000)
  })
}

function finalizeVideoRecord(
  prompt: string,
  preset: { width: number; height: number },
  url: string,
  meta?: { seconds?: string; size?: string | { width: number; height: number } }
) {
  clearVideoPolling()
  const record: VideoRecord = {
    id: ++videoIdCounter,
    url,
    prompt,
    width: preset.width,
    height: preset.height,
    numFrames: videoNumFrames.value,
    frameRate: videoFrameRate.value,
    timestamp: Date.now(),
    seconds: meta?.seconds,
    sizeDisplay: typeof meta?.size === 'string' ? meta.size : undefined
  }
  currentVideo.value = record
  videoHistory.value.unshift(record)
  videoPrompt.value = ''
  videoError.value = ''
  ElMessage.success('视频生成成功')
}

function cancelVideoPolling() {
  clearVideoPolling()
  if (videoLoading.value) {
    videoLoading.value = false
    videoError.value = ''
    videoStatusText.value = ''
  }
}

function clearVideoPolling() {
  if (videoPollTimer) {
    clearInterval(videoPollTimer)
    videoPollTimer = null
  }
}
</script>

<style scoped lang="scss">
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
}

// ── 顶部 ──────────────────────────────────────
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header-left h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .header-right {
    display: flex;
    gap: 4px;
  }
}

// ── Tabs ──────────────────────────────────────
.chat-tabs {
  flex-shrink: 0;
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  .tab-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
  }
}

// ── 设置 ──────────────────────────────────────
.settings-panel {
  flex-shrink: 0;
  margin-bottom: 16px;
  :deep(.el-card) {
    border: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
  }
  :deep(.el-form-item) {
    margin-bottom: 8px;
  }
}

// ── 聊天消息 ──────────────────────────────────
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;
  }
}
.chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  .placeholder-title {
    margin: 16px 0 4px;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
  .placeholder-desc {
    font-size: 13px;
    margin-bottom: 24px;
  }
  .placeholder-tips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .tip-tag {
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow-light);
    }
  }
}

.message-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  &:last-child {
    border-bottom: none;
  }
  // 用户消息：右对齐（微信风格）
  &.user {
    flex-direction: row-reverse;
    .message-role {
      text-align: right;
    }
    .message-body {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .message-content {
      background: var(--el-color-primary);
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      max-width: 100%;
      color: #ffffff;
    }
    .message-actions {
      justify-content: flex-end;
    }
  }
  // AI 消息：保持左对齐
  &.assistant {
    flex-direction: row;
    .message-body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
  }
  .message-avatar {
    flex-shrink: 0;
    padding-top: 2px;
  }
  .message-body {
    flex: 1;
    min-width: 0;
  }
  .message-role {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }
  .message-time {
    margin-left: 8px;
    font-weight: 400;
    color: var(--el-text-color-placeholder);
  }
  .message-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-color-primary);
  }
  .user-text {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .message-error {
    margin-top: 8px;
    padding: 8px 16px;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    border-radius: 8px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .message-actions {
    margin-top: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    :deep(.el-button) {
      color: var(--el-text-color-placeholder);
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
  &:hover .message-actions {
    opacity: 1;
  }
}

.markdown-body {
  word-break: break-word;
  display: flex;
  flex-wrap: wrap;

  :deep(p) {
    margin: 0 0 8px;
    background: var(--el-color-primary-light-9);
    padding: 5px 10px;
    border-radius: 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 16px 0 8px;
    font-weight: 600;
  }
  :deep(h1) {
    font-size: 1.4em;
  }
  :deep(h2) {
    font-size: 1.2em;
  }
  :deep(h3) {
    font-size: 1.1em;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 1.5em;
    margin: 8px 0;
  }
  :deep(code) {
    background: var(--el-fill-color-darker);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: 'SF Mono', Menlo, Monaco, monospace;
    color: var(--el-color-danger);
  }
  :deep(pre) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 0.85em;
    }
  }
  :deep(blockquote) {
    border-left: 3px solid var(--el-color-primary);
    padding: 4px 16px;
    margin: 8px 0;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 0 4px 4px 0;
  }
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 13px;
    th,
    td {
      border: 1px solid var(--el-border-color-light);
      padding: 4px 8px;
      text-align: left;
    }
    th {
      background: var(--el-fill-color-light);
      font-weight: 500;
    }
  }
  :deep(a) {
    color: var(--el-color-primary);
    &:hover {
      text-decoration: underline;
    }
  }
  :deep(hr) {
    border: none;
    border-top: 1px solid var(--el-border-color-light);
    margin: 16px 0;
  }
}

// ── 动画 ──────────────────────────────────────
.streaming-cursor {
  display: inline;
  color: var(--el-color-primary);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 8px 0;
  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--el-color-primary-light-5);
    animation: typing 1.4s ease-in-out infinite;
    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}
@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}
.usage-info {
  flex-shrink: 0;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.chat-input-area {
  flex-shrink: 0;
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-light);
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    resize: none;
    // color: #303133;
    background: var(--el-fill-color-light);
    transition: all 0.2s;
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
    &:focus {
      border-color: var(--el-color-primary);
      background: #fff;
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
  .input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }
  .char-count {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

// ── 媒体生成（图片/视频共享） ────────────────────
.media-gen-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;
  }
}

.media-input-area {
  margin-bottom: 24px;
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    font-size: 14px;
    resize: none;
    // color: #303133;
    background: var(--el-fill-color-light);
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
    &:focus {
      border-color: var(--el-color-primary);
      background: #fff;
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
  .media-gen-options {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .option-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .option-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }
  .video-options {
    justify-content: space-between;
  }
  .video-params-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    text-align: right;
  }
}

.media-loading-area {
  margin: 32px 0;
}
.media-loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: var(--el-text-color-placeholder);
  .is-loading {
    animation: rotating 2s linear infinite;
    color: var(--el-color-primary);
  }
  p {
    margin-top: 16px;
    font-size: 14px;
  }
  .loading-sub {
    font-size: 12px;
    margin-top: 4px;
    color: var(--el-text-color-placeholder);
  }
}
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.media-error-area {
  margin-bottom: 16px;
}

.media-result-area {
  margin-bottom: 24px;
}
.media-result-card :deep(.el-card__body) {
  padding: 0;
}
.media-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  .result-label {
    font-weight: 500;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
  .result-meta {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-left: 8px;
    flex: 1;
  }
  .result-actions {
    display: flex;
    gap: 4px;
  }
}
.media-result-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    max-width: 100%;
    max-height: 480px;
    border-radius: 8px;
    cursor: zoom-in;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.9;
    }
  }
  .video-player {
    max-width: 100%;
    max-height: 480px;
    border-radius: 8px;
    background: #000;
  }
  .media-prompt-text {
    margin-top: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
    line-height: 1.6;
  }
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: var(--el-text-color-placeholder);
  .placeholder-title {
    margin: 16px 0 4px;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
  .placeholder-desc {
    font-size: 13px;
  }
}

.media-history-area {
  margin-top: 24px;
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
  .history-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .history-item {
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    &.active {
      border-color: var(--el-color-primary);
    }
    &:hover .history-item-overlay {
      opacity: 1;
    }
    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .history-item-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4px 8px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
      opacity: 0;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      span {
        font-size: 11px;
        color: #fff;
      }
      .el-icon {
        color: #fff;
      }
    }
  }
  .history-item.video-history-item {
    aspect-ratio: 16/10;
  }
}

// ── 响应式 ──────────────────────────────────
@media (max-width: 768px) {
  .ai-chat-page {
    max-width: 100%;
    height: calc(100vh - 80px);
    padding: 0 8px;
  }
  .chat-header {
    flex-direction: column;
    gap: 8px;
  }
  .message-item {
    gap: 8px;
  }
  .media-history-area .history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .media-gen-options {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start !important;
  }
  .video-options {
    flex-direction: column;
    align-items: flex-start !important;
  }
  .video-params-hint {
    text-align: left !important;
  }
}
</style>
