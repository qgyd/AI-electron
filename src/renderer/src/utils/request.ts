import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 核心设计理念：
 * 1. 单例模式，全局配置 Axios
 * 2. 请求/响应拦截器统一处理（Token，错误提示）
 * 3. 泛型返回，增强 TypeScript 的类型推导
 */

// 根据实际后端约定的数据结构进行修改
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // 根据项目环境变量配置
  timeout: 15000, // 默认 15s 超时
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// === 请求拦截器 ===
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 统一在这里附加 Token 等通用认证信息
    // const token = localStorage.getItem('token')
    // if (token && config.headers) {
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// === 响应拦截器 ===
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 很多后端接口会包裹一层 { code, data, message }
    // 如果只需要拿 data，可以在这里直接返回 response.data
    const res = response.data

    // 这里可根据公司实际的业务状态码进行全局错误拦截
    // 例如：
    // if (res.code !== 200) {
    //   ElMessage.error(res.message || '请求失败')
    //   return Promise.reject(new Error(res.message))
    // }

    return res
  },
  (error: any) => {
    // 统一处理 HTTP 原生错误状态码
    let message = '未知错误'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = `请求地址出错: ${error.response.config.url}`
          break
        case 408:
          message = '请求超时'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 501:
          message = '服务未实现'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        case 505:
          message = 'HTTP版本不受支持'
          break
        default:
          message = `系统连接错误 (${error.response.status})`
      }
    } else if (error.message && error.message.includes('timeout')) {
      message = '网络请求超时，请重试'
    } else if (error.message && error.message.includes('Network Error')) {
      message = '网络连接断开，请检查网络'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// === 导出经过封装的强类型 HTTP 方法 ===
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.patch(url, data, config)
  }
}

export default service
