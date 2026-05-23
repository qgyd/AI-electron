import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutoUpdateScheduler } from './update-scheduler'

describe('createAutoUpdateScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('会在启动 30 秒后首次检查，并在之后每小时继续检查', async () => {
    const runCheck = vi.fn().mockResolvedValue(undefined)

    createAutoUpdateScheduler({
      isPackaged: true,
      runCheck
    }).start()

    await vi.advanceTimersByTimeAsync(29_000)
    expect(runCheck).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(runCheck).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(runCheck).toHaveBeenCalledTimes(2)
  })

  it('开发环境不会启动自动更新检查', async () => {
    const runCheck = vi.fn().mockResolvedValue(undefined)

    createAutoUpdateScheduler({
      isPackaged: false,
      runCheck
    }).start()

    await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000)
    expect(runCheck).not.toHaveBeenCalled()
  })
})
