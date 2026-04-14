import fs from 'fs'
import path from 'path'
import os from 'os'
import https from 'https'
import qiniu from 'qiniu'
import { ipcHandleWithLog } from './api/ipc'

interface UploadTokenResponse {
  status: number
  result: {
    uptoken: string
    fileKey: string
    uploadUrl: string
    url?: string
  }
  time: number
}

const RESUME_THRESHOLD = 4 * 1024 * 1024 // 4MB 以上使用分片上传
const MAX_RETRY = 10
const BASE_RETRY_DELAY = 3000 // 3秒
const MAX_RETRY_DELAY = 60000 // 最大60秒
const NETWORK_CHECK_INTERVAL = 3000 // 网络检测间隔3秒

function getQiniuConfig(): qiniu.conf.Config {
  const config = new qiniu.conf.Config()
  config.zone = qiniu.zone.Zone_z0
  config.useCdnDomain = true
  return config
}

function fetchUploadToken(
  bucketType: number,
  fileType: string
): Promise<UploadTokenResponse['result']> {
  return new Promise((resolve, reject) => {
    const url = `https://www.yxuer.com/cloud/common/file/getToken?bucketType=${bucketType}&fileType=${fileType}`
    https
      .get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data) as UploadTokenResponse
            if (jsonData.status === 1) {
              resolve(jsonData.result)
            } else {
              reject(new Error(`获取上传凭证失败: status=${jsonData.status}`))
            }
          } catch (e) {
            reject(new Error(`解析上传凭证响应失败: ${e}`))
          }
        })
      })
      .on('error', reject)
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isNetworkError(err: any): boolean {
  if (!err) return false
  const msg = String(err.message || err.code || '').toLowerCase()
  return [
    'econnrefused',
    'econnreset',
    'etimedout',
    'enotfound',
    'socket hang up',
    'epipe',
    'econnaborted',
    'ehostunreach',
    'enetunreach',
    'enetdown',
    'network'
  ].some((k) => msg.includes(k))
}

/**
 * 轮询检测网络是否恢复，直到可以连通七牛上传节点
 */
function waitForNetwork(): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = () => {
      const req = https.request('https://up.qbox.me', { method: 'HEAD', timeout: 5000 }, (res) => {
        res.destroy()
        resolve()
      })
      req.on('error', () => setTimeout(check, NETWORK_CHECK_INTERVAL))
      req.on('timeout', () => {
        req.destroy()
        setTimeout(check, NETWORK_CHECK_INTERVAL)
      })
      req.end()
    }
    check()
  })
}

function getResumeRecordDir(): string {
  const dir = path.join(os.tmpdir(), 'qiniu-upload-resume')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * 带网络重试的凭证获取，断网时会等待网络恢复后自动重试
 */
async function fetchUploadTokenWithRetry(
  bucketType: number,
  fileType: string
): Promise<UploadTokenResponse['result']> {
  for (let retry = 0; retry <= MAX_RETRY; retry++) {
    try {
      return await fetchUploadToken(bucketType, fileType)
    } catch (err: any) {
      if (isNetworkError(err) && retry < MAX_RETRY) {
        console.log(`获取上传凭证网络错误，等待网络恢复后重试 (${retry + 1}/${MAX_RETRY})...`)
        await waitForNetwork()
        await sleep(1000)
        continue
      }
      throw err
    }
  }
  throw new Error('获取上传凭证失败: 超过最大重试次数')
}

/**
 * 使用七牛 Node SDK 上传文件（小文件表单上传，大文件分片断点续传）
 */
export const uploadToQiniuSDK = (
  file: string,
  bucketType: number,
  fileType: string = 'png',
  success: (data: any) => void,
  fail?: (err: any) => void,
  progress?: (percent: number) => void,
  error?: (err: any) => void
) => {
  let times = 0

  fetchUploadTokenWithRetry(bucketType, fileType)
    .then((tokenResult) => {
      times = Date.now()
      success({
        url: tokenResult.url,
        lock: false
      })

      const fileSize = fs.statSync(file).size
      if (fileSize > RESUME_THRESHOLD) {
        resumeUpload(file, tokenResult.uptoken, tokenResult.fileKey, times, success, fail, progress)
      } else {
        formUpload(file, tokenResult.uptoken, tokenResult.fileKey, times, success, fail, progress)
      }
    })
    .catch((err) => {
      console.error('获取上传凭证错误:', err)
      error?.(err)
    })
}

function doFormUpload(
  file: string,
  token: string,
  fileKey: string
): Promise<{ respBody: any; respInfo: any }> {
  return new Promise((resolve, reject) => {
    const config = getQiniuConfig()
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    formUploader.putFile(token, fileKey, file, putExtra, (respErr, respBody, respInfo) => {
      if (respErr) {
        reject(respErr)
      } else {
        resolve({ respBody, respInfo })
      }
    })
  })
}

/**
 * 表单上传（小文件），带网络断线自动重试
 */
async function formUpload(
  file: string,
  token: string,
  fileKey: string,
  startTime: number,
  success: (data: any) => void,
  fail?: (err: any) => void,
  _progress?: (percent: number) => void
) {
  for (let retry = 0; retry <= MAX_RETRY; retry++) {
    try {
      const { respBody, respInfo } = await doFormUpload(file, token, fileKey)

      if (respInfo.statusCode === 200) {
        const elapsed = (Date.now() - startTime) / 1000
        console.log('表单上传成功:', elapsed, '秒')
        _progress?.(100)
        setTimeout(() => {
          success({ ...respBody, lock: true })
        }, 100)
        return
      } else {
        console.error('表单上传失败:', respInfo.statusCode, respBody)
        fail?.(respBody)
        return
      }
    } catch (err: any) {
      if (isNetworkError(err) && retry < MAX_RETRY) {
        const retryDelay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retry), MAX_RETRY_DELAY)
        console.log(
          `表单上传网络错误，等待网络恢复后重试 (${retry + 1}/${MAX_RETRY})，` +
            `退避 ${retryDelay / 1000}s...`
        )
        await waitForNetwork()
        await sleep(Math.min(retryDelay, 2000))
        continue
      }
      console.error('表单上传异常:', err)
      fail?.(err)
      return
    }
  }
}

/**
 * 分片上传（大文件），带断点续传 + 网络断线自动重试
 *
 * 通过 qiniu SDK 的 resumeRecorder 将已上传的分片信息持久化到磁盘，
 * 网络中断后恢复时自动跳过已上传的分片，从断点处继续上传。
 */
async function resumeUpload(
  file: string,
  token: string,
  fileKey: string,
  startTime: number,
  success: (data: any) => void,
  fail?: (err: any) => void,
  progress?: (percent: number) => void
) {
  const resumeDir = getResumeRecordDir()
  const resumeRecorder = (qiniu.resume_up as any).createResumeRecorderSync(resumeDir)

  for (let retry = 0; retry <= MAX_RETRY; retry++) {
    try {
      const config = getQiniuConfig()
      const resumeUploader = new qiniu.resume_up.ResumeUploader(config)
      const putExtra = new qiniu.resume_up.PutExtra()

      putExtra.resumeRecorder = resumeRecorder
      putExtra.version = 'v2'
      putExtra.partSize = 4 * 1024 * 1024

      putExtra.progressCallback = (uploadBytes: number, totalBytes: number) => {
        const percent = Math.round((uploadBytes * 100) / totalBytes)
        progress?.(percent)
        console.log('分片上传进度:', percent + '%')
      }

      // putFile 返回 Promise（TypeScript 类型声明不准确，实际返回 Promise）
      const result: any = await (resumeUploader as any).putFile(token, fileKey, file, putExtra)

      const respInfo = result.resp || result
      const respData = result.data || result

      if (respInfo.statusCode === 200) {
        const elapsed = (Date.now() - startTime) / 1000
        console.log('分片上传成功:', elapsed, '秒')
        progress?.(100)
        setTimeout(() => {
          success({ ...respData, lock: true })
        }, 100)
        return
      } else {
        console.error('分片上传失败:', respInfo.statusCode, respData)
        fail?.(respData)
        return
      }
    } catch (err: any) {
      if (isNetworkError(err) && retry < MAX_RETRY) {
        const retryDelay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retry), MAX_RETRY_DELAY)
        console.log(
          `分片上传网络错误，等待网络恢复后重试 (${retry + 1}/${MAX_RETRY})，` +
            `退避 ${retryDelay / 1000}s...`
        )
        await waitForNetwork()
        await sleep(Math.min(retryDelay, 2000))
        continue
      }
      console.error('分片上传异常:', err)
      fail?.(err)
      return
    }
  }
}

/**
 * 注册主进程的 IPC 事件
 */
export function setupUploadIPC() {
  ipcHandleWithLog('file:upload', async (event, options) => {
    const { filePath, bucketType, fileType } = options

    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error('文件不存在: ' + filePath)
        }

        let finalUrl = ''

        uploadToQiniuSDK(
          filePath,
          bucketType,
          fileType,
          (data) => {
            if (data && data.lock === false) {
              // 第一次回调，仅获取到预分配的 url，此时文件还未开始上传
              if (data.url) finalUrl = data.url
            } else {
              // 第二次回调，上传真正完成 (lock === true)
              resolve({ success: true, data: { ...data, url: finalUrl || data.url } })
            }
          },
          (err) => {
            reject(new Error(err.error || '上传失败'))
          },
          (percent) => {
            event.sender.send('file:upload-progress', { percent })
          },
          (err) => {
            reject(err)
          }
        )
      } catch (err: any) {
        reject(err)
      }
    })
  })
}
