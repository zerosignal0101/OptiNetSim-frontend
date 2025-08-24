<!-- src/components/SnackbarContainer.vue -->
<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'
import Snackbar from './Snackbar.vue'

const notificationStore = useNotificationStore()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-30">
    <TransitionGroup name="list" tag="div" class="relative flex flex-col items-end gap-2">
      <Snackbar
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :notification="notification"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 应用 Carbon Design System 的动画规则 */

/* 进入动画：从略微下方和透明状态上浮并淡入 */
.list-enter-active {
  /* 对应 motion-productive-entrance-moderate-01 */
  transition-property: opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0, 0, 0.38, 0.9); /* Carbon productive-entrance timing */
}
.list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
/* list-enter-to 默认为元素最终状态，不需要单独定义 */

/* 离开动画：向右滑出并淡出 */
.list-leave-active {
  /* 对应 motion-productive-exit-moderate-01 */
  transition-property: opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.2, 0, 1, 0.9); /* Carbon productive-exit timing */
  /* === 关键改动：移除 position: absolute; 和 width: 100%; === */
  /* 让 Vue 通过 list-move 的机制来自动管理离开元素的定位 */
}
.list-leave-to {
  opacity: 0.5;
  transform: translateX(100%); /* 完全滑出右侧 */
}
/* list-leave-from 默认为元素当前状态，不需要单独定义 */

/* 列表移动动画：当有元素离开时，剩余元素平滑移动到位 */
.list-move {
  /* 对应 motion-productive-standard-moderate-01 */
  transition-property: transform; /* 注意：这里只应该过渡 transform */
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0.38, 0.9); /* Carbon productive-standard timing */
}
</style>
