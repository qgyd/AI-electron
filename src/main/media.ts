import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import log from './logger'
import { join, dirname } from 'path'
import { ipcHandleWithLog } from './api/ipc'

// 处理生产环境下的 asar 路径问题
const ffmpegPath = ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked')
const ffprobePath = ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked')

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

// 注册媒体处理相关的 IPC 监听
export function setupMediaIPC() {
  ipcHandleWithLog('media:convert', async (event, options) => {
    const { inputPath, outputPath, format, startTime, duration } = options

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)

      // 如果有裁剪参数
      if (startTime !== undefined && startTime !== '') {
        command = command.setStartTime(startTime)
      }
      if (duration !== undefined && duration !== '') {
        command = command.setDuration(duration)
      }

      // 如果有格式参数
      if (format) {
        command = command.format(format)
      }

      command
        .on('start', (commandLine) => {
          log.info('Spawned Ffmpeg with command: ' + commandLine)
        })
        .on('progress', (progress) => {
          // 将进度发送给渲染进程
          event.sender.send('media:progress', progress)
        })
        .on('end', () => {
          log.info('Processing finished successfully')
          resolve({ success: true, outputPath })
        })
        .on('error', (err, stdout, stderr) => {
          log.error('Ffmpeg error:', err.message)
          log.error('Ffmpeg stdout:', stdout)
          log.error('Ffmpeg stderr:', stderr)
          reject(new Error(err.message))
        })
        .save(outputPath)
    })
  })

  // 获取媒体信息
  ipcHandleWithLog('media:getInfo', async (event, inputPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(err.message))
        } else {
          resolve(metadata)
        }
      })
    })
  })
}
