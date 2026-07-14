export interface VideoPollMetadata {
  seconds?: number
  size?: {
    width: number
    height: number
  }
}

export interface VideoPollResult {
  done: boolean
  failed: boolean
  progress?: number
  status: string
  url: string
  errorMessage: string
  metadata: VideoPollMetadata
}

const trimWrappedQuotes = (value: string) => value.trim().replace(/^['"`]+|['"`]+$/g, '')

const normalizeBaseUrl = (baseUrl: string) => trimWrappedQuotes(baseUrl).replace(/\/+$/, '')

const normalizePath = (path: string) => `/${path.replace(/^\/+/, '')}`

export const buildAgnesEndpoint = (baseUrl: string, path: string) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const normalizedPath = normalizePath(path)

  if (normalizedBaseUrl.endsWith('/v1') && normalizedPath.startsWith('/v1/')) {
    return `${normalizedBaseUrl}${normalizedPath.slice(3)}`
  }

  return `${normalizedBaseUrl}${normalizedPath}`
}

export const extractImageUrl = (result: any) => result?.data?.[0]?.url || result?.url || ''

export const extractVideoCreationResult = (result: any) => ({
  videoId: result?.video_id || '',
  url: result?.url || result?.data?.[0]?.url || ''
})

export const resolveVideoPollResult = (pollData: any): VideoPollResult => {
  const progress = pollData?.progress ?? pollData?.data?.[0]?.progress
  const status = pollData?.status || pollData?.state || pollData?.data?.[0]?.status || ''
  const url =
    pollData?.remixed_from_video_id ||
    pollData?.url ||
    pollData?.video_url ||
    pollData?.result?.url ||
    pollData?.output_url ||
    pollData?.metadata?.url ||
    pollData?.data?.[0]?.url ||
    pollData?.data?.[0]?.video_url ||
    ''

  const errorMessage = pollData?.error || pollData?.message || pollData?.data?.[0]?.error || ''
  const metadata = {
    seconds: pollData?.seconds,
    size: pollData?.size
  }

  const done =
    progress === 100 ||
    ['completed', 'succeeded', 'ready', 'done'].includes(String(status).toLowerCase())
  const failed =
    ['failed', 'error'].includes(String(status).toLowerCase()) || Boolean(pollData?.error)

  return {
    done,
    failed,
    progress,
    status,
    url,
    errorMessage: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
    metadata
  }
}

