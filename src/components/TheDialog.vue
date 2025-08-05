<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  type: 'alert' | 'confirm' | 'prompt'
  title: string
  message: string
  initialValue?: string // For prompt type
  confirmButtonText?: string
  cancelButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm', value?: string): void
  (e: 'cancel'): void
}>()

const inputValue = ref(props.initialValue || '')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputValue.value = props.initialValue || '' // Reset input on open
    // Optional: focus on input if prompt, or first button if not
    // nextTick(() => { /* focus logic */ })
  }
})

const showCancelButton = computed(() => props.type !== 'alert')
const showInputField = computed(() => props.type === 'prompt')

const confirmText = computed(() => props.confirmButtonText || (props.type === 'alert' ? '确定' : '确认'))
const cancelText = computed(() => props.cancelButtonText || '取消')

const confirmButtonClass = computed(() => {
  if (props.type === 'confirm' && props.message.includes('删除')) { // Simple heuristic for destructive action
    return 'btn-danger'
  }
  return 'btn-primary'
})

function handleConfirm() {
  emit('confirm', showInputField.value ? inputValue.value : undefined)
  emit('update:isOpen', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex-center bg-black/50 transition-opacity duration-300"
        @click.self="handleCancel"
      >
        <div
          class="relative max-w-sm w-full scale-95 transform rounded-lg bg-white p-6 shadow-lg transition-all duration-300 ease-out sm:scale-100 space-y-4 dark:bg-slate-800"
          @click.stop
        >
          <!-- Icon (Optional: based on type, e.g., i-carbon-warning for confirm, i-carbon-info for alert) -->
          <div v-if="type === 'confirm'" class="mb-2 flex-center">
            <div i-carbon-warning-alt-filled text-3xl text-amber-500 />
          </div>

          <h3 class="text-xl text-gray-800 font-bold dark:text-slate-200">
            {{ title }}
          </h3>
          <p class="text-sm text-gray-700 leading-normal dark:text-slate-300">
            {{ message }}
          </p>

          <input
            v-if="showInputField"
            v-model="inputValue"
            type="text"
            class="input-field"
            :placeholder="props.initialValue || ''"
            @keyup.enter="handleConfirm"
          >

          <div class="flex gap-2" :class="showCancelButton ? 'justify-end' : 'justify-center'">
            <button
              v-if="showCancelButton"
              text="sm"
              class="btn-secondary"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              :class="confirmButtonClass"
              text="sm"
              class="btn"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* For the dialog box itself to animate */
.dialog-fade-enter-active .bg-white,
.dialog-fade-leave-active .bg-white,
.dialog-fade-enter-active .dark\:bg-slate-800,
.dialog-fade-leave-active .dark\:bg-slate-800 {
  transition: transform 0.3s ease-out;
}
.dialog-fade-enter-from .bg-white,
.dialog-fade-leave-to .bg-white,
.dialog-fade-enter-from .dark\:bg-slate-800,
.dialog-fade-leave-to .dark\:bg-slate-800 {
  transform: scale(0.95);
}
</style>
