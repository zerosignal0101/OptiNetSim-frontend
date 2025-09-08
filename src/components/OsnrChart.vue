<!-- src/components/OsnrChart.vue -->
<script setup lang="ts">
import type { EChartsOption } from 'echarts' // 引入 EChartsOption 类型
import * as echarts from 'echarts'

// 从你的 UnoCSS/Carbon 配置中引入常量
import { CARBON_FONT_FAMILIES, CARBON_FONT_WEIGHTS, CARBON_SCALE_PX, pxToRem } from '../../uno-configs/_base'
import { carbonColors } from '../../uno-configs/colors'

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  chartType: {
    type: String,
    default: 'line' as 'line' | 'bar' | 'gauge',
  },
  title: {
    type: String,
    default: '光网络链路状态分析',
  },
})

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

// 使用 vueuse 跟踪暗色模式状态
const isDark = useDark()

// 定义 Echarts 默认颜色序列，使用 Carbon 颜色。这些颜色在明暗模式下通常保持不变。
const carbonColorPalette = [
  carbonColors.blue[60],
  carbonColors.teal[50],
  carbonColors.purple[50],
  carbonColors.green[50],
  carbonColors.orange[50],
  carbonColors.red[50],
  carbonColors.cyan[50],
  carbonColors.magenta[50],
]

/**
 * 根据当前主题（明/暗）返回一组颜色配置
 */
function getThemeColors() {
  if (isDark.value) {
    return {
      // 背景
      background: carbonColors.gray[100], // #161616
      // 文本
      textPrimary: carbonColors.gray[10], // #f4f4f4
      textSecondary: carbonColors.gray[30], // #c6c6c6
      textMuted: carbonColors.gray[50], // #8d8d8d
      // 坐标轴、边框、分割线
      axisLine: carbonColors.gray[70], // #525252
      splitLine: carbonColors.gray[80], // #393939
      // Tooltip
      tooltipBorder: carbonColors.gray[70],
      tooltipBackground: carbonColors.gray[90], // #262626
      // 仪表盘指针和进度
      gaugePointer: carbonColors.blue[40], // 在暗色背景下使用更亮的蓝色
      gaugeProgress: carbonColors.blue[40],
      // 图例
      legendText: carbonColors.gray[30],
    }
  }
  else {
    return {
      // 背景
      background: carbonColors.white, // #ffffff
      // 文本
      textPrimary: carbonColors.gray[100], // #121619
      textSecondary: carbonColors.gray[90], // #262626
      textMuted: carbonColors.gray[70], // #525252
      // 坐标轴、边框、分割线
      axisLine: carbonColors.coolGray[20], // #dde1e6
      splitLine: carbonColors.coolGray[10], // #f2f4f8
      // Tooltip
      tooltipBorder: carbonColors.coolGray[30],
      tooltipBackground: carbonColors.white,
      // 仪表盘指针和进度
      gaugePointer: carbonColors.blue[60],
      gaugeProgress: carbonColors.blue[60],
      // 图例
      legendText: carbonColors.gray[70],
    }
  }
}

// Echarts 通用文本样式，使用 Carbon 字体
// 颜色将不再在此处硬编码，而是在使用时动态分配
const carbonTextStyleBase = {
  fontFamily: CARBON_FONT_FAMILIES.sans,
  fontWeight: CARBON_FONT_WEIGHTS.regular,
  fontSize: CARBON_SCALE_PX[1],
}

// 初始化 Echarts 实例
function initChart() {
  if (chartContainer.value && !myChart) {
    myChart = echarts.init(chartContainer.value)
    window.addEventListener('resize', resizeChart)
  }
}

// 渲染 Echarts
function renderChart() {
  if (!myChart) {
    initChart()
  }
  if (myChart) {
    // 使用 computed 确保每次渲染都使用最新的数据和主题
    const options = getChartOptions(props.chartData, props.chartType, props.title)
    myChart.setOption(options)
  }
}

// 窗口大小变化时调整图表
function resizeChart() {
  myChart && myChart.resize()
}

// 根据数据和类型生成 Echarts 配置项
function getChartOptions(data: any, type: string, titleText: string): EChartsOption {
  const themeColors = getThemeColors()

  let options: EChartsOption = {
    backgroundColor: themeColors.background, // 设置整个图表的背景色
    color: carbonColorPalette,
    title: {
      text: titleText,
      left: 'center',
      textStyle: {
        ...carbonTextStyleBase,
        fontWeight: CARBON_FONT_WEIGHTS.semibold,
        fontSize: CARBON_SCALE_PX[4],
        color: themeColors.textPrimary, // 标题使用主要文本色
      },
    },
    tooltip: {
      trigger: 'axis',
      textStyle: {
        ...carbonTextStyleBase,
        color: themeColors.textPrimary, // Tooltip 文本颜色
      },
      borderColor: themeColors.tooltipBorder,
      borderWidth: 1,
      backgroundColor: themeColors.tooltipBackground,
      formatter: (params: any) => {
        let html = `<div style="padding: 8px 12px; font-size:${pxToRem(CARBON_SCALE_PX[1])}; color:${themeColors.textPrimary}; font-family:${CARBON_FONT_FAMILIES.sans};">`
        if (type === 'gauge') {
          html += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${carbonColorPalette[0]};"></span>
                   ${params[0].name} : <strong>${params[0].value} dB</strong></div>`
        }
        else {
          html += `<strong>${params[0].name}</strong><br/>`
          params.forEach((item: any) => {
            html += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>
                      ${item.seriesName}: <strong>${item.value} dB</strong><br/>`
          })
          html += `</div>`
        }
        return html
      },
    },
    legend: {
      data: data.seriesNames || [],
      top: 'bottom',
      textStyle: {
        ...carbonTextStyleBase,
        color: themeColors.legendText, // 图例文本颜色
      },
    },
    grid: {
      left: '3%',
      right: '15%',
      bottom: '12%',
      containLabel: true,
    },
    animationDuration: 240,
    animationEasing: 'cubicOut',
    animationDelay(idx: number) {
      return idx * 10
    },
  }

  if (type === 'line') {
    options = {
      ...options,
      xAxis: {
        type: 'category',
        data: data.timestamps,
        name: '时间',
        axisLabel: {
          ...carbonTextStyleBase,
          rotate: 30,
          color: themeColors.textSecondary, // 坐标轴标签使用次要文本色
        },
        axisLine: { lineStyle: { color: themeColors.axisLine } },
        axisTick: { lineStyle: { color: themeColors.axisLine } },
      },
      yAxis: {
        type: 'value',
        name: 'OSNR (dB)',
        min: 10,
        max: 30,
        axisLabel: {
          formatter: '{value} dB',
          ...carbonTextStyleBase,
          color: themeColors.textSecondary,
        },
        axisLine: { lineStyle: { color: themeColors.axisLine } },
        splitLine: { lineStyle: { color: themeColors.splitLine } }, // 网格线
      },
      series: data.series.map((s: any, idx: number) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: {
          color: carbonColorPalette[idx % carbonColorPalette.length],
          borderColor: themeColors.background, // 点的边框使用背景色，制造“镂空”效果
          borderWidth: 1,
        },
        markLine: {
          symbol: ['none', 'none'],
          label: {
            ...carbonTextStyleBase,
            fontSize: CARBON_SCALE_PX[0],
            color: themeColors.textMuted, // 标记线标签使用更柔和的颜色
            formatter: '{b}: {c}dB',
          },
          data: [
            {
              yAxis: 18,
              name: 'OSNR 告警',
              lineStyle: {
                color: carbonColors.red[50],
                type: 'dashed',
              },
            },
            {
              yAxis: 22,
              name: 'OSNR 良好',
              lineStyle: {
                color: carbonColors.green[50],
                type: 'dashed',
              },
            },
          ],
        },
      })),
    }
  }
  else if (type === 'bar') {
    options = {
      ...options,
      xAxis: {
        type: 'category',
        data: data.categories,
        name: '链路名称',
        axisLabel: {
          ...carbonTextStyleBase,
          rotate: 30,
          color: themeColors.textSecondary,
        },
        axisLine: { lineStyle: { color: themeColors.axisLine } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'OSNR (dB)',
        min: 10,
        max: 30,
        axisLabel: {
          formatter: '{value} dB',
          ...carbonTextStyleBase,
          color: themeColors.textSecondary,
        },
        axisLine: { lineStyle: { color: themeColors.axisLine } },
        splitLine: { lineStyle: { color: themeColors.splitLine } },
      },
      series: data.series.map((s: any) => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (param: any) => {
            // 状态颜色在明暗模式下保持不变，因为它们对比度足够
            if (param.value < 18)
              return carbonColors.red[50]
            if (param.value < 22)
              return carbonColors.yellow[50]
            return carbonColors.green[50]
          },
        },
        label: {
          show: true,
          position: 'top',
          ...carbonTextStyleBase,
          color: themeColors.textPrimary, // 柱状图顶部标签使用主要文本色
          formatter: '{c} dB',
        },
      })),
    }
  }
  else if (type === 'gauge') {
    const currentValue = data.series && data.series[0] && data.series[0].data && data.series[0].data[0] !== undefined
      ? data.series[0].data[0]
      : 0

    options = {
      ...options,
      tooltip: {
        formatter: (params: any) => {
          return `<div style="padding: 8px 12px; font-size:${pxToRem(CARBON_SCALE_PX[1])}; color:${themeColors.textPrimary}; font-family:${CARBON_FONT_FAMILIES.sans};">
                    <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>
                    ${params.name} : <strong>${params.value} dB</strong>
                  </div>`
        },
      },
      series: [
        {
          name: 'OSNR',
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '75%',
          startAngle: 200,
          endAngle: -20,
          data: [{ value: currentValue, name: '当前 OSNR' }],
          min: 0,
          max: 30,
          axisLine: {
            lineStyle: {
              width: 15,
              color: [
                [0.6, carbonColors.red[50]],
                [0.733, carbonColors.yellow[50]],
                [1, carbonColors.green[50]],
              ],
            },
          },
          splitLine: {
            length: 12,
            lineStyle: {
              width: 2,
              color: themeColors.axisLine, // 分隔线颜色
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: themeColors.axisLine, // 刻度线颜色
            },
          },
          axisLabel: {
            distance: 25,
            formatter: '{value}',
            ...carbonTextStyleBase,
            color: themeColors.textSecondary, // 刻度标签颜色
            fontSize: CARBON_SCALE_PX[0],
          },
          pointer: {
            width: 8,
            itemStyle: {
              color: themeColors.gaugePointer, // 指针颜色
            },
          },
          detail: {
            formatter: '{value} dB',
            fontSize: CARBON_SCALE_PX[5],
            fontWeight: CARBON_FONT_WEIGHTS.semibold,
            color: themeColors.textPrimary, // 仪表盘详情文本
            offsetCenter: [0, '80%'],
          },
          title: {
            ...carbonTextStyleBase,
            fontSize: CARBON_SCALE_PX[2],
            color: themeColors.textMuted, // 仪表盘标题
            offsetCenter: [0, '50%'],
          },
          progress: {
            show: true,
            width: 15,
            itemStyle: {
              color: themeColors.gaugeProgress, // 进度条颜色
            },
          },
        },
      ],
    }
    delete options.grid
    delete options.legend
  }

  return options
}

// --- 生命周期和监听器 ---
onMounted(() => {
  initChart()
  renderChart()
})

// 监听数据变化
watch(() => props.chartData, () => {
  renderChart()
}, { deep: true })

// 监听图表类型变化
watch(() => props.chartType, () => {
  renderChart()
})

// 监听标题变化
watch(() => props.title, () => {
  renderChart()
})

// 关键：监听暗色模式状态的变化
watch(isDark, () => {
  renderChart()
})

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
    window.removeEventListener('resize', resizeChart)
  }
})
</script>

<template>
  <div ref="chartContainer" class="echarts-container" />
</template>

<style scoped>
.echarts-container {
  @apply aspect-16-9;
  min-height: 200px;
}
</style>
