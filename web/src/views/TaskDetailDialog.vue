<template>
  <el-dialog v-model="visible" :title="`任务详情 - ${task?.name || ''}`" width="80%" top="5vh" destroy-on-close>
    <div v-if="task" class="task-detail">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab">
        <!-- 基础信息 -->
        <el-tab-pane label="基础信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="WBS编码">{{ task.wbs_code }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ task.assignee }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ task.start_date }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ task.end_date }}</el-descriptions-item>
            <el-descriptions-item label="工期">{{ task.duration }} 天</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(task.status)">{{ statusLabel(task.status) }}</el-tag>
              <el-tag v-if="task.is_critical" type="danger" effect="dark" style="margin-left:8px">关键路径</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="进度" :span="2">
              <el-progress :percentage="task.progress" :status="progressStatus(task.status)" />
            </el-descriptions-item>
            <el-descriptions-item v-if="task.slack_days !== undefined" label="时差">±{{ task.slack_days }} 天</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ task.description || '（无）' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 评论 -->
        <el-tab-pane :label="`评论 (${comments.length})`" name="comments">
          <div class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-head">
                <span class="comment-user">{{ c.user_name }}</span>
                <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                <el-button v-if="canDelete(c)" link size="small" type="danger" @click="delComment(c)">删除</el-button>
              </div>
              <div class="comment-content">{{ c.content }}</div>
            </div>
            <el-empty v-if="comments.length === 0" description="还没有评论" :image-size="80" />
          </div>
          <div class="comment-input">
            <el-input v-model="newComment" type="textarea" :rows="2" placeholder="说点什么..." />
            <el-button type="primary" :loading="posting" @click="submitComment" style="margin-top:8px">发表评论</el-button>
          </div>
        </el-tab-pane>

        <!-- 附件 -->
        <el-tab-pane :label="`附件 (${attachments.length})`" name="attachments">
          <el-upload :http-request="uploadFile" :show-file-list="false" :before-upload="beforeUpload">
            <el-button type="primary"><el-icon><Upload /></el-icon> 上传附件</el-button>
          </el-upload>
          <el-alert title="支持 jpg/png/pdf/doc，单文件最大 2MB" type="info" :closable="false" style="margin: 12px 0" />
          <el-table :data="attachments" stripe>
            <el-table-column prop="file_name" label="文件名" />
            <el-table-column label="大小" width="100">
              <template #default="{ row }">{{ formatSize(row.file_size) }}</template>
            </el-table-column>
            <el-table-column prop="uploader_name" label="上传人" width="100" />
            <el-table-column label="上传时间" width="160">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button link size="small" @click="downloadFile(row)">下载</el-button>
                <el-button link size="small" type="danger" @click="delAttachment(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="attachments.length === 0" description="还没有附件" :image-size="80" />
        </el-tab-pane>

        <!-- 变更日志 -->
        <el-tab-pane :label="`变更日志 (${changeLogs.length})`" name="logs">
          <el-timeline>
            <el-timeline-item v-for="l in changeLogs" :key="l.id" :timestamp="formatTime(l.created_at)" placement="top">
              <div>
                <strong>{{ l.operator_name }}</strong>
                <el-tag size="small" :type="actionType(l.action)" style="margin: 0 8px">{{ actionLabel(l.action) }}</el-tag>
                {{ l.field_name ? `字段 ${l.field_name}` : '' }}
                <span v-if="l.old_value && l.new_value" style="color:#666">
                  ：<s>{{ l.old_value }}</s> → <span style="color:#67c23a">{{ l.new_value }}</span>
                </span>
                <span v-else-if="l.new_value" style="color:#666">：{{ l.new_value }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="changeLogs.length === 0" description="还没有变更记录" :image-size="80" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getComments, addComment, deleteComment,
  getAttachments, uploadAttachment, downloadAttachment, deleteAttachment,
  getChangeLogs,
} from '../api'

const props = defineProps({ modelValue: Boolean, task: Object })
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const activeTab = ref('info')
const comments = ref([])
const attachments = ref([])
const changeLogs = ref([])
const newComment = ref('')
const posting = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v && props.task) loadAll()
})
watch(visible, (v) => { if (!v) emit('update:modelValue', false) })

async function loadAll() {
  await Promise.all([loadComments(), loadAttachments(), loadLogs()])
}
async function loadComments() {
  try { comments.value = await getComments(props.task.id) } catch (e) {}
}
async function loadAttachments() {
  try { attachments.value = await getAttachments(props.task.id) } catch (e) {}
}
async function loadLogs() {
  try { changeLogs.value = await getChangeLogs('task', props.task.id) } catch (e) {}
}

async function submitComment() {
  if (!newComment.value.trim()) return ElMessage.warning('评论内容不能为空')
  posting.value = true
  try {
    await addComment({ task_id: props.task.id, content: newComment.value })
    newComment.value = ''
    await loadComments()
    ElMessage.success('评论发表成功')
  } finally { posting.value = false }
}

async function delComment(c) {
  try { await ElMessageBox.confirm('确定删除这条评论吗？', '确认', { type: 'warning' })
  } catch { return }
  await deleteComment(c.id)
  loadComments()
  ElMessage.success('已删除')
}

function canDelete(c) {
  // 简化：所有评论都能删（实际应该做权限）
  return true
}

function beforeUpload(file) {
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件不能超过 2MB')
    return false
  }
  return true
}

async function uploadFile(option) {
  const file = option.file
  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1]
    try {
      await uploadAttachment({
        task_id: props.task.id,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_data: base64,
      })
      ElMessage.success('上传成功')
      loadAttachments()
    } catch (e) {
      ElMessage.error('上传失败：' + (e.response?.data?.message || e.message))
    }
  }
  reader.readAsDataURL(file)
}

async function downloadFile(att) {
  try {
    const r = await downloadAttachment(att.id)
    // 转 blob 下载
    const byteString = atob(r.file_data)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    const blob = new Blob([ab], { type: r.mime_type || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = r.file_name
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { ElMessage.error('下载失败') }
}

async function delAttachment(a) {
  try { await ElMessageBox.confirm(`确定删除附件"${a.file_name}"吗？`, '确认', { type: 'warning' })
  } catch { return }
  await deleteAttachment(a.id)
  loadAttachments()
  ElMessage.success('已删除')
}

function statusType(s) {
  return { pending: 'info', in_progress: 'primary', completed: 'success', delayed: 'danger' }[s] || 'info'
}
function statusLabel(s) {
  return { pending: '待开始', in_progress: '进行中', completed: '已完成', delayed: '已延期' }[s] || s
}
function progressStatus(s) {
  if (s === 'completed') return 'success'
  if (s === 'delayed') return 'exception'
  return ''
}
function actionType(a) { return { create: 'success', update: 'primary', delete: 'danger' }[a] || '' }
function actionLabel(a) { return { create: '创建', update: '更新', delete: '删除' }[a] || a }
function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '-' }
function formatSize(b) {
  if (!b) return '-'
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}
</script>

<style scoped>
.task-detail { padding: 0 8px; }
.comment-list { max-height: 360px; overflow-y: auto; }
.comment-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.comment-head { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.comment-user { font-weight: 600; color: #303133; }
.comment-time { color: #909399; font-size: 12px; }
.comment-content { color: #606266; line-height: 1.6; padding-left: 0; }
.comment-input { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
</style>
