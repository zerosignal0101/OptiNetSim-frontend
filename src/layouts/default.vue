<script setup lang="ts">
const dialog = useDialog() // 引入 useDialog
</script>

<template>
  <main class="py-8">
    <div text="gray-100 dark:gray-10" bg="white dark:gray-100">
      <RouterView />
    </div>
    <TheFooter />
    <!-- <div bodycompat01 mx-auto mt-5 text-center opacity-50>
      [Default Layout]
    </div> -->
    <SnackbarContainer />
  </main>
  <!-- 在 layout 的最顶层挂载 TheDialog -->
  <TheDialog
    :is-open="dialog.dialogState.isOpen"
    :type="dialog.dialogState.type"
    :title="dialog.dialogState.title"
    :message="dialog.dialogState.message"
    :initial-value="dialog.dialogState.initialValue"
    :select-options="dialog.dialogState.selectOptions"
    :confirm-button-text="dialog.dialogState.confirmButtonText"
    :cancel-button-text="dialog.dialogState.cancelButtonText"
    @confirm="dialog.handleConfirm"
    @cancel="dialog.handleCancel"
    @update:is-open="(val) => dialog.dialogState.isOpen = val"
  />
</template>
