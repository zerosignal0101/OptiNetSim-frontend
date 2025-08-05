<script setup lang="ts">
import { useDialog } from '~/composables/useDialog'

const dialog = useDialog() // 引入 useDialog
</script>

<template>
  <main text="gray-800 dark:slate-200" bg="white dark:slate-900">
    <RouterView />
    <SnackbarContainer />
  </main>
  <!-- 在 layout 的最顶层挂载 TheDialog -->
  <TheDialog
    :is-open="dialog.dialogState.isOpen"
    :type="dialog.dialogState.type"
    :title="dialog.dialogState.title"
    :message="dialog.dialogState.message"
    :initial-value="dialog.dialogState.initialValue"
    :confirm-button-text="dialog.dialogState.confirmButtonText"
    :cancel-button-text="dialog.dialogState.cancelButtonText"
    @confirm="dialog.handleConfirm"
    @cancel="dialog.handleCancel"
    @update:is-open="(val) => dialog.dialogState.isOpen = val"
  />
</template>
