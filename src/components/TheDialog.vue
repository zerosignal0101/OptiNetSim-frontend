<!-- src/components/TheDialog.vue -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isOpen: boolean
  type: 'alert' | 'confirm' | 'prompt' | 'select'
  title: string
  message: string
  initialValue?: string
  selectOptions?: Array<{ label: string, value: string }>
  confirmButtonText?: string
  cancelButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm', value?: string): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

// 模板引用
const inputRef = ref<HTMLInputElement | null>(null)
const selectRef = ref<HTMLSelectElement | null>(null)
const confirmButtonRef = ref<HTMLButtonElement | null>(null)

const inputValue = ref(props.initialValue || '')

const showCancelButton = computed(() => props.type !== 'alert')
const showInputField = computed(() => props.type === 'prompt')
const showSelectField = computed(() => props.type === 'select')

const confirmText = computed(() => props.confirmButtonText || (props.type === 'alert' ? t('actions.ok') : t('actions.confirm')))
const cancelText = computed(() => props.cancelButtonText || t('actions.cancel'))

// CDS 对话框类型样式
const dialogTypeStyles = computed(() => {
  switch (props.type) {
    case 'confirm':
      return {
        icon: 'i-carbon-warning-alt-filled',
        iconColor: 'text-yellow-50',
        buttonClass: 'btn-primary',
      }
    case 'alert':
      return {
        icon: 'i-carbon-information-filled',
        iconColor: 'text-blue-50',
        buttonClass: 'btn-primary',
      }
    case 'prompt':
    case 'select':
    default:
      return {
        icon: '',
        iconColor: '',
        buttonClass: 'btn-primary',
      }
  }
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputValue.value = props.initialValue || ''
    nextTick(() => {
      if (showInputField.value && inputRef.value) {
        inputRef.value.focus()
      }
      else if (showSelectField.value && selectRef.value) {
        selectRef.value.focus()
      }
      else if (confirmButtonRef.value) {
        confirmButtonRef.value.focus()
      }
    })
  }
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
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300"
        tabindex="-1"
        @click.self="handleCancel"
      >
        <div
          class="relative w-full transform bg-white shadow-lg transition-all duration-300 ease-out max-w-sm dark:bg-gray-100"
          @click.stop
        >
          <div class="p-6">
            <!-- CDS 图标区域 -->
            <div v-if="dialogTypeStyles.icon" class="mb-4 flex justify-center">
              <div class="text-3xl" :class="[dialogTypeStyles.icon, dialogTypeStyles.iconColor]" />
            </div>

            <!-- 标题区域 -->
            <h3 class="mb-2 heading03 text-gray-100 dark:text-gray-10">
              {{ title }}
            </h3>

            <!-- 消息区域 -->
            <p class="mb-4 body01 text-gray-60 dark:text-gray-30">
              {{ message }}
            </p>

            <!-- 输入框区域 -->
            <div v-if="showInputField" class="mb-4">
              <input
                ref="inputRef"
                v-model="inputValue"
                type="text"
                class="cds-input w-full"
                :placeholder="props.initialValue || t('dialog.placeholder_input')"
                @keyup.enter="handleConfirm"
              >
            </div>

            <!-- 选择框区域 -->
            <div v-if="showSelectField" class="mb-4">
              <select
                ref="selectRef"
                v-model="inputValue"
                class="cds-input w-full"
                @keyup.enter="handleConfirm"
              >
                <option v-if="!inputValue" value="" disabled selected hidden>
                  {{ t('dialog.placeholder_select') }}
                </option>
                <option v-for="option in props.selectOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          <!-- 按钮区域 - CDS 色块分割按钮 -->
          <div class="h-10 flex border-t border-gray-30 bodyCompact01 dark:border-gray-60">
            <button
              v-if="showCancelButton"
              class="cds-btn--secondary flex-1"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmButtonRef"
              class="cds-btn--primary flex-1"
              :class="{ 'w-full': !showCancelButton }"
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
/* CDS 对话框容器样式 */
.fixed > div {
  border-radius: 0; /* CDS 无圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* CDS 标准阴影 */
}

/* CDS 输入框样式 */
.cds-input {
  @apply w-full rounded-none border border-gray-60 bg-white px-4 py-2 text-gray-100
         focus:border-blue-60 focus:outline-none focus:ring-1 focus:ring-blue-60
         dark:border-gray-50 dark:bg-gray-80 dark:text-gray-10;
  border-radius: 0; /* CDS 无圆角 */
}

/* CDS 动画效果 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  @apply motion-productive-standard-fast-02;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  @apply opacity-0;
}
</style>
