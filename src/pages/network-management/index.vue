<script setup lang="ts">
import { getCurrentInstance } from 'vue'

// 在 setup 中获取当前组件实例的代理，以访问全局属性
const app = getCurrentInstance()! // 确保获取到实例
const { proxy } = app // 解构出 proxy

function triggerInfo() {
  proxy!.$notify({
    type: 'info',
    message: '这是一条信息通知，它将在3秒后自动关闭。',
  })
}

function triggerWarning() {
  proxy!.$notify({
    type: 'warning',
    message: '警告：请注意您的操作，这可能会导致数据丢失！',
    duration: 5000,
  })
}

function triggerError() {
  proxy!.$notify({
    type: 'error',
    message: '错误：数据提交失败，请检查网络连接或重试。',
    duration: 0, // 不自动关闭
  })
}

function triggerSuccess() {
  proxy!.$notify({
    type: 'success',
    message: '操作成功！您的设置已保存。',
  })
}
</script>

<template>
  <div class="p-8 space-y-4">
    <h1 class="text-3xl text-teal-700 font-serif">
      通知组件示例
    </h1>
    <div class="flex gap-4">
      <button class="rounded bg-blue-500 px-4 py-2 text-white" @click="triggerInfo">
        信息
      </button>
      <button class="rounded bg-yellow-500 px-4 py-2 text-white" @click="triggerWarning">
        警告
      </button>
      <button class="rounded bg-red-500 px-4 py-2 text-white" @click="triggerError">
        错误
      </button>
      <button class="rounded bg-green-500 px-4 py-2 text-white" @click="triggerSuccess">
        成功
      </button>
    </div>
  </div>
</template>
