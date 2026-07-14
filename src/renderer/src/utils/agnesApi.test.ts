import { describe, expect, it } from 'vitest'
import {
  buildAgnesEndpoint,
  extractImageUrl,
  extractVideoCreationResult,
  resolveVideoPollResult
} from './agnesApi'

describe('agnesApi', () => {
  describe('buildAgnesEndpoint', () => {
    it('会基于根地址拼出 Agnes 文档路径', () => {
      expect(buildAgnesEndpoint('https://apihub.agnes-ai.com', '/v1/chat/completions')).toBe(
        'https://apihub.agnes-ai.com/v1/chat/completions'
      )
    })

    it('会兼容已经带有 /v1 的旧配置', () => {
      expect(buildAgnesEndpoint('https://apihub.agnes-ai.com/v1/', '/v1/images/generations')).toBe(
        'https://apihub.agnes-ai.com/v1/images/generations'
      )
    })

    it('会清理错误包裹的反引号和空白', () => {
      expect(buildAgnesEndpoint(' `https://apihub.agnes-ai.com` ', '/v1/videos')).toBe(
        'https://apihub.agnes-ai.com/v1/videos'
      )
    })
  })

  describe('extractImageUrl', () => {
    it('优先从 data[0].url 读取图片链接', () => {
      expect(
        extractImageUrl({
          data: [{ url: 'https://cdn.example.com/generated.png' }]
        })
      ).toBe('https://cdn.example.com/generated.png')
    })

    it('兼容直接返回 url 的结果', () => {
      expect(
        extractImageUrl({
          url: 'https://cdn.example.com/direct.png'
        })
      ).toBe('https://cdn.example.com/direct.png')
    })
  })

  describe('extractVideoCreationResult', () => {
    it('会优先返回 video_id 供轮询使用', () => {
      expect(extractVideoCreationResult({ video_id: 'video_123' })).toEqual({
        videoId: 'video_123',
        url: ''
      })
    })

    it('兼容同步返回视频链接', () => {
      expect(
        extractVideoCreationResult({
          data: [{ url: 'https://cdn.example.com/direct.mp4' }]
        })
      ).toEqual({
        videoId: '',
        url: 'https://cdn.example.com/direct.mp4'
      })
    })
  })

  describe('resolveVideoPollResult', () => {
    it('会在进度 100 时识别完成并提取链接与元信息', () => {
      expect(
        resolveVideoPollResult({
          progress: 100,
          url: 'https://cdn.example.com/final.mp4',
          seconds: 5,
          size: { width: 1280, height: 720 }
        })
      ).toEqual({
        done: true,
        failed: false,
        progress: 100,
        status: '',
        url: 'https://cdn.example.com/final.mp4',
        errorMessage: '',
        metadata: {
          seconds: 5,
          size: { width: 1280, height: 720 }
        }
      })
    })

    it('会在失败状态时返回错误信息', () => {
      expect(
        resolveVideoPollResult({
          status: 'failed',
          error: 'quota exceeded'
        })
      ).toEqual({
        done: false,
        failed: true,
        progress: undefined,
        status: 'failed',
        url: '',
        errorMessage: 'quota exceeded',
        metadata: {
          seconds: undefined,
          size: undefined
        }
      })
    })
  })
})
