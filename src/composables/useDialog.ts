interface DialogState {
  isOpen: boolean
  type: 'alert' | 'confirm' | 'prompt' | 'select'
  title: string
  message: string
  initialValue?: string
  selectOptions?: Array<{ label: string, value: string }>
  confirmButtonText?: string
  cancelButtonText?: string
  // For Promise resolution
  // _resolve 应该能够接受 handleConfirm 和 handleCancel 传递的所有可能值：true, false, null, value || '' (string)
  _resolve: ((value: boolean | string | null) => void) | null
  _reject: (() => void) | null
}

const dialogState = reactive<DialogState>({
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  initialValue: '',
  selectOptions: [],
  confirmButtonText: '',
  cancelButtonText: '',
  _resolve: null,
  _reject: null,
})

export function useDialog() {
  const openDialog = (type: DialogState['type'], title: string, message: string, options?: { initialValue?: string, selectOptions?: Array<{ label: string, value: string }>, confirmButtonText?: string, cancelButtonText?: string }) => {
    dialogState.type = type
    dialogState.title = title
    dialogState.message = message
    dialogState.initialValue = options?.initialValue
    dialogState.selectOptions = options?.selectOptions
    dialogState.confirmButtonText = options?.confirmButtonText
    dialogState.cancelButtonText = options?.cancelButtonText
    dialogState.isOpen = true
  }

  const closeDialog = () => {
    dialogState.isOpen = false
    dialogState._resolve = null
    dialogState._reject = null
    dialogState.initialValue = '' // 清除 initial value
    dialogState.selectOptions = [] // 清除 select options
  }

  const handleConfirm = (value?: string) => {
    if (dialogState._resolve) {
      if (dialogState.type === 'prompt' || dialogState.type === 'select') {
        // 对于 prompt/select，使用输入值或空字符串来解析
        dialogState._resolve(value || '')
      }
      else {
        // 对于 alert/confirm，解析为 true
        dialogState._resolve(true)
      }
    }
    closeDialog()
  }

  const handleCancel = () => {
    if (dialogState._resolve) {
      if (dialogState.type === 'prompt' || dialogState.type === 'select') {
        // 对于 prompt/select，取消时解析为 null
        dialogState._resolve(null)
      }
      else {
        // 对于 confirm，取消时解析为 false。
        // 对于 alert，虽然会传递 false，但由于 showAlert 的 Promise 是 void 类型，
        // 实际的 resolve 调用的参数会被忽略，只表示操作完成。
        dialogState._resolve(false)
      }
    }
    closeDialog()
  }

  // Public API methods
  const showAlert = (title: string, message: string, options?: { confirmButtonText?: string }) => {
    return new Promise<void>((resolve) => {
      openDialog('alert', title, message, options)
      // 这里的 `resolve` 是 `() => void`。
      // `dialogState._resolve` 期望 `(value: boolean | string | null) => void`。
      // 因此，我们需要一个包装函数，它接受 `dialogState._resolve` 所期望的参数，
      // 但在内部调用原始的 `resolve()` (不带参数)。
      dialogState._resolve = (_val: boolean | string | null) => {
        resolve() // 调用原始的 Promise<void> 的 resolve，不传递任何参数
      }
    })
  }

  const showConfirm = (title: string, message: string, options?: { confirmButtonText?: string, cancelButtonText?: string }) => {
    return new Promise<boolean>((resolve) => {
      openDialog('confirm', title, message, options)
      dialogState._resolve = (val: boolean | string | null) => {
        // 由于是 confirm 类型，我们知道 val 将是 boolean (true 或 false)
        resolve(val as boolean)
      }
    })
  }

  const showPrompt = (title: string, message: string, options?: { initialValue?: string, confirmButtonText?: string, cancelButtonText?: string }) => {
    return new Promise<string | null>((resolve) => {
      openDialog('prompt', title, message, options)
      dialogState._resolve = (val: boolean | string | null) => {
        // 由于是 prompt 类型，我们知道 val 将是 string 或 null
        resolve(val as string | null)
      }
    })
  }

  const showSelect = (title: string, message: string, options: Array<{ label: string, value: string }>, defaultOptions?: { confirmButtonText?: string, cancelButtonText?: string }) => {
    return new Promise<string | null>((resolve) => {
      openDialog('select', title, message, { selectOptions: options, ...defaultOptions })
      dialogState._resolve = (val: boolean | string | null) => {
        // 由于是 select 类型，我们知道 val 将是 string 或 null
        resolve(val as string | null)
      }
    })
  }

  return {
    dialogState,
    showAlert,
    showConfirm,
    showPrompt,
    showSelect,
    handleConfirm, // 将这些处理函数传递给 TheDialog 组件
    handleCancel, // 将这些处理函数传递给 TheDialog 组件
  }
}
