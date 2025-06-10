// tailwind.config.js
module.exports = {
  // 禁用 !important 避免覆盖 Element Plus 样式
  important: false,

  // 可选：添加类名前缀隔离（如 tw-）
  prefix: 'tw-', 

  // 同步 Element Plus 的主题变量
  theme: {
    extend: {
      colors: {
        primary: 'var(--el-color-primary)',      // Element 主色
        success: 'var(--el-color-success)',     // 同步状态色
        warning: 'var(--el-color-warning)',
        danger: 'var(--el-color-danger)',
      },
      // 同步 Element 的断点（可选）
      screens: {
        'sm': '576px',  // Element 的默认 sm 断点
        'md': '768px', 
        'lg': '992px',
        'xl': '1200px'
      }
    }
  },

  // 禁用 Tailwind 的预加载样式（避免与 Element 冲突）
  corePlugins: {
    preflight: false, // 关闭 Tailwind 的全局重置样式
  },

  // 允许 Element Plus 的类名不被 PurgeCSS 清除
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    // 添加 Element Plus 相关文件
    './node_modules/element-plus/**/*.{js,ts,vue}'
  ]
}
