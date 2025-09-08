<script setup lang="ts">
import OsnrChart from '~/components/OsnrChart.vue'

// 模拟 OSNR 随时间变化的数据
const osnrTimeSeriesData = ref({
  timestamps: [] as string[],
  seriesNames: ['链路1 OSNR', '链路2 OSNR'],
  series: [
    { name: '链路1 OSNR', data: [] as number[] },
    { name: '链路2 OSNR', data: [] as number[] },
  ],
})

// 模拟多个链路当前 OSNR 对比数据
const osnrComparisonData = ref({
  categories: ['链路A', '链路B', '链路C', '链路D', '链路E'],
  seriesNames: ['当前 OSNR'],
  series: [
    { name: '当前 OSNR', data: [] as number[] },
  ],
})

// 模拟单个链路的实时 OSNR 数据
const liveOsnrData = ref({
  series: [
    { name: 'OSNR', data: [25] as number[] },
  ],
})

// --- 数据生成函数 ---
function generateTimeSeriesData() {
  const newTimestamps: string[] = []
  const link1Data: number[] = []
  const link2Data: number[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) { // 最近一小时，每5分钟一个点
    const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000)
    newTimestamps.push(time.toTimeString().substring(0, 5))
    link1Data.push(Number.parseFloat((20 + Math.random() * 8).toFixed(2))) // 20-28dB
    link2Data.push(Number.parseFloat((17 + Math.random() * 8).toFixed(2))) // 17-25dB
  }
  osnrTimeSeriesData.value.timestamps = newTimestamps
  osnrTimeSeriesData.value.series[0].data = link1Data
  osnrTimeSeriesData.value.series[1].data = link2Data
}

function generateComparisonData() {
  const newComparisonData: number[] = []
  osnrComparisonData.value.categories.forEach(() => {
    newComparisonData.push(Number.parseFloat((15 + Math.random() * 12).toFixed(2))) // 15-27dB
  })
  osnrComparisonData.value.series[0].data = newComparisonData
}

function generateLiveOsnr() {
  return Number.parseFloat((15 + Math.random() * 13).toFixed(2)) // 15-28dB
}

// --- 模拟数据更新 ---
function simulateDataUpdate() {
  generateTimeSeriesData()
  generateComparisonData()
  liveOsnrData.value.series[0].data[0] = generateLiveOsnr()
}

function updateLiveOsnr() {
  liveOsnrData.value.series[0].data[0] = generateLiveOsnr()
}

let intervalId: NodeJS.Timer | null = null

onMounted(() => {
  simulateDataUpdate() // 页面加载时先生成一次数据
  // 每隔 5 秒钟模拟数据更新
  intervalId = setInterval(simulateDataUpdate, 5000) // 可以取消注释以自动刷新
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div class="p-6 font-sans">
    <!-- 应用全局 Carbon 字体和颜色 -->
    <h1 class="m-b-4 heading06 text-blue-70 dark:text-blue-50">
      光网络数据可视化仪表盘
    </h1>

    <div class="cds--grid">
      <!-- OSNR 随时间变化的趋势图 (折线图) -->
      <section class="cds-card">
        <h2 class="m-b-4 heading03 text-coolGray-90 dark:text-coolGray-20">
          链路 OSNR 趋势 (时序数据)
        </h2>
        <OsnrChart
          :chart-data="osnrTimeSeriesData"
          chart-type="line"
          title="链路 OSNR 趋势图 (最近一小时)"
        />
      </section>

      <!-- 多个链路的当前 OSNR 对比 (柱状图) -->
      <section class="cds-card">
        <h2 class="m-b-4 heading03 text-coolGray-90 dark:text-coolGray-20">
          各链路当前 OSNR 对比
        </h2>
        <OsnrChart
          :chart-data="osnrComparisonData"
          chart-type="bar"
          title="当前链路 OSNR 对比"
        />
      </section>

      <!-- 单个链路的实时 OSNR (仪表盘) -->
      <section class="cds-card">
        <h2 class="m-b-4 heading03 text-coolGray-90 dark:text-coolGray-20">
          链路 1 实时 OSNR
        </h2>
        <OsnrChart
          :chart-data="liveOsnrData"
          chart-type="gauge"
          title="链路1 实时 OSNR"
        />
        <button class="cds-btn-primary m-t-4" @click="updateLiveOsnr">
          模拟更新实时OSNR
        </button>
      </section>
    </div>

    <hr class="m-y-8 b-coolGray-200">
    <div class="text-center">
      <button class="cds-btn-primary" @click="simulateDataUpdate">
        模拟所有数据刷新
      </button>
    </div>

    <!-- 演示 cds--grid 快捷方式 -->
    <h2 class="m-y-6 heading03 text-coolGray-90 dark:text-coolGray-20">
      演示 CDS 网格系统
    </h2>
    <div class="cds--grid">
      <div class="cds-grid-item col-span-2 bg-coolGray-90 p-4 text-white lg:col-span-6 md:col-span-4 sm:col-span-2 xlg:col-span-8">
        <p class="body02">
          Grid Item 1
        </p>
        <p class="caption01 text-coolGray-10">
          col-span-2/2/4/6/8
        </p>
      </div>
      <div class="cds-grid-item col-span-2 bg-coolGray-10 p-4 text-coolGray-90 lg:col-span-10 md:col-span-4 sm:col-span-2 xlg:col-span-8 dark:text-coolGray-20">
        <p class="body02">
          Grid Item 2
        </p>
        <p class="caption01 text-coolGray-70">
          col-span-2/2/4/10/8
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cds-card {
  @apply col-span-8 p-2;
}
</style>

<route lang="yaml">
meta:
  layout: editor
</route>
