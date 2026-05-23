export interface AutoUpdateSchedulerOptions {
  isPackaged: boolean
  runCheck: () => Promise<void>
  initialDelayMs?: number
  intervalMs?: number
  setTimeoutFn?: typeof setTimeout
  setIntervalFn?: typeof setInterval
}

const DEFAULT_INITIAL_DELAY_MS = 30 * 1000
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000

export function createAutoUpdateScheduler(options: AutoUpdateSchedulerOptions) {
  const {
    isPackaged,
    runCheck,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    setTimeoutFn = setTimeout,
    setIntervalFn = setInterval
  } = options

  const start = () => {
    if (!isPackaged) {
      return
    }

    setTimeoutFn(() => {
      void runCheck()
      setIntervalFn(() => {
        void runCheck()
      }, intervalMs)
    }, initialDelayMs)
  }

  return {
    start
  }
}
