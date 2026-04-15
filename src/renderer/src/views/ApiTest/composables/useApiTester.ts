import { computed, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

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
  const url = ref('https://jsonplaceholder.typicode.com/todos/1')
  const method = ref<HttpMethod>('GET')

  const queryParams = ref<KeyValueRow[]>([{ enabled: true, key: '', value: '' }])
  const headers = ref<KeyValueRow[]>([{ enabled: true, key: '', value: '' }])
  const body = ref<BodyState>({ mode: 'json', text: '' })

  const loading = ref(false)
  const response = ref<ResponseState>({ ok: true })

  const canEditBody = computed(() => isMethodWithBody(method.value))

  const send = async () => {
    const targetUrl = url.value.trim()
    if (!targetUrl) {
      ElMessage.warning('请输入请求地址')
      return
    }

    response.value = { ok: true, dataText: '正在请求...' }
    loading.value = true

    const paramsObj = buildObject(queryParams.value)
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
        params: paramsObj,
        headers: headersObj,
        data,
        timeout: 30000,
        validateStatus: () => true
      })

      const timeMs = Number((performance.now() - start).toFixed(1))

      const contentType = String(res.headers?.['content-type'] || '')
      let dataText = ''
      if (typeof res.data === 'string') {
        dataText = res.data
      } else if (contentType.includes('application/json')) {
        dataText = JSON.stringify(res.data, null, 2)
      } else {
        try {
          dataText = JSON.stringify(res.data, null, 2)
        } catch {
          dataText = String(res.data)
        }
      }

      response.value = {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.statusText,
        timeMs,
        headers: res.headers,
        dataText
      }
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

  return {
    url,
    method,
    queryParams,
    headers,
    body,
    canEditBody,
    loading,
    response,
    send
  }
}
