<!-- src/components/Snackbar.vue -->
<script setup lang="ts">
import type { Notification } from '~/stores/notification'
import { useNotificationStore } from '~/stores/notification'

const props = defineProps<{
  notification: Notification
}>()

const notificationStore = useNotificationStore()

// 根据类型计算样式类
const notificationClasses = computed(() => {
  // 移除 motion-productive-standard-moderate-01，因为它现在由 TransitionGroup 处理
  const baseClasses = 'flex items-start gap-4 p-4 pr-10 shadow-01 max-w-[24rem]'

  switch (props.notification.type) {
    case 'info':
      return `${baseClasses} bg-blue-10 dark:bg-blue-90 border-l-4 border-blue-60 dark:border-blue-50`
    case 'warning':
      return `${baseClasses} bg-orange-10 dark:bg-orange-90 border-l-4 border-orange-50 dark:border-orange-40`
    case 'error':
      return `${baseClasses} bg-red-10 dark:bg-red-90 border-l-4 border-red-60 dark:border-red-50`
    case 'success':
      return `${baseClasses} bg-green-10 dark:bg-green-90 border-l-4 border-green-60 dark:border-green-50`
    default:
      return `${baseClasses} bg-gray-10 dark:bg-gray-90 border-l-4 border-gray-60 dark:border-gray-50`
  }
})

// ... (iconClasses, notificationTypeUpper, onMounted, dismissNotification 保持不变)
const iconClasses = computed(() => {
  const baseIcon = 'icon-size-2 mt-1 flex-none'

  switch (props.notification.type) {
    case 'info':
      return `${baseIcon} text-blue-60 dark:text-blue-50 i-carbon-information-filled`
    case 'warning':
      return `${baseIcon} text-orange-50 dark:text-orange-40 i-carbon-warning-alt-filled`
    case 'error':
      return `${baseIcon} text-red-60 dark:text-red-50 i-carbon-error-filled`
    case 'success':
      return `${baseIcon} text-green-60 dark:text-green-50 i-carbon-checkmark-filled`
    default:
      return `${baseIcon} text-gray-60 dark:text-gray-50 i-carbon-information-filled`
  }
})

const notificationTypeUpper = computed(() => {
  return props.notification.type?.toUpperCase() || ''
})

// 自动关闭逻辑
onMounted(() => {
  if (props.notification.duration) {
    useTimeoutFn(() => {
      notificationStore.removeNotification(props.notification.id)
    }, props.notification.duration)
  }
})

function dismissNotification() {
  notificationStore.removeNotification(props.notification.id)
}
</script>

<template>
  <div
    :class="notificationClasses"
    role="status"
  >
    <!-- 图标区域 -->
    <div :class="iconClasses" />

    <!-- 内容区域 -->
    <div class="flex-grow">
      <!-- 标题 -->
      <div v-if="notificationTypeUpper" class="mb-1 heading01">
        {{ notificationTypeUpper }}
      </div>

      <!-- 消息内容 -->
      <div class="body01">
        {{ notification.message }}
      </div>
    </div>

    <!-- 关闭按钮 -->
    <button
      type="button"
      class="absolute right-4 top-4 rounded-none p-1 text-gray-60 hover:bg-gray-20 dark:text-gray-30 focus:outline-none focus:ring-2 focus:ring-blue-60 dark:hover:bg-gray-80 dark:focus:ring-blue-50"
      aria-label="关闭通知"
      @click="dismissNotification"
    >
      <div class="i-carbon-close text-xl" />
    </button>
  </div>
</template>

<style scoped>
/* 使用 UnoCSS 的原子类，不需要自定义样式 */
</style>
