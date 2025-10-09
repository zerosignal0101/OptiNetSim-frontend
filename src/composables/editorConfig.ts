import { defineConfigs } from 'v-network-graph'
// src/composables/editorConfig.ts
import { carbonColors } from '../../uno-configs/colors'

export function getGraphConfig(isDark: boolean, nodesLocked: boolean) {
  return defineConfigs({
    view: {
      autoPanAndZoomOnLoad: 'fit-content',
      fitContentMargin: 20,
      doubleClickZoomEnabled: false,
      grid: {
        visible: true,
        interval: 20,
        thickIncrements: 5,
        line: {
          color: isDark ? carbonColors.gray[70] : carbonColors.gray[10],
          width: 0.5,
        },
        thick: {
          color: isDark ? carbonColors.gray[60] : carbonColors.gray[20],
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
          if (node.type === 'Edfa' || node.type === 'Fiber')
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
          if (node.type === 'Edfa')
            return 32
          if (node.type === 'Fiber')
            return 28
          // 矩形类型需要同时设置width/height
          return 18 * 2 // 圆形节点的直径
        },
        height: (node) => {
          if (node.type === 'Edfa')
            return 24
          if (node.type === 'Fiber')
            return 18
          // 矩形类型需要同时设置width/height
          return 18 * 2 // 圆形节点的直径
        },
        color: (node) => {
          if (node.type === 'Roadm')
            return isDark ? carbonColors.teal[50] : carbonColors.teal[60]
          if (node.type === 'Edfa')
            return isDark ? carbonColors.magenta[70] : carbonColors.magenta[80]
          if (node.type === 'Fiber')
            return isDark ? carbonColors.cyan[60] : carbonColors.cyan[70]
          if (node.type === 'Transceiver')
            return isDark ? carbonColors.blue[50] : carbonColors.blue[60]
          if (node.type === 'Fused')
            return isDark ? carbonColors.gray[70] : carbonColors.gray[30]
          return isDark ? carbonColors.teal[60] : carbonColors.teal[70] // 默认
        },
        // 其他属性类似处理
        strokeWidth: (node) => {
          if (node.type === 'Roadm' || node.type === 'Transceiver' || node.type === 'Edfa')
            return 1
          return 0
        },
        strokeColor: (node) => {
          if (node.type === 'Roadm')
            return isDark ? carbonColors.teal[30] : carbonColors.teal[40]
          if (node.type === 'Transceiver')
            return isDark ? carbonColors.blue[30] : carbonColors.blue[40]
          if (node.type === 'Edfa')
            return isDark ? carbonColors.magenta[50] : carbonColors.magenta[60]
          return undefined
        },
      },
      hover: {
        color: (node) => {
          if (node.type === 'Roadm')
            return isDark ? carbonColors.teal[40] : carbonColors.teal[70]
          if (node.type === 'Edfa')
            return isDark ? carbonColors.magenta[60] : carbonColors.magenta[90]
          if (node.type === 'Fiber')
            return isDark ? carbonColors.cyan[50] : carbonColors.cyan[80]
          if (node.type === 'Transceiver')
            return isDark ? carbonColors.blue[40] : carbonColors.blue[70]
          if (node.type === 'Fused')
            return isDark ? carbonColors.gray[60] : carbonColors.gray[40]
          return isDark ? carbonColors.teal[50] : carbonColors.teal[80] // 默认
        },
        strokeWidth: (node) => {
          if (node.type === 'Roadm')
            return 4 // ROADM hover时边框更粗
          return 3 // 其他节点hover时默认3
        },
        strokeColor: (node) => {
          if (node.type === 'Roadm')
            return isDark ? carbonColors.teal[20] : carbonColors.teal[50]
          if (node.type === 'Transceiver')
            return isDark ? carbonColors.blue[20] : carbonColors.blue[50]
          if (node.type === 'Edfa')
            return isDark ? carbonColors.magenta[40] : carbonColors.magenta[70]
          return isDark ? carbonColors.teal[30] : carbonColors.teal[40] // 默认
        },
      },
      selectable: true,
      draggable: !nodesLocked,
      label: {
        visible: node => node.type === 'Transceiver' || node.type === 'Roadm',
        fontSize: node => node.type === 'Fiber' ? 10 : 12, // Fiber节点字体小一点
        fontFamily: 'DM Sans',
        color: (node) => {
          if (node.type === 'Fiber')
            return isDark ? carbonColors.gray[10] : carbonColors.gray[90]
          return isDark ? carbonColors.gray[20] : carbonColors.gray[80] // 默认
        },
        margin: 8,
        direction: 'west',
        background: {
          visible: true,
          color: isDark ? carbonColors.gray[70] : carbonColors.gray[10],
          padding: 1,
          borderRadius: 1,
        },
      },
      zOrder: {
        enabled: true,
        zIndex: node => node.type === 'Roadm' ? 2 : 1,
        bringToFrontOnSelected: true,
      },
    },
    edge: {
      normal: {
        width: 2,
        color: isDark ? carbonColors.gray[50] : carbonColors.gray[40],
        dasharray: 0,
      },
      hover: {
        width: 3,
        color: isDark ? carbonColors.teal[60] : carbonColors.teal[70],
      },
      selected: {
        width: 4,
        color: isDark ? carbonColors.teal[50] : carbonColors.teal[80],
        dasharray: '6 4',
      },
      selectable: true,
      gap: 6,
      type: 'straight',
      marker: {
        target: {
          type: 'arrow',
          color: isDark ? carbonColors.gray[40] : carbonColors.gray[50],
        },
      },
      zOrder: {
        enabled: true,
        bringToFrontOnSelected: true,
      },
      label: {
        fontSize: 10,
        color: isDark ? carbonColors.gray[60] : carbonColors.gray[40],
        background: {
          visible: true,
          color: isDark ? carbonColors.gray[90] : carbonColors.white,
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
        // color: isDark ? carbonColors.green[50] : carbonColors.green[60],
        dasharray: '10 16',
      },
      hover: {
        width: 8,
        // color: isDark ? carbonColors.green[40] : carbonColors.green[50],
      },
      selected: {
        width: 10,
        // color: isDark ? carbonColors.green[30] : carbonColors.green[40],
        dasharray: '10 16',
      },
      zOrder: {
        enabled: true,
        bringToFrontOnSelected: true,
      },
    },
  })
}
