<template>
  <div class="m-task-detail" v-if="task">
    <!-- 基本信息 -->
    <div class="m-info-card">
      <div class="m-info-top">
        <span class="m-info-code">{{ task.wbs_code }}</span>
        <span :class="['m-info-tag', `tag-${task.status}`]">{{ statusLabel(task.status) }}</span>
      </div>
      <div class="m-info-name">{{ task.name }}</div>
      <div class="m-info-row">
        <IconSvg name="profile" :size="14" color="#999" />
        <span>负责人：{{ task.assignee || '未分配' }}</span>
      </div>
      <div class="m-info-row">
        <IconSvg name="calendar" :size="14" color="#999" />
        <span>{{ task.start_date }} ~ {{ task.end_date }}</span>
      </div>
      <div class="m-info-row">
        <IconSvg name="chart" :size="14" color="#999" />
        <span>进度：<strong style="color:#1a1a1a">{{ task.progress || 0 }}%</strong></span>
      </div>
    </div>

    <!-- 操作 -->
    <div class="m-op-btns">
      <div class="m-op-btn primary" @click="showEdit = true">
        <IconSvg name="chart" :size="18" />
        <span>更新进度</span>
      </div>
      <div class="m-op-btn" @click="$router.back()">
        <IconSvg name="arrow-left" :size="18" />
        <span>返回</span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="m-tabs">
      <span :class="['m-tab', activeTab === 'desc' && 'active']" @click="activeTab = 'desc'">详情</span>
      <span :class="['m-tab', activeTab === 'comment' && 'active']" @click="activeTab = 'comment'">
        评论 ({{ comments.length }})
      </span>
      <span :class="['m-tab', activeTab === 'log' && 'active']" @click="activeTab = 'log'">
        变更 ({{ logs.length }})
      </span>
    </div>

    <!-- 详情面板 -->
    <div v-if="activeTab === 'desc'" class="m-tab-pane">
      <div v-if="task.description" class="m-desc-text">{{ task.description }}</div>
      <div v-else class="m-empty">暂无详细说明</div>
    </div>

    <!-- 评论面板 -->
    <div v-if="activeTab === 'comment'" class="m-tab-pane">
      <div v-for="c in comments" :key="c.id" class="m-comment">
        <div class="m-comment-head">
          <span class="m-comment-user">{{ c.user_name }}</span>
          <span class="m-comment-time">{{ formatTime(c.created_at) }}</span>
        </div>
        <div class="m-comment-content">{{ c.content }}</div>
      </div>
      <div v-if="comments.length === 0" class="m-empty">暂无评论</div>

      <div class="m-comment-input">
        <textarea v-model="newComment" placeholder="说点什么..." rows="2"></textarea>
        <button class="m-comment-send" @click="sendComment" :disabled="!newComment.trim()">发送</button>
      </div>
    </div>

    <!-- 变更日志面板 -->
    <div v-if="activeTab === 'log'" class="m-tab-pane">
      <div v-for="l in logs" :key="l.id" class="m-log">
        <div class="m-log-head">
          <span class="m-log-user">{{ l.user_name }}</span>
          <span class="m-log-time">{{ formatTime(l.created_at) }}</span>
        </div>
        <div class="m-log-content">
          修改 <strong>{{ l.field }}</strong>：<span class="old">{{ l.old_value || '(空)' }}</span> → <span class="new">{{ l.new_value || '(空)' }}</span>
        </div>
      </div>
      <div v-if="logs.length === 0" class="m-empty">暂无变更记录</div>
    </div>

    <!-- 更新进度弹窗 -->
    <van-popup v-model:show="showEdit" position="bottom" round :style="{ background: '#fff' }">
      <div class="m-edit">
        <div class="m-edit-title">更新进度</div>
        <div class="m-edit-row">
          <span class="lbl">当前进度</span>
          <span class="val">{{ editProgress }}%</span>
        </div>
        <input type="range" min="0" max="100" v-model.number="editProgress" class="m-edit-slider" />
        <div class="m-edit-row">
          <span class="lbl">状态</span>
        </div>
        <div class="m-edit-status">
          <span v-for="s in statusOptions" :key="s.value"
                :class="['m-edit-status-item', editStatus === s.value && 'active']"
                @click="editStatus = s.value">{{ s.label }}</span>
        </div>
        <textarea v-model="editNote" placeholder="备注（可选）" class="m-edit-note" rows="2"></textarea>
        <div class="m-edit-actions">
          <button class="m-edit-cancel" @click="showEdit = false">取消</button>
          <button class="m-edit-save" @click="saveProgress" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getTask, getComments, addComment, getChangelogsByTask, updateTask } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const route = useRoute()
const task = ref(null)
const comments = ref([])
const logs = ref([])
const newComment = ref('')
const activeTab = ref('desc')

const showEdit = ref(false)
const editProgress = ref(0)
const editStatus = ref('in_progress')
const editNote = ref('')
const saving = ref(false)

const statusOptions = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '延期' },
]

onMounted(async () => {
  const id = route.params.id
  task.value = await getTask(id)
  editProgress.value = task.value.progress || 0
  editStatus.value = task.value.status || 'in_progress'
  comments.value = await getComments(id).catch(() => [])
  logs.value = await getChangelogsByTask(id).catch(() => [])
})

async function sendComment() {
  if (!newComment.value.trim()) return
  try {
    const c = await addComment({ task_id: task.value.id, content: newComment.value })
    comments.value.push(c)
    newComment.value = ''
    showToast('评论成功')
  } catch (e) { showToast('评论失败') }
}

async function saveProgress() {
  saving.value = true
  try {
    await updateTask(task.value.id, {
      progress: editProgress.value,
      status: editStatus.value,
      description: task.value.description ? task.value.description + (editNote.value ? '\n[' + formatTime(new Date()) + '] ' + editNote.value : '') : editNote.value,
    })
    task.value.progress = editProgress.value
    task.value.status = editStatus.value
    showEdit.value = false
    showToast('已更新')
    editNote.value = ''
    // 刷新变更日志
    logs.value = await getChangelogsByTask(task.value.id).catch(() => [])
  } catch (e) { showToast('更新失败') }
  finally { saving.value = false }
}

function statusLabel(s) { return { pending: '待开始', in_progress: '进行中', completed: '已完成', delayed: '已延期' }[s] || s }
function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.m-task-detail { display: flex; flex-direction: column; gap: 12px; }

.m-info-card { background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 14px; }
.m-info-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.m-info-code { font-size: 11px; color: #999; font-family: monospace; }
.m-info-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: #f0f0f0; color: #666;
}
.tag-pending { background: #f0f0f0; color: #999; }
.tag-in_progress { background: #e6f7ec; color: #16a34a; }
.tag-completed { background: #f0f0f0; color: #999; }
.tag-delayed { background: #ffebee; color: #ee0a24; }

.m-info-name { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; }
.m-info-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; margin-top: 6px; }

.m-op-btns { display: flex; gap: 8px; }
.m-op-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
}
.m-op-btn.primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.m-op-btn:active { opacity: 0.6; }

.m-tabs {
  display: flex;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 4px;
}
.m-tab {
  flex: 1;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
}
.m-tab.active { background: #1a1a1a; color: #fff; }

.m-tab-pane { background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 12px; min-height: 120px; }
.m-desc-text { font-size: 13px; color: #1a1a1a; line-height: 1.6; white-space: pre-wrap; }
.m-empty { text-align: center; color: #999; padding: 30px 0; font-size: 13px; }

.m-comment { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.m-comment:last-child { border-bottom: none; }
.m-comment-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.m-comment-user { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.m-comment-time { font-size: 11px; color: #999; }
.m-comment-content { font-size: 13px; color: #1a1a1a; line-height: 1.5; }

.m-comment-input { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.m-comment-input textarea {
  flex: 1;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  color: #1a1a1a;
}
.m-comment-send {
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0 16px;
  font-size: 13px;
  cursor: pointer;
}
.m-comment-send:disabled { background: #ccc; cursor: not-allowed; }

.m-log { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.m-log:last-child { border-bottom: none; }
.m-log-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
.m-log-user { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.m-log-time { font-size: 11px; color: #999; }
.m-log-content { font-size: 13px; color: #666; }
.m-log-content strong { color: #1a1a1a; }
.m-log-content .old { color: #999; text-decoration: line-through; }
.m-log-content .new { color: #16a34a; font-weight: 500; }

/* 编辑弹窗 */
.m-edit { background: #fff; padding: 16px; border-radius: 12px 12px 0 0; }
.m-edit-title { font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: center; margin-bottom: 16px; }
.m-edit-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 6px; }
.m-edit-row .lbl { font-size: 13px; color: #999; }
.m-edit-row .val { font-size: 24px; font-weight: 700; color: #1a1a1a; }
.m-edit-slider { width: 100%; height: 32px; }
.m-edit-status { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.m-edit-status-item {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}
.m-edit-status-item.active { background: #1a1a1a; color: #fff; }
.m-edit-note {
  width: 100%;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  color: #1a1a1a;
  box-sizing: border-box;
}
.m-edit-actions { display: flex; gap: 8px; margin-top: 12px; }
.m-edit-cancel, .m-edit-save {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}
.m-edit-cancel { background: #f5f5f5; color: #666; }
.m-edit-save { background: #1a1a1a; color: #fff; }
.m-edit-save:disabled { background: #ccc; }
</style>
