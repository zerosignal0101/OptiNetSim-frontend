// src/composables/editorConfig.ts
import { colors } from 'unocss/preset-mini'
import { defineConfigs } from 'v-network-graph'

export function getGraphConfig(isDark: boolean) {
  return defineConfigs({
    view: {
      grid: {
        visible: true,
        interval: 20,
        thickIncrements: 5,
        line: {
          color: isDark ? colors.slate[700] : colors.gray[100],
          width: 0.5,
        },
        thick: {
          color: isDark ? colors.slate[600] : colors.gray[200],
          width: 1,
        },
      },
    },
    node: {
      normal: {
        // 使用函数根据节点类型返回不同配置
        type: (node) => {
          if (node.type === 'Roadm')
            return 'circle'
          if (node.type === 'Amplifier' || node.type === 'Fiber')
            return 'rect'
          // 默认类型或Transceiver、Fused
          return 'circle'
        },
        radius: (node) => {
          if (node.type === 'Roadm')
            return 24
          if (node.type === 'Fused')
            return 12
          return 18 // 默认半径
        },
        width: (node) => {
          if (node.type === 'Amplifier')
            return 32
          if (node.type === 'Fiber')
            return 28
          // 矩形类型需要同时设置width/height
          return 18 * 2 // 圆形节点的直径
        },
        height: (node) => {
          if (node.type === 'Amplifier')
            return 24
          if (node.type === 'Fiber')
            return 18
          // 矩形类型需要同时设置width/height
          return 18 * 2 // 圆形节点的直径
        },
        color: (node) => {
          if (node.type === 'Roadm')
            return isDark ? colors.teal[500] : colors.teal[600]
          if (node.type === 'Amplifier')
            return isDark ? colors.teal[700] : colors.teal[800]
          if (node.type === 'Fiber')
            return isDark ? colors.green[600] : colors.green[700]
          if (node.type === 'Transceiver')
            return isDark ? colors.blue[500] : colors.blue[600]
          if (node.type === 'Fused')
            return isDark ? colors.slate[700] : colors.gray[300]
          return isDark ? colors.teal[600] : colors.teal[700] // 默认
        },
        // 其他属性类似处理
        strokeWidth: (node) => {
          if (node.type === 'Roadm' || node.type === 'Transceiver' || node.type === 'Amplifier')
            return 1
          return 0
        },
        strokeColor: (node) => {
          if (node.type === 'Roadm')
            return isDark ? colors.teal[300] : colors.teal[400]
          if (node.type === 'Transceiver')
            return isDark ? colors.blue[300] : colors.blue[400]
          if (node.type === 'Amplifier')
            return isDark ? colors.teal[500] : colors.teal[600]
          return undefined
        },
      },
      hover: {
        color: (node) => {
          if (node.type === 'Roadm')
            return isDark ? colors.teal[400] : colors.teal[700]
          if (node.type === 'Amplifier')
            return isDark ? colors.teal[600] : colors.teal[900]
          if (node.type === 'Fiber')
            return isDark ? colors.green[500] : colors.green[800]
          if (node.type === 'Transceiver')
            return isDark ? colors.blue[400] : colors.blue[700]
          if (node.type === 'Fused')
            return isDark ? colors.slate[600] : colors.gray[400]
          return isDark ? colors.teal[500] : colors.teal[800] // 默认
        },
        strokeWidth: (node) => {
          if (node.type === 'Roadm')
            return 4 // ROADM hover时边框更粗
          return 3 // 其他节点hover时默认3
        },
        strokeColor: (node) => {
          if (node.type === 'Roadm')
            return isDark ? colors.teal[200] : colors.teal[500]
          if (node.type === 'Transceiver')
            return isDark ? colors.blue[200] : colors.blue[500]
          if (node.type === 'Amplifier')
            return isDark ? colors.teal[400] : colors.teal[700]
          return isDark ? colors.teal[300] : colors.teal[400] // 默认
        },
      },
      selectable: true,
      label: {
        visible: node => node.type !== 'Fused', // Fused节点默认不显示标签
        fontSize: node => node.type === 'Fiber' ? 10 : 12, // Fiber节点字体小一点
        fontFamily: 'DM Sans',
        color: (node) => {
          if (node.type === 'Fiber')
            return isDark ? colors.slate[100] : colors.gray[900]
          return isDark ? colors.slate[200] : colors.gray[800] // 默认
        },
        margin: 8,
        direction: 'west',
      },
      zOrder: {
        enabled: true,
        bringToFrontOnSelected: true,
      },
    },
    edge: {
      normal: {
        width: 2,
        color: isDark ? colors.slate[500] : colors.gray[400],
        dasharray: 0,
        animate: false,
      },
      hover: {
        width: 3,
        color: isDark ? colors.teal[600] : colors.teal[700],
      },
      selected: {
        width: 4,
        color: isDark ? colors.teal[500] : colors.teal[800],
        dasharray: '6 4',
        animate: true,
        animationSpeed: 50,
      },
      selectable: true,
      gap: 6,
      type: 'curve',
      marker: {
        target: {
          type: 'arrow',
          color: isDark ? colors.gray[400] : colors.slate[500],
        },
      },
      zOrder: {
        enabled: true,
        bringToFrontOnSelected: true,
      },
      label: {
        fontFamily: 'DM Sans',
        fontSize: 10,
        color: isDark ? colors.gray[600] : colors.slate[400],
        background: {
          visible: true,
          color: isDark ? colors.slate[900] : colors.white,
          padding: { vertical: 1, horizontal: 3 },
          borderRadius: 3,
        },
      },
    },
    path: {
      visible: true,
      clickable: true,
      hoverable: true,
      selectable: true,
      normal: {
        width: 6,
        color: isDark ? colors.green[500] : colors.green[600],
        dasharray: '10 16',
        linecap: 'round',
        linejoin: 'round',
      },
      hover: {
        width: 8,
        color: isDark ? colors.green[400] : colors.green[500],
      },
      selected: {
        width: 10,
        color: isDark ? colors.green[300] : colors.green[400],
        dasharray: '10 16',
      },
      zOrder: {
        enabled: true,
        bringToFrontOnSelected: true,
      },
    },
  })
}
