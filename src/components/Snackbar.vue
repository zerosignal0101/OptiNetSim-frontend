<!-- src/components/Snackbar.vue -->
<script setup lang="ts">
import type { Notification } from '~/stores/notification'
import { useNotificationStore } from '~/stores/notification'

const props = defineProps<{
  notification: Notification
}>()

const notificationStore = useNotificationStore()

// 根据类型计算颜色和图标
const notificationClasses = computed(() => {
  // 使用 Carbon 的背景色和边框色
  const baseBg = 'bg-gray-10 dark:bg-gray-90'

  switch (props.notification.type) {
    case 'info':
      // Carbon 的蓝色主题
      return `${baseBg} border-l-4 border-blue-60 dark:border-blue-50`
    case 'warning':
      // Carbon 的橙色主题
      return `${baseBg} border-l-4 border-orange-50 dark:border-orange-40`
    case 'error':
      // Carbon 的红色主题
      return `${baseBg} border-l-4 border-red-60 dark:border-red-50`
    case 'success':
      // Carbon 的绿色主题
      return `${baseBg} border-l-4 border-green-60 dark:border-green-50`
    default:
      // 默认中性主题
      return `${baseBg} border-l-4 border-gray-60 dark:border-gray-50`
  }
})

const notificationIcon = computed(() => {
  switch (props.notification.type) {
    case 'info':
      return 'i-carbon-information'
    case 'warning':
      return 'i-carbon-warning-alt'
    case 'error':
      return 'i-carbon-error'
    case 'success':
      return 'i-carbon-checkmark-filled'
    default:
      return 'i-carbon-notification'
  }
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
    class="shadow-01 relative flex items-start gap-4 p-4 pr-10 motion-productive-standard-moderate-01 max-w-[24rem]"
    role="alert"
  >
    <div
      class="mt-0.5 flex-none text-2xl text-gray-60 dark:text-gray-50" :class="[
        notificationIcon,
        {
          'text-blue-60 dark:text-blue-50': notification.type === 'info',
          'text-orange-50 dark:text-orange-40': notification.type === 'warning',
          'text-red-60 dark:text-red-50': notification.type === 'error',
          'text-green-60 dark:text-green-50': notification.type === 'success',
        },
      ]"
    />

    <!-- 消息内容 -->
    <p class="flex-grow body01">
      {{ notification.message }}
    </p>

    <!-- 关闭按钮 -->
    <button
      type="button"
      class="absolute right-4 top-4 rounded p-1 text-gray-60 hover:bg-gray-20 dark:text-gray-30 focus:outline-none focus:ring-2 focus:ring-blue-60 dark:hover:bg-gray-80 dark:focus:ring-blue-50"
      aria-label="关闭通知"
      @click="dismissNotification"
    >
      <div class="i-carbon-close text-xl" />
    </button>
  </div>
</template>

<style scoped>
/* Carbon 风格的动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0.14, 0.3, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.list-move {
  transition: transform 0.15s cubic-bezier(0.4, 0.14, 0.3, 1);
}
</style>
