// locales/zh-CN.ts
export default {
    welcome: '欢迎来到我的 Nuxt 3 应用！',
    nav: {
      networks: '网络管理',
      libraries: '组件库'
    },
    page: {
      networks: {
        title: '光网络管理',
      }
    },
    actions: {
      actions: "操作",
      create: "创建",
      createNetwork: "创建网络",
      edit: "编辑",
      export: "导出",
      delete: "删除",
      cancel: "取消",
      saveChanges: "保存更改",
      confirmDeletion: "确认删除",
      importNetwork: "导入网络"
    },
    network: {
      title: "光学网络",
      name: "名称",
      id: "ID",
      created: "创建时间",
      updated: "更新时间",
      editTitle: "编辑网络",
      createTitle: "创建新网络",
      namePlaceholder: "请输入网络名称",
      noNetworks: "未找到网络，请创建一个！"
    },
    validation: {
      networkNameRequired: "请输入网络名称",
      correctErrors: "请修正表单中的错误"
    },
    messages: {
      networkCreated: "网络创建成功！",
      networkUpdated: "网络更新成功！",
      networkDeleted: "网络删除成功。",
      deletionCanceled: "已取消删除操作。",
      unexpectedError: "发生了意外错误。",
      importingNetwork: "正在导入网络...",
      importFailed: "启动导入过程失败。",
      deleteNetworkConfirm: "您确定要删除网络 \"{name}\" 吗？此操作无法撤消。"
    }
  }