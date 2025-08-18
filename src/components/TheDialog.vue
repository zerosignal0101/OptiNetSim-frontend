<!-- src/components/TheDialog.vue -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue' // 导入 ref, watch, nextTick
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isOpen: boolean
  type: 'alert' | 'confirm' | 'prompt' | 'select'
  title: string
  message: string
  initialValue?: string // For prompt type
  selectOptions?: Array<{ label: string, value: string }> // For select type
  confirmButtonText?: string
  cancelButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm', value?: string): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

// 模板引用，用于聚焦
const inputRef = ref<HTMLInputElement | null>(null)
const selectRef = ref<HTMLSelectElement | null>(null)
const confirmButtonRef = ref<HTMLButtonElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null) // 可选，如果希望cancel键也能聚焦

const inputValue = ref(props.initialValue || '')

const showCancelButton = computed(() => props.type !== 'alert')
const showInputField = computed(() => props.type === 'prompt')
const showSelectField = computed(() => props.type === 'select')

const confirmText = computed(() => props.confirmButtonText || (props.type === 'alert' ? t('actions.ok') : t('actions.confirm')))
const cancelText = computed(() => props.cancelButtonText || t('actions.cancel'))

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputValue.value = props.initialValue || '' // Reset input on open
    nextTick(() => { // 确保 DOM 已经更新
      if (showInputField.value && inputRef.value) {
        inputRef.value.focus()
      }
      else if (showSelectField.value && selectRef.value) {
        selectRef.value.focus()
      }
      else if (confirmButtonRef.value) {
        // 对于 alert, confirm 等，聚焦确认按钮
        confirmButtonRef.value.focus()
      }
      // 可以在这里添加 else if (cancelButtonRef.value && props.type !== 'alert') { cancelButtonRef.value.focus(); }
      // 或者根据需要调整聚焦逻辑，例如 confirm 弹出是聚焦 confirm，alert弹出是聚焦 ok 按钮
    })
  }
})

const confirmButtonClass = computed(() => {
  // 优化：将 btn 类与颜色类分离
  if (props.type === 'alert') { // Simple heuristic for destructive action
    return 'btn-danger'
  }
  return 'btn-primary'
})

function handleConfirm() {
  emit('confirm', (showInputField.value || showSelectField.value) ? inputValue.value : undefined)
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
        class="flex-center fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
        tabindex="-1"
        @click.self="handleCancel"
      >
        <div
          class="relative w-full scale-95 transform rounded-lg bg-white p-6 shadow-lg transition-all duration-300 ease-out max-w-sm sm:scale-100 space-y-4 dark:bg-slate-800"
          @click.stop
        >
          <!-- Icon (Optional: based on type, e.g., i-carbon-warning for confirm, i-carbon-info for alert) -->
          <div v-if="type === 'confirm'" class="flex-center mb-2">
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
            ref="inputRef"
            v-model="inputValue"
            type="text"
            class="input-field focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :placeholder="props.initialValue || t('dialog.placeholder_input')"
            @keyup.enter="handleConfirm"
          >

          <select
            v-if="showSelectField"
            ref="selectRef"
            v-model="inputValue"
            class="input-field focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :placeholder="t('dialog.placeholder_select')"
            @keyup.enter="handleConfirm"
          >
            <!-- 确保至少有一个默认的选项，或者在placeholder后添加空的禁用选项 -->
            <option v-if="!inputValue" value="" disabled selected hidden>
              {{ t('dialog.placeholder_select') }}
            </option>
            <option v-for="option in props.selectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <div class="flex gap-2" :class="showCancelButton ? 'justify-end' : 'justify-center'">
            <button
              v-if="showCancelButton"
              ref="cancelButtonRef"
              text="sm"
              class="btn btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmButtonRef"
              text="sm"
              class="btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
              :class="{
                'btn-primary focus:ring-blue-500': confirmButtonClass === 'btn-primary',
                'btn-danger focus:ring-red-500': confirmButtonClass === 'btn-danger',
              }"
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
/* 保持原有的过渡效果 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active > div,
.dialog-fade-leave-active > div {
  /* 直接 targeting the inner dialog box */
  transition: transform 0.15s ease-out;
}
.dialog-fade-enter-from > div,
.dialog-fade-leave-to > div {
  transform: scale(0.95);
}
</style>
