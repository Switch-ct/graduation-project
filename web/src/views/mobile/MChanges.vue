<template>
  <div class="m-changes">
    <div v-for="l in logs" :key="l.id" class="m-change-card">
      <div class="m-change-head">
        <span class="m-change-avatar">{{ l.user_name?.[0] || '?' }}</span>
        <div class="m-change-info">
          <div class="m-change-user">{{ l.user_name }}</div>
          <div class="m-change-time">{{ formatTime(l.created_at) }}</div>
        </div>
        <span class="m-change-field">{{ l.field }}</span>
      </div>
      <div class="m-change-body">
        <div class="m-change-row"><span class="m-change-lbl">任务</span><span>{{ l.task_name || '#' + l.task_id }}</span></div>
        <div class="m-change-row"><span class="m-change-lbl">原值</span><span class="m-change-old">{{ l.old_value || '(空)' }}</span></div>
        <div class="m-change-row"><span class="m-change-lbl">新值</span><span class="m-change-new">{{ l.new_value || '(空)' }}</span></div>
      </div>
    </div>
    <div v-if="logs.length === 0" class="m-empty">暂无变更记录</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getChangelogs } from '../../api'

const logs = ref([])
onMounted(async () => { logs.value = await getChangelogs(50).catch(() => []) })

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.m-changes { display: flex; flex-direction: column; gap: 8px; }

.m-change-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px;
}
.m-change-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.m-change-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
.m-change-info { flex: 1; }
.m-change-user { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.m-change-time { font-size: 11px; color: #999; margin-top: 1px; }
.m-change-field {
  font-size: 11px;
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: monospace;
}

.m-change-body { display: flex; flex-direction: column; gap: 4px; }
.m-change-row { display: flex; gap: 8px; font-size: 12px; }
.m-change-lbl { color: #999; width: 36px; }
.m-change-old { color: #999; text-decoration: line-through; }
.m-change-new { color: #16a34a; font-weight: 500; }

.m-empty { text-align: center; color: #999; padding: 40px 0; font-size: 13px; }
</style>
