import { computed, ref, watch, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useApiHistoryStore } from '@/store/apiHistory'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface KeyValueRow {
  enabled: boolean
  key: string
  value: string
}

export type BodyMode = 'json' | 'text'

export interface BodyState {
  mode: BodyMode
  text: string
}

export interface ResponseState {
  ok: boolean
  status?: number
  statusText?: string
  timeMs?: number
  headers?: Record<string, any>
  dataText?: string
  errorText?: string
  isFile?: boolean
  fileUrl?: string
  fileName?: string
  fileSize?: string
}

const buildObject = (rows: KeyValueRow[]) => {
  const obj: Record<string, string> = {}
  for (const row of rows) {
    if (!row.enabled) continue
    const k = (row.key || '').trim()
    if (!k) continue
    obj[k] = row.value ?? ''
  }
  return obj
}

const isMethodWithBody = (method: HttpMethod) => {
  return method === 'POST' || method === 'PUT' || method === 'PATCH'
}

export function useApiTester() {
  const apiHistoryStore = useApiHistoryStore()
  const url = ref('https://jsonplaceholder.typicode.com/todos/1')
  const method = ref<HttpMethod>('GET')

  const queryParams = ref<KeyValueRow[]>([{ enabled: true, key: '', value: '' }])
  const headers = ref<KeyValueRow[]>([{ enabled: true, key: '', value: '' }])
  const body = ref<BodyState>({ mode: 'json', text: '' })

  const loading = ref(false)
  const response = ref<ResponseState>({ ok: true })

  const canEditBody = computed(() => isMethodWithBody(method.value))

  // --- 开始：URL 与 Query Params 的双向同步 ---
  let isSyncingUrl = false
  let isSyncingParams = false

  watch(url, (newUrl) => {
    if (isSyncingParams) return
    isSyncingUrl = true

    try {
      const qIndex = newUrl.indexOf('?')
      if (qIndex !== -1) {
        const searchStr = newUrl.substring(qIndex + 1)
        const params = new URLSearchParams(searchStr)
        const newRows: KeyValueRow[] = []
        params.forEach((value, key) => {
          newRows.push({ enabled: true, key, value })
        })
        // 始终在末尾保留一个空行方便输入
        newRows.push({ enabled: true, key: '', value: '' })
        queryParams.value = newRows
      } else {
        queryParams.value = [{ enabled: true, key: '', value: '' }]
      }
    } catch (e) {
      // ignore
    }

    nextTick(() => {
      isSyncingUrl = false
    })
  })

  watch(
    queryParams,
    (newParams) => {
      if (isSyncingUrl) return
      isSyncingParams = true

      try {
        const qIndex = url.value.indexOf('?')
        const baseUrl = qIndex !== -1 ? url.value.substring(0, qIndex) : url.value

        const params = new URLSearchParams()
        let hasValid = false
        newParams.forEach((row) => {
          if (row.enabled && row.key) {
            params.append(row.key, row.value || '')
            hasValid = true
          }
        })

        if (hasValid) {
          // 为了可读性，将 URLSearchParams 默认的 + 替换为更常见的 %20
          const qStr = params.toString().replace(/\+/g, '%20')
          url.value = `${baseUrl}?${qStr}`
        } else {
          url.value = baseUrl
        }
      } catch (e) {
        // ignore
      }

      nextTick(() => {
        isSyncingParams = false
      })
    },
    { deep: true }
  )
  // --- 结束：URL 与 Query Params 的双向同步 ---

  const send = async () => {
    const targetUrl = url.value.trim()
    if (!targetUrl) {
      ElMessage.warning('请输入请求地址')
      return
    }

    response.value = { ok: true, dataText: '正在请求...' }
    loading.value = true

    // 注意：不再使用 paramsObj 传给 axios，因为双向绑定已经把参数全部拼接到了 url 上
    const headersObj = buildObject(headers.value)

    let data: any = undefined
    if (isMethodWithBody(method.value)) {
      if (body.value.mode === 'json') {
        const text = body.value.text.trim()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (e: any) {
            loading.value = false
            ElMessage.error('Body JSON 格式不正确')
            response.value = {
              ok: false,
              errorText: `Body JSON 格式不正确：${e.message || String(e)}`
            }
            return
          }
        } else {
          data = undefined
        }
      } else {
        data = body.value.text
      }
    }

    const start = performance.now()

    try {
      const res = await axios.request({
        url: targetUrl,
        method: method.value,
        headers: headersObj,
        data,
        timeout: 30000,
        responseType: 'blob', // 设为 blob 以支持流文件下载
        validateStatus: () => true
      })

      const timeMs = Number((performance.now() - start).toFixed(1))

      const contentType = String(res.headers?.['content-type'] || '')
      const blob = res.data as Blob

      let dataText = ''
      let isFile = false
      let fileUrl = ''
      let fileName = 'downloaded_file'
      let fileSize = ''

      // 判断是否是文本类数据
      const isText =
        contentType.includes('text') ||
        contentType.includes('json') ||
        contentType.includes('xml') ||
        contentType.includes('javascript') ||
        contentType.includes('html')

      if (!isText && blob.size > 0 && !contentType.includes('application/json')) {
        // 二进制流文件处理
        isFile = true
        fileUrl = URL.createObjectURL(blob)
        fileSize = (blob.size / 1024).toFixed(2) + ' KB'

        // 尝试从 content-disposition 中获取文件名
        const disposition = String(res.headers?.['content-disposition'] || '')
        const filenameMatch = disposition.match(
          /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i
        )
        if (filenameMatch && filenameMatch[1]) {
          fileName = decodeURIComponent(filenameMatch[1])
        } else {
          // 根据 content-type 猜测扩展名
          const ext = contentType.split('/')[1]?.split(';')[0] || 'bin'
          fileName = `download_${Date.now()}.${ext}`
        }

        dataText = `[收到二进制流文件] 大小: ${fileSize}\n点击“下载流文件”按钮进行保存。`
      } else {
        // 文本数据处理
        dataText = await blob.text()
        if (contentType.includes('application/json')) {
          try {
            dataText = JSON.stringify(JSON.parse(dataText), null, 2)
          } catch {
            // ignore
          }
        }
      }

      response.value = {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.statusText,
        timeMs,
        headers: res.headers,
        dataText,
        isFile,
        fileUrl,
        fileName,
        fileSize
      }

      // 记录到历史
      apiHistoryStore.addHistory({
        url: targetUrl,
        method: method.value,
        queryParams: JSON.parse(JSON.stringify(queryParams.value)),
        headers: JSON.parse(JSON.stringify(headers.value)),
        body: JSON.parse(JSON.stringify(body.value))
      })
    } catch (e: any) {
      const timeMs = Number((performance.now() - start).toFixed(1))
      response.value = {
        ok: false,
        timeMs,
        errorText: e.message || String(e)
      }
    } finally {
      loading.value = false
    }
  }

  const loadFromHistory = (item: any) => {
    url.value = item.url
    method.value = item.method
    queryParams.value = JSON.parse(JSON.stringify(item.queryParams))
    headers.value = JSON.parse(JSON.stringify(item.headers))
    body.value = JSON.parse(JSON.stringify(item.body))
  }

  return {
    url,
    method,
    queryParams,
    headers,
    body,
    canEditBody,
    loading,
    response,
    send,
    loadFromHistory
  }
}
