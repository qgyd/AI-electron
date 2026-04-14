import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store = createPinia()

// 使用数据持久化插件
store.use(piniaPluginPersistedstate)

export default store
