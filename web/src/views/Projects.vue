<template>
  <div class="projects">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">项目管理</h3>
        <span class="page-count">共 {{ projects.length }} 个项目</span>
      </div>
      <el-button type="primary" @click="showDialog = true" class="create-btn">
        <el-icon><Plus /></el-icon> 新建项目
      </el-button>
    </div>

    <el-card shadow="hover" class="table-card">
      <el-table :data="projects" stripe style="width: 100%">
        <el-table-column prop="name" label="项目名称" min-width="220">
          <template #default="{ row }">
            <span class="project-name-link" @click="$router.push(`/project/${row.id}`)">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="项目地点" width="180" />
        <el-table-column prop="manager" label="项目经理" width="100" />
        <el-table-column prop="start_date" label="开工日期" width="120" />
        <el-table-column prop="end_date" label="竣工日期" width="120" />
        <el-table-column prop="total_budget" label="预算(万元)" width="120">
          <template #default="{ row }">
            <span class="budget">{{ row.total_budget?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="plain" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/project/${row.id}`)">详情</el-button>
            <el-button size="small" type="success" @click="$router.push(`/gantt/${row.id}`)">甘特图</el-button>
            <el-button size="small" @click="editProject(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog -->
    <el-dialog
      v-model="showDialog"
      :title="editingId ? '编辑项目' : '新建项目'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" label-position="right">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入项目地点" />
        </el-form-item>
        <el-form-item label="项目经理" prop="manager">
          <el-input v-model="form.manager" placeholder="请输入项目经理" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开工日期" prop="start_date">
              <el-date-picker v-model="form.start_date" type="date" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="竣工日期" prop="end_date">
              <el-date-picker v-model="form.end_date" type="date" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="总预算(万元)" prop="total_budget">
              <el-input-number v-model="form.total_budget" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="计划中" value="planning" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完工" value="completed" />
                <el-option label="已暂停" value="suspended" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, createProject, updateProject, deleteProject } from '../api'

const projects = ref([])
const showDialog = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '', location: '', manager: '', start_date: '', end_date: '',
  total_budget: null, status: 'planning', description: ''
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

const statusType = (s) => ({
  planning: 'info', in_progress: 'success', completed: 'warning', suspended: 'danger'
}[s] || 'info')

const statusLabel = (s) => ({
  planning: '计划中', in_progress: '进行中', completed: '已完工', suspended: '已暂停'
}[s] || s)

const loadProjects = async () => {
  projects.value = await getProjects()
}

const resetForm = () => {
  Object.assign(form, { name: '', location: '', manager: '', start_date: '', end_date: '', total_budget: null, status: 'planning', description: '' })
  editingId.value = null
}

const editProject = (row) => {
  editingId.value = row.id
  Object.assign(form, { ...row })
  showDialog.value = true
}

const handleSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateProject(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createProject(form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    resetForm()
    await loadProjects()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除该项目？相关任务也会被删除。', '提示', { type: 'warning' })
  await deleteProject(id)
  ElMessage.success('删除成功')
  await loadProjects()
}

onMounted(loadProjects)
</script>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.page-count {
  font-size: 13px;
  color: var(--text-secondary);
}
.create-btn {
  border-radius: 8px;
  height: 38px;
  font-weight: 500;
}
.table-card {
  border-radius: 8px;
}
.project-name-link {
  color: var(--primary);
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}
.project-name-link:hover {
  color: #337ECC;
  text-decoration: underline;
}
.budget {
  font-weight: 500;
  color: var(--text-primary);
}
</style>