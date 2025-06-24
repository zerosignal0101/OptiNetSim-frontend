<template>
  <div class="text-center py-10">
    <h1 class="text-3xl font-bold mb-4">{{ t('welcome') }}</h1>
    <p class="mb-6">{{ t('page.home.title') }}</p>
    <el-button type="primary" size="large" @click="goToNetworks">
      {{ t('actions.manageNetworks') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
function goToNetworks() {
  // 使用 localePath 获取正确本地化路径
  navigateTo(localePath('/networks'))
}
// Redirect immediately if preferred
// await navigateTo('/networks');
</script>
