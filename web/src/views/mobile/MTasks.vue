<template>
  <div class="m-tasks">
    <div class="m-picker" @click="showPicker = true">
      <IconSvg name="projects" :size="16" color="#999" />
      <span class="m-picker-text" v-if="selectedProject">{{ selectedProject.name }}</span>
      <span class="m-picker-text placeholder" v-else>选择项目查看任务</span>
      <IconSvg name="arrow-right" :size="14" color="#999" />
    </div>

    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-picker
        :columns="pickerCols"
        @confirm="onPick"
        @cancel="showPicker = false"
        title="选择项目"
      />
    </van-popup>

    <div class="m-task-list">
      <div v-for="t in tasks" :key="t.id" class="m-task" @click="$router.push(`/m/task/${t.id}`)">
        <div class="m-task-top">
          <span class="m-task-code">{{ t.wbs_code }}</span>
          <span :class="['m-task-tag', `tag-${t.status}`]">{{ statusLabel(t.status) }}</span>
        </div>
        <div class="m-task-name">{{ t.name }}</div>
        <div class="m-task-meta">
          <span><IconSvg name="profile" :size="12" color="#999" /> {{ t.assignee || '未分配' }}</span>
          <span><IconSvg name="calendar" :size="12" color="#999" /> {{ t.start_date }} ~ {{ t.end_date }}</span>
        </div>
        <div class="m-task-bar">
          <div class="m-task-bar-fill" :style="{ width: (t.progress || 0) + '%' }"></div>
        </div>
        <div class="m-task-bottom">
          <span>进度</span>
          <span class="m-task-pct">{{ t.progress || 0 }}%</span>
        </div>
      </div>
      <div v-if="tasks.length === 0 && selectedProject" class="m-empty">该项目暂无任务</div>
      <div v-if="!selectedProject" class="m-empty">请先选择项目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProjects, getTasks } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const projects = ref([])
const selectedProject = ref(null)
const showPicker = ref(false)
const tasks = ref([])

onMounted(async () => { projects.value = await getProjects().catch(() => []) })

const pickerCols = computed(() => projects.value.map(p => ({ text: p.name, value: p.id })))

async function onPick({ selectedOptions }) {
  const p = projects.value.find(x => x.id === selectedOptions[0].value)
  selectedProject.value = p
  showPicker.value = false
  tasks.value = await getTasks(p.id).catch(() => [])
}

function statusLabel(s) { return { pending: '待开始', in_progress: '进行中', completed: '已完成', delayed: '已延期' }[s] || s }
</script>

<style scoped>
.m-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
}
.m-picker-text { flex: 1; font-size: 14px; color: #1a1a1a; }
.m-picker-text.placeholder { color: #999; }

.m-task-list { display: flex; flex-direction: column; gap: 8px; }
.m-task {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
}
.m-task:active { opacity: 0.6; }
.m-task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.m-task-code { font-size: 11px; color: #999; font-family: monospace; }
.m-task-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
}
.tag-pending { background: #f0f0f0; color: #999; }
.tag-in_progress { background: #e6f7ec; color: #16a34a; }
.tag-completed { background: #f0f0f0; color: #999; }
.tag-delayed { background: #ffebee; color: #ee0a24; }

.m-task-name { font-size: 14px; color: #1a1a1a; font-weight: 500; margin-bottom: 6px; }
.m-task-meta { display: flex; gap: 12px; font-size: 12px; color: #666; margin-bottom: 8px; }
.m-task-meta > span { display: flex; align-items: center; gap: 4px; }
.m-task-bar { height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; }
.m-task-bar-fill { height: 100%; background: #1a1a1a; transition: width 0.3s; }
.m-task-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 12px; color: #999; }
.m-task-pct { color: #1a1a1a; font-weight: 600; }

.m-empty { text-align: center; color: #999; padding: 40px 0; font-size: 13px; }
</style>
