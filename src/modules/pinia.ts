import type { Notification } from '~/stores/notification' // 假设你的 store 在这个路径
import type { UserModule } from '~/types'
import { createPinia } from 'pinia'
import { useNotificationStore } from '~/stores/notification'

// 扩展 Vue 全局属性的 TypeScript 类型声明
// 这确保了当你使用 `this.$notify` 或 `app.config.globalProperties.$notify` 时有正确的类型提示
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $notify: (options: Omit<Notification, 'id'>) => void
  }
}

// Setup Pinia
// https://pinia.vuejs.org/
export const install: UserModule = ({ isClient, initialState, app }) => {
  const pinia = createPinia()
  app.use(pinia)
  // Refer to
  // https://github.com/antfu/vite-ssg/blob/main/README.md#state-serialization
  // for other serialization strategies.
  // 对于 SSR 场景，可能需要根据初始状态 Hydrate Pinia store
  if (isClient)
    pinia.state.value = (initialState.pinia) || {}

  else
    initialState.pinia = pinia.state.value

  // Auth store init
  initializeAuth()

  // 2. 获取 Notification Store 实例
  // 注意：useNotificationStore() 必须在 Pinia 被安装到 app 后才能被调用
  const notificationStore = useNotificationStore()
  // 3. 挂载全局方法 $notify
  app.config.globalProperties.$notify = notificationStore.addNotification
}
