<script setup lang="ts">
const router = useRouter()
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
  <div class="flex-col-center py-8">
    <div text-4xl>
      <div i-carbon-pedestrian inline-block />
    </div>

    <p text-sm opacity-75>
      <em> Editor default page. </em>
    </p>

    <div class="flex gap-4 py-6">
      <button class="btn-secondary" @click="triggerInfo">
        信息
      </button>
      <button class="btn-secondary" @click="triggerWarning">
        警告
      </button>
      <button class="btn-secondary" @click="triggerError">
        错误
      </button>
      <button class="btn-secondary" @click="triggerSuccess">
        成功
      </button>
    </div>

    <div>
      <button
        m="3 t6" text-sm btn-ghost
        @click="router.back()"
      >
        Back
      </button>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
