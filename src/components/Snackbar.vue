<!-- src/components/Snackbar.vue -->
<script setup lang="ts">
import type { Notification } from '~/stores/notification'
import { useTimeoutFn } from '@vueuse/core' // 导入 VueUse 的 useTimeoutFn
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '~/stores/notification'

const props = defineProps<{
  notification: Notification
}>()

const notificationStore = useNotificationStore()

// 根据类型计算颜色和图标
const notificationClasses = computed(() => {
  switch (props.notification.type) {
    case 'info':
      return 'bg-blue-100 border-blue-500 text-blue-700'
    case 'warning':
      return 'bg-yellow-100 border-yellow-500 text-yellow-700'
    case 'error':
      return 'bg-red-100 border-red-500 text-red-700'
    case 'success': // 提前预留 Success 类型
      return 'bg-green-100 border-green-500 text-green-700'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-700'
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
    class="relative max-w-sm w-full flex items-start gap-3 border-l-4 rounded-md p-4 pr-10 shadow-md transition-all duration-300 ease-in-out"
    role="alert"
  >
    <!-- 图标 -->
    <div :class="notificationIcon" class="mt-0.5 flex-none text-lg" />

    <!-- 消息内容 -->
    <p class="flex-grow text-sm font-sans md:text-base">
      {{ notification.message }}
    </p>

    <!-- 关闭按钮 -->
    <button
      type="button"
      class="absolute right-2 top-2 rounded-full p-1 text-gray-500 transition duration-200 ease-in-out hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
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
  transition: all 0.3s ease-out;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(100%); /* 从右侧滑入/滑出 */
}

/* 保持动画元素之间的移动平滑 */
.list-move {
  transition: transform 0.3s ease-out;
}
</style>
