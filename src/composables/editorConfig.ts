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
        type: 'circle',
        radius: 18,
        color: isDark ? colors.teal[600] : colors.teal[700],
        strokeWidth: 0,
      },
      hover: {
        color: isDark ? colors.teal[500] : colors.teal[800],
        strokeWidth: 3,
        strokeColor: isDark ? colors.teal[300] : colors.teal[400],
      },
      selectable: true,
      label: {
        visible: true,
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: isDark ? colors.slate[200] : colors.gray[800],
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
