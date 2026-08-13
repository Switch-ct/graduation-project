<template>
  <div class="dashboard">
    <div class="welcome">
      <h2>欢迎回来，{{ user?.real_name || user?.username }}</h2>
      <p>这是你的施工进度管理总览</p>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="stat-grid">
      <el-card shadow="hover" class="stat-card stat-total">
        <div class="stat-value">{{ projectStatus.planning + projectStatus.in_progress + projectStatus.completed + projectStatus.suspended || 0 }}</div>
        <div class="stat-label">项目总数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-progress">
        <div class="stat-value">{{ projectStatus.in_progress || 0 }}</div>
        <div class="stat-label">进行中</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-done">
        <div class="stat-value">{{ projectStatus.completed || 0 }}</div>
        <div class="stat-label">已完成</div>
      </el-card>
      <el-card shadow="hover" class="stat-card stat-warning" :class="{ 'stat-alert': overdueCount > 0 }">
        <div class="stat-value">{{ overdueCount }}</div>
        <div class="stat-label">延期预警</div>
      </el-card>
    </div>

    <!-- 延期预警 -->
    <el-alert v-if="overdue.overdue_projects?.length || overdue.overdue_tasks?.length"
      type="error" :closable="false" style="margin-bottom: 16px">
      <template #title>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="font-weight:600">⚠️ 系统检测到 {{ overdueCount }} 个延期项</span>
          <el-button type="danger" size="small" @click="$router.push('/overdue')">
            查看全部延期列表 →
          </el-button>
        </div>
      </template>
      <div v-if="overdue.overdue_projects?.length">
        <strong>延期项目：</strong>
        <el-tag v-for="p in overdue.overdue_projects" :key="p.id" type="danger" effect="plain" style="margin: 2px 4px">
          {{ p.name }} ({{ p.days_overdue }}天)
        </el-tag>
      </div>
      <div v-if="overdue.overdue_tasks?.length" style="margin-top: 8px">
        <strong>延期任务（前 {{ overdue.overdue_tasks.length }} 个）：</strong>
        <el-tag v-for="t in overdue.overdue_tasks.slice(0, 5)" :key="t.id" type="danger" effect="plain" size="small" style="margin: 2px 4px">
          [{{ t.project_name }}] {{ t.wbs_code }} {{ t.name }} ({{ t.days_overdue }}天)
        </el-tag>
      </div>
    </el-alert>

    <div class="content-grid">
      <!-- 工作量统计 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <span>👷 项目经理工作量（任务数）</span>
        </template>
        <div ref="workloadRef" style="height: 320px"></div>
      </el-card>

      <!-- 项目状态分布 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <span>📊 项目状态分布</span>
        </template>
        <div ref="pieRef" style="height: 320px"></div>
      </el-card>
    </div>

    <div class="content-grid">
      <!-- 项目预算排行 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <span>💰 项目预算排行（万元）</span>
        </template>
        <div ref="budgetRef" style="height: 320px"></div>
      </el-card>

      <!-- 即将到期任务 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <span>⏰ 即将到期（未来7天）</span>
        </template>
        <el-table :data="dashStats.upcoming_tasks || []" stripe max-height="320">
          <el-table-column prop="wbs_code" label="WBS" width="80" />
          <el-table-column prop="name" label="任务名" />
          <el-table-column prop="project_name" label="所属项目" />
          <el-table-column prop="end_date" label="截止日" width="120" />
        </el-table>
        <el-empty v-if="!dashStats.upcoming_tasks?.length" description="未来7天无即将到期任务" :image-size="80" />
      </el-card>
    </div>

    <!-- 最近变更日志 -->
    <el-card shadow="hover" class="logs-card">
      <template #header>
        <span>📝 最近变更记录</span>
      </template>
      <el-timeline>
        <el-timeline-item v-for="l in changeLogs.slice(0, 10)" :key="l.id" :timestamp="formatTime(l.created_at)" placement="top">
          <strong>{{ l.operator_name }}</strong>
          <el-tag size="small" :type="actionType(l.action)" style="margin: 0 6px">{{ actionLabel(l.action) }}</el-tag>
          <span style="color:#666">{{ entityLabel(l.entity_type) }} #{{ l.entity_id }}</span>
          <span v-if="l.field_name" style="color:#666"> · {{ l.field_name }}</span>
          <span v-if="l.new_value" style="color:#67c23a"> → {{ l.new_value }}</span>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="changeLogs.length === 0" description="还没有变更记录" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getAllOverdue, getWorkload, getDashboardStats, getRecentChangeLogs } from '../api'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const workload = ref([])
const overdue = ref({ overdue_projects: [], overdue_tasks: [] })
const dashStats = ref({})
const changeLogs = ref([])

const workloadRef = ref(null)
const pieRef = ref(null)
const budgetRef = ref(null)

const projectStatus = computed(() => {
  const result = {}
  for (const p of dashStats.value.project_status || []) {
    result[p.status] = parseInt(p.cnt)
  }
  return result
})

const overdueCount = computed(() =>
  (overdue.value.overdue_projects?.length || 0) + (overdue.value.overdue_tasks?.length || 0)
)

onMounted(async () => {
  // 并行拉取所有数据
  const [wl, od, ds, logs] = await Promise.all([
    getWorkload().catch(() => []),
    getAllOverdue().catch(() => ({ overdue_projects: [], overdue_tasks: [] })),
    getDashboardStats().catch(() => ({})),
    getRecentChangeLogs(20).catch(() => []),
  ])
  workload.value = wl
  overdue.value = od
  dashStats.value = ds
  changeLogs.value = logs

  await nextTick()
  renderCharts()
})

function renderCharts() {
  // 工作量柱状图
  if (workloadRef.value) {
    const chart = echarts.init(workloadRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'value', name: '任务数' },
      yAxis: {
        type: 'category',
        data: workload.value.map(w => w.name).reverse(),
        axisLabel: { fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: workload.value.map(w => ({
          value: parseInt(w.total_tasks),
          in_progress: parseInt(w.in_progress),
          completed: parseInt(w.completed),
          delayed: parseInt(w.delayed),
        })).reverse(),
        itemStyle: { color: '#409EFF', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right' },
      }],
    })
  }
  // 项目状态饼图
  if (pieRef.value) {
    const chart = echarts.init(pieRef.value)
    const data = (dashStats.value.project_status || []).map(p => ({
      name: statusLabel(p.status), value: parseInt(p.cnt),
    }))
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '70%'], data,
        label: { formatter: '{b}\n{c} ({d}%)' },
      }],
    })
  }
  // 项目预算排行
  if (budgetRef.value) {
    const chart = echarts.init(budgetRef.value)
    const data = dashStats.value.projects_by_budget || []
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 120, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: '万元' },
      yAxis: { type: 'category', data: data.map(p => p.name).reverse(), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar', data: data.map(p => p.total_budget).reverse(),
        itemStyle: { color: '#67C23A', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', formatter: '{c} 万' },
      }],
    })
  }
}

function statusLabel(s) {
  return { planning: '计划中', in_progress: '进行中', completed: '已完成', suspended: '已暂停' }[s] || s
}
function actionType(a) { return { create: 'success', update: 'primary', delete: 'danger' }[a] || '' }
function actionLabel(a) { return { create: '创建', update: '更新', delete: '删除' }[a] || a }
function entityLabel(t) { return { project: '项目', task: '任务', user: '用户' }[t] || t }
function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.dashboard { padding: 0 4px; }
.welcome { margin-bottom: 16px; }
.welcome h2 { margin: 0; color: var(--text-primary, #303133); }
.welcome p { margin: 4px 0 0; color: #909399; }
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card { border-radius: 8px; transition: all 0.3s; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.stat-value { font-size: 32px; font-weight: 700; color: #303133; line-height: 1; }
.stat-label { color: #909399; font-size: 13px; margin-top: 8px; }
.stat-total .stat-value { color: #409EFF; }
.stat-progress .stat-value { color: #67C23A; }
.stat-done .stat-value { color: #909399; }
.stat-warning .stat-value { color: #E6A23C; }
.stat-alert { animation: pulse 2s infinite; border: 1px solid #F56C6C; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,108,108,0.4); } 50% { box-shadow: 0 0 0 8px rgba(245,108,108,0); } }

.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-card { border-radius: 8px; }
.logs-card { border-radius: 8px; margin-top: 8px; }

@media (max-width: 768px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .content-grid { grid-template-columns: 1fr; }
}
</style>
