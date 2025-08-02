// src/stores/notification.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' // 增加 success 类型以备用
  message: string
  duration?: number // 自动关闭的持续时间，单位毫秒
}

let notificationIdCounter = 0

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  /**
   * 添加一个通知
   * @param {object} options - 通知选项
   * @param {'info' | 'warning' | 'error' | 'success'} options.type - 通知类型
   * @param {string} options.message - 通知消息内容
   * @param {number} [options.duration] - 自动关闭的持续时间，默认为 3000ms
   */
  function addNotification(options: Omit<Notification, 'id'>) {
    const id = `notification-${notificationIdCounter++}`
    const newNotification: Notification = {
      id,
      duration: 3000, // 默认3秒
      ...options,
    }
    notifications.value.push(newNotification)
  }

  /**
   * 移除指定 ID 的通知
   * @param {string} id - 要移除的通知 ID
   */
  function removeNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  /**
   * 清除所有通知 (可选，用于测试或特殊场景)
   */
  function clearAllNotifications() {
    notifications.value = []
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  }
})
