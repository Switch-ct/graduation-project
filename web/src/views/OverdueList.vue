<template>
  <div class="overdue-page">
    <div class="page-header">
      <h2>⚠️ 延期管理</h2>
      <p class="page-desc">所有超过计划完成日期、尚未完成的项目和任务</p>
    </div>

    <!-- 顶部汇总卡 -->
    <div class="summary-cards">
      <div class="sum-card sum-danger">
        <div class="sum-v">{{ data.summary?.project_count || 0 }}</div>
        <div class="sum-l">延期项目</div>
      </div>
      <div class="sum-card sum-warn">
        <div class="sum-v">{{ data.summary?.task_count || 0 }}</div>
        <div class="sum-l">延期任务</div>
      </div>
      <div class="sum-card sum-info">
        <div class="sum-v">{{ data.summary?.total_impact_days || 0 }}</div>
        <div class="sum-l">累计延期(天)</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="overdue-tabs">
      <!-- 延期项目 Tab -->
      <el-tab-pane :label="`延期项目 (${data.overdue_projects?.length || 0})`" name="projects">
        <div v-if="data.overdue_projects?.length === 0" class="empty-state">
          <el-empty description="没有延期的项目 ✓" />
        </div>
        <el-table v-else :data="data.overdue_projects" stripe @row-click="goProject" style="cursor: pointer">
          <el-table-column type="index" width="60" label="#" />
          <el-table-column prop="name" label="项目名称" min-width="200">
            <template #default="{ row }">
              <span style="color:#ee0a24; font-weight:600">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="manager" label="负责人" width="120" />
          <el-table-column label="原计划完工" width="130">
            <template #default="{ row }">{{ row.end_date }}</template>
          </el-table-column>
          <el-table-column label="延期天数" width="120" sortable :sort-by="(r) => r.days_overdue">
            <template #default="{ row }">
              <el-tag type="danger" effect="dark">{{ row.days_overdue }} 天</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" effect="plain">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text @click.stop="goProject(row)">查看 →</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 延期任务 Tab -->
      <el-tab-pane :label="`延期任务 (${data.overdue_tasks?.length || 0})`" name="tasks">
        <div v-if="data.overdue_tasks?.length === 0" class="empty-state">
          <el-empty description="没有延期的任务 ✓" />
        </div>
        <el-table v-else :data="data.overdue_tasks" stripe @row-click="goTask" style="cursor: pointer">
          <el-table-column type="index" width="60" label="#" />
          <el-table-column prop="wbs_code" label="WBS" width="100" />
          <el-table-column prop="name" label="任务名称" min-width="180">
            <template #default="{ row }">
              <span style="color:#ee0a24; font-weight:500">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="project_name" label="所属项目" min-width="160">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click.stop="goProject(row)">{{ row.project_name }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" width="120">
            <template #default="{ row }">
              <span>{{ row.assignee || '未分配' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="原计划完工" width="130">
            <template #default="{ row }">{{ row.end_date }}</template>
          </el-table-column>
          <el-table-column label="延期" width="100" sortable :sort-by="(r) => r.days_overdue">
            <template #default="{ row }">
              <el-tag type="danger" effect="dark">{{ row.days_overdue }} 天</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text @click.stop="goTask(row)">改进度 →</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllOverdue } from '../api'

const router = useRouter()
const data = ref({ overdue_projects: [], overdue_tasks: [], summary: {} })
const activeTab = ref('projects')

onMounted(async () => {
  data.value = await getAllOverdue()
})

function goProject(row) {
  router.push(`/project/${row.id}`)
}
function goTask(row) {
  router.push(`/project/${row.project_id}`)
}
function statusLabel(s) { return { planning: '计划中', in_progress: '进行中', completed: '已完成', suspended: '已暂停' }[s] || s }
function statusType(s) { return { planning: 'info', in_progress: 'success', completed: '', suspended: 'warning' }[s] || '' }
</script>

<style scoped>
.overdue-page { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { color: #ee0a24; margin-bottom: 4px; }
.page-desc { color: #666; font-size: 13px; }

.summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.sum-card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}
.sum-v { font-size: 32px; font-weight: 700; line-height: 1.1; }
.sum-l { font-size: 13px; color: #999; margin-top: 6px; }
.sum-danger { border-color: #ffd6d6; }
.sum-danger .sum-v { color: #ee0a24; }
.sum-warn { border-color: #ffe4b5; }
.sum-warn .sum-v { color: #d97706; }
.sum-info { border-color: #d6e4ff; }
.sum-info .sum-v { color: #1e6fd0; }

.overdue-tabs { background: #fff; }
.empty-state { padding: 40px 0; }
</style>
