<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
// 在 setup 中获取当前组件实例的代理，以访问全局属性
const app = getCurrentInstance()! // 确保获取到实例
const { proxy } = app // 解构出 proxy

function triggerInfo() {
  proxy!.$notify({
    type: 'info',
    message: t('notification.info_message'),
  })
}
function triggerWarning() {
  proxy!.$notify({
    type: 'warning',
    message: t('notification.warning_message'),
    duration: 5000,
  })
}
function triggerError() {
  proxy!.$notify({
    type: 'error',
    message: t('notification.error_message'),
    duration: 0, // 不自动关闭
  })
}
function triggerSuccess() {
  proxy!.$notify({
    type: 'success',
    message: t('notification.success_message'),
  })
}
</script>

<template>
  <div class="flex-col-center py-8">
    <div text-4xl>
      <div i-carbon-pedestrian inline-block />
    </div>

    <p text-sm opacity-75>
      <em> {{ t('editor.default_page_description') }} </em>
    </p>

    <div class="flex gap-4 py-6">
      <button class="btn-secondary" @click="triggerInfo">
        {{ t('notification.info') }}
      </button>
      <button class="btn-secondary" @click="triggerWarning">
        {{ t('notification.warning') }}
      </button>
      <button class="btn-secondary" @click="triggerError">
        {{ t('notification.error') }}
      </button>
      <button class="btn-secondary" @click="triggerSuccess">
        {{ t('notification.success') }}
      </button>
    </div>

    <div>
      <button
        m="3 t6" text-sm btn-ghost
        @click="router.back()"
      >
        {{ t('actions.back') }}
      </button>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
