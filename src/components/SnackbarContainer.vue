<!-- src/components/SnackbarContainer.vue -->
<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'
import Snackbar from './Snackbar.vue' // 假设 Snackbar.vue 在同一目录下

const notificationStore = useNotificationStore()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
    <TransitionGroup name="list">
      <Snackbar
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :notification="notification"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 无需额外样式，Snackbar.vue 的动画类已定义 */
</style>
