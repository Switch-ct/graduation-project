<template>
  <div class="project-detail">
    <div class="page-back" @click="$router.push('/projects')">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回项目列表</span>
    </div>

    <el-card shadow="hover" class="info-card" v-if="project">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="项目名称" :span="2">
          <span class="fw-600">{{ project.name }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(project.status)" effect="plain">{{ statusLabel(project.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="项目地点">{{ project.location }}</el-descriptions-item>
        <el-descriptions-item label="项目经理">{{ project.manager }}</el-descriptions-item>
        <el-descriptions-item label="总预算">{{ project.total_budget?.toLocaleString() }} 万元</el-descriptions-item>
        <el-descriptions-item label="开工日期">{{ project.start_date }}</el-descriptions-item>
        <el-descriptions-item label="竣工日期">{{ project.end_date }}</el-descriptions-item>
        <el-descriptions-item label="工期" v-if="project.start_date && project.end_date">
          {{ Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / 86400000) }} 天
        </el-descriptions-item>
        <el-descriptions-item label="项目描述" :span="3">{{ project.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="showTaskDialog = true">
        <el-icon><Plus /></el-icon> 添加任务
      </el-button>
      <el-button @click="$router.push(`/gantt/${projectId}`)">
        <el-icon><TrendCharts /></el-icon> 甘特图视图
      </el-button>
    </div>

    <!-- 任务统计 -->
    <el-row :gutter="16" v-if="stats">
      <el-col :span="6" v-for="(s, i) in taskStats" :key="s.label">
        <transition appear name="fade-up" @before-enter="el => el.style.animationDelay = `${i * 0.06}s`">
          <el-card shadow="hover" :body-style="{ padding: '20px', textAlign: 'center' }">
            <div class="task-stat-value">{{ s.value }}</div>
            <div class="task-stat-label">{{ s.label }}</div>
          </el-card>
        </transition>
      </el-col>
    </el-row>

    <!-- WBS 任务树 -->
    <el-card shadow="hover" class="wbs-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">WBS 任务分解</span>
          <span class="task-count">{{ taskCount }} 个任务</span>
        </div>
      </template>
      <el-table :data="taskList" row-key="id" stripe :tree-props="{ children: 'children' }" default-expand-all>
        <el-table-column prop="wbs_code" label="WBS编码" width="100" />
        <el-table-column prop="name" label="任务名称" min-width="220" />
        <el-table-column prop="assignee" label="负责人" width="90" />
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="duration" label="工期(天)" width="90" />
        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress"
                :status="row.progress === 100 ? 'success' : ''"
                :stroke-width="8"
              />
              <span class="progress-text">{{ row.progress }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="taskStatusType(row.status)" effect="plain" size="small">
              {{ taskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="info" @click="openTaskDetail(row)">详情</el-button>
            <el-button size="small" text type="primary" @click="editTask(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleTaskDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 任务对话框 -->
    <el-dialog
      v-model="showTaskDialog"
      :title="editingTaskId ? '编辑任务' : '添加任务'"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="taskForm" ref="taskFormRef" label-width="100px" label-position="right">
        <el-form-item label="父任务">
          <el-select v-model="taskForm.parent_id" placeholder="无（顶层任务）" clearable style="width:100%">
            <el-option v-for="t in flatTasks" :key="t.id" :label="`${t.wbs_code} ${t.name}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="WBS编码" required>
              <el-input v-model="taskForm.wbs_code" placeholder="如 1.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="taskForm.assignee" placeholder="负责人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务名称" required>
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="taskForm.start_date" type="date" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="taskForm.end_date" type="date" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工期(天)">
              <el-input-number v-model="taskForm.duration" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="taskForm.status" style="width:100%">
                <el-option label="待开始" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已延期" value="delayed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="进度(%)">
          <el-slider v-model="taskForm.progress" :max="100" show-input />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="handleTaskSave" :loading="taskSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情（评论/附件/变更日志） -->
    <TaskDetailDialog v-model="showTaskDetailDialog" :task="taskDetailTarget" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, TrendCharts, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProject, getTasks, getTasksFlat, createTask, updateTask, deleteTask, getTaskStats, getCriticalPath } from '../api'
import TaskDetailDialog from './TaskDetailDialog.vue'

const showTaskDetailDialog = ref(false)
const taskDetailTarget = ref(null)
function openTaskDetail(row) {
  taskDetailTarget.value = row
  showTaskDetailDialog.value = true
}

const route = useRoute()
const projectId = computed(() => route.params.id)

const project = ref(null)
const taskList = ref([])
const flatTasks = ref([])
const stats = ref(null)
const showTaskDialog = ref(false)
const editingTaskId = ref(null)
const taskSaving = ref(false)
const taskFormRef = ref(null)

const taskForm = reactive({
  parent_id: null, wbs_code: '', name: '', assignee: '',
  start_date: '', end_date: '', duration: 1, progress: 0, status: 'pending', description: ''
})

const taskCount = computed(() => flatTasks.value.length)

const taskStats = [
  { label: '总任务', value: computed(() => stats.value?.total || 0) },
  { label: '已完成', value: computed(() => stats.value?.completed || 0) },
  { label: '进行中', value: computed(() => stats.value?.in_progress || 0) },
  { label: '平均进度', value: computed(() => (stats.value?.avg_progress || 0) + '%') },
]

const statusType = (s) => ({ planning: 'info', in_progress: 'success', completed: 'warning', suspended: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ planning: '计划中', in_progress: '进行中', completed: '已完工', suspended: '已暂停' }[s] || s)
const taskStatusType = (s) => ({ pending: 'info', in_progress: '', completed: 'success', delayed: 'danger' }[s] || 'info')
const taskStatusLabel = (s) => ({ pending: '待开始', in_progress: '进行中', completed: '已完成', delayed: '已延期' }[s] || s)

const loadData = async () => {
  project.value = await getProject(projectId.value)
  taskList.value = await getTasks(projectId.value)
  flatTasks.value = await getTasksFlat(projectId.value)
  stats.value = await getTaskStats(projectId.value)
  // 关键路径标记
  try {
    const cp = await getCriticalPath(projectId.value)
    const m = {}
    for (const t of cp.tasks) m[t.id] = t.is_critical
    flatTasks.value = flatTasks.value.map(t => ({ ...t, is_critical: m[t.id] || false }))
  } catch {}
}

const resetTaskForm = () => {
  Object.assign(taskForm, { parent_id: null, wbs_code: '', name: '', assignee: '', start_date: '', end_date: '', duration: 1, progress: 0, status: 'pending', description: '' })
  editingTaskId.value = null
}

const editTask = (row) => {
  editingTaskId.value = row.id
  Object.assign(taskForm, { ...row })
  showTaskDialog.value = true
}

const handleTaskSave = async () => {
  if (!taskForm.wbs_code || !taskForm.name) {
    ElMessage.warning('请填写WBS编码和任务名称')
    return
  }
  taskSaving.value = true
  try {
    const data = { ...taskForm, project_id: projectId.value }
    if (editingTaskId.value) {
      await updateTask(editingTaskId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createTask(data)
      ElMessage.success('添加成功')
    }
    showTaskDialog.value = false
    resetTaskForm()
    await loadData()
  } finally {
    taskSaving.value = false
  }
}

const handleTaskDelete = async (id) => {
  await ElMessageBox.confirm('确定删除该任务？子任务也会被删除。', '提示', { type: 'warning' })
  await deleteTask(id)
  ElMessage.success('删除成功')
  await loadData()
}

onMounted(loadData)
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
.info-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
.fw-600 {
  font-weight: 600;
}
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.task-stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}
.task-stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.wbs-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.task-count {
  font-size: 13px;
  color: var(--text-secondary);
}
.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 36px;
}

.fade-up-enter-active {
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>