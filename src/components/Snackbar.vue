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
  // 基础背景色，根据 V.I.S. 中卡片/表面背景色定义
  const baseBg = 'bg-gray-50 dark:bg-slate-800'

  switch (props.notification.type) {
    case 'info':
      // 浅色模式: border-blue-600 text-blue-600
      // 深色模式: dark:border-blue-500 dark:text-blue-500
      return `${baseBg} border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500`
    case 'warning':
      // 浅色模式: border-amber-500 text-amber-500
      // 深色模式: dark:border-amber-400 dark:text-amber-400
      return `${baseBg} border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400`
    case 'error':
      // 浅色模式: border-red-600 text-red-600
      // 深色模式: dark:border-red-500 dark:text-red-500
      return `${baseBg} border-red-600 text-red-600 dark:border-red-500 dark:text-red-500`
    case 'success': // 提前预留 Success 类型
      // 浅色模式: border-green-600 text-green-600
      // 深色模式: dark:border-green-500 dark:text-green-500
      return `${baseBg} border-green-600 text-green-600 dark:border-green-500 dark:text-green-500`
    default:
      // 默认/中性通知，使用 V.I.S. 中的边框和主文本颜色
      // 浅色模式: border-gray-200 text-gray-800
      // 深色模式: dark:border-slate-700 dark:text-slate-200
      return `${baseBg} border-gray-200 text-gray-800 dark:border-slate-700 dark:text-slate-200`
  }
})

const notificationIcon = computed(() => {
  switch (props.notification.type) {
    case 'info':
      return 'i-carbon-information'
    case 'warning':
      return 'i-carbon-warning'
    case 'error':
      return 'i-carbon-error'
    case 'success':
      return 'i-carbon-checkmark'
    default:
      return 'i-carbon-notification' // 默认图标
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
    class="relative max-w-sm w-full flex items-start gap-3 border-l-4 rounded-md p-4 pr-10 shadow transition-all duration-300 ease-in-out dark:ring-1 dark:ring-white/20"
    role="alert"
  >
    <!-- 图标 -->
    <div :class="notificationIcon" class="mt-0.5 flex-none text-lg" />

    <!-- 消息内容 -->
    <p class="flex-grow text-sm md:text-base">
      {{ notification.message }}
    </p>

    <!-- 关闭按钮 -->
    <button
      type="button"
      class="absolute right-2 top-2 rounded-full p-1 text-gray-500 transition duration-200 ease-in-out dark:text-slate-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:hover:text-slate-200 dark:focus:ring-slate-500"
      aria-label="关闭通知"
      @click="dismissNotification"
    >
      <div class="i-carbon-close text-base" />
    </button>
  </div>
</template>

<style scoped>
/* TransitionGroup 的动画类 */
/* 进入动画：从右侧滑入，逐渐显示 */
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease-out;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(100%); /* 从右侧滑入/滑出 */
}

/* 保持动画元素之间的移动平滑 */
.list-move {
  transition: transform 0.15s ease-out;
}
</style>
