<template>
  <div class="gantt">
    <div class="page-back" @click="$router.push(`/project/${projectId}`)">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回项目详情</span>
    </div>

    <div class="gantt-header">
      <h3 class="gantt-title">{{ project?.name }} - 施工进度计划</h3>
      <div class="gantt-stats" v-if="criticalCount > 0">
        <el-tag type="danger" effect="dark">关键路径：{{ criticalCount }} 个任务</el-tag>
      </div>
      <div class="gantt-legend">
        <span class="legend-item"><span class="dot" style="background:#909399"></span>待开始</span>
        <span class="legend-item"><span class="dot" style="background:#409EFF"></span>进行中</span>
        <span class="legend-item"><span class="dot" style="background:#67C23A"></span>已完成</span>
        <span class="legend-item"><span class="dot" style="background:#F56C6C"></span>已延期</span>
        <span class="legend-item"><span class="dot critical-line"></span>关键路径</span>
      </div>
    </div>

    <el-alert v-if="overdueInfo" type="error" :closable="false" style="margin-bottom: 12px">
      ⚠️ {{ overdueInfo }}
    </el-alert>

    <el-card shadow="hover" class="gantt-card">
      <div ref="ganttRef" style="height: 580px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getProject, getTasksFlat, getCriticalPath, getOverdue } from '../api'

const route = useRoute()
const projectId = computed(() => route.params.id)
const project = ref(null)
const ganttRef = ref(null)
const criticalCount = ref(0)
const overdueInfo = ref('')

const statusColor = {
  pending: '#909399',
  in_progress: '#409EFF',
  completed: '#67C23A',
  delayed: '#F56C6C',
}

onMounted(async () => {
  project.value = await getProject(projectId.value)
  let tasks = await getTasksFlat(projectId.value)
  // 关键路径分析
  try {
    const cp = await getCriticalPath(projectId.value)
    criticalCount.value = cp.critical_count
    // 合并 is_critical 标记到 tasks
    const critMap = {}
    for (const t of cp.tasks) critMap[t.id] = t.is_critical
    tasks = tasks.map(t => ({ ...t, is_critical: critMap[t.id] || false }))
  } catch (e) { criticalCount.value = 0 }
  // 延期检查
  try {
    const od = await getOverdue(projectId.value)
    const parts = []
    if (od.project) parts.push(`项目整体延期 ${od.project.days_overdue} 天`)
    if (od.tasks.length) parts.push(`${od.tasks.length} 个任务已延期`)
    overdueInfo.value = parts.join('；')
  } catch (e) {}

  await nextTick()
  if (!ganttRef.value) return

  const chart = echarts.init(ganttRef.value)

  const allDates = tasks.flatMap(t => [t.start_date, t.end_date].filter(Boolean))
  const minDate = allDates.length ? new Date(Math.min(...allDates.map(d => new Date(d)))) : new Date()
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => new Date(d)))) : new Date()

  const categories = tasks.map(t => `${t.wbs_code} ${t.name}`)
  const data = tasks.map((t, i) => ({
    name: `${t.wbs_code} ${t.name}`,
    value: [i, t.start_date || minDate.toISOString().slice(0, 10), t.end_date || maxDate.toISOString().slice(0, 10)],
    itemStyle: { color: statusColor[t.status] || '#909399' },
    progress: t.progress,
  }))

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#EBEEF5',
      textStyle: { color: '#303133', fontSize: 13 },
      formatter: (params) => {
        const d = params.data
        const p = d.progress ?? 0
        return `<b>${d.name}</b><br/>📅 ${d.value[1]} ~ ${d.value[2]}<br/>📊 进度: ${p}%`
      }
    },
    grid: { left: 220, right: 40, top: 20, bottom: 40 },
    xAxis: {
      type: 'time',
      min: minDate.getTime() - 7 * 86400000,
      max: maxDate.getTime() + 7 * 86400000,
      axisLabel: {
        formatter: '{MM}-{dd}',
        color: '#909399',
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: '#EBEEF5' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      inverse: true,
      axisLabel: {
        width: 200,
        overflow: 'truncate',
        color: '#606266',
        fontSize: 12,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'custom',
      renderItem: (params, api) => {
        const catIndex = api.value(0)
        const start = api.coord([api.value(1), catIndex])
        const end = api.coord([api.value(2), catIndex])
        const height = api.size([0, 1])[1] * 0.55
        const color = api.visual('color')
        const barWidth = Math.max(end[0] - start[0], 4)

        const children = []

        // 进度填充
        if (data[catIndex].progress > 0) {
          children.push({
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(barWidth * (data[catIndex].progress / 100), 2),
              height: height,
            },
            style: { fill: `rgba(103, 194, 58, ${0.3 + data[catIndex].progress / 200})` },
          })
        }

        // 边框
        children.push({
          type: 'rect',
          shape: {
            x: start[0],
            y: start[1] - height / 2,
            width: barWidth,
            height: height,
            r: 4,
          },
          style: {
            fill: color,
            opacity: 0.85,
            // 关键路径：红色边框
            ...(data[catIndex].is_critical ? { stroke: '#F56C6C', lineWidth: 2 } : {}),
          },
          })

          return { type: 'group', children }
          },
      data: data,
      encode: { x: [1, 2], y: 0 },
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    }],
    dataZoom: [{
      type: 'slider',
      bottom: 10,
      height: 20,
      borderColor: '#EBEEF5',
      backgroundColor: '#f5f7fa',
    }],
  })
})
</script>

<style scoped>
.page-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}
.page-back:hover {
  background: #ecf5ff;
  color: var(--primary);
}
.gantt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.gantt-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.gantt-legend {
  display: flex;
  gap: 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}
.dot.critical-line {
  background: transparent;
  border: 2px solid #F56C6C;
}
.gantt-card {
  border-radius: 8px;
}
</style>