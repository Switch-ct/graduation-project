<template>
  <div class="m-dashboard">
    <!-- 顶部欢迎卡 —— 白底黑字 -->
    <div class="m-welcome">
      <el-avatar :size="64" class="m-avatar">
        <el-icon :size="32"><UserFilled /></el-icon>
      </el-avatar>
      <div class="m-welcome-info">
        <div class="m-name">{{ user.real_name || user.username }}</div>
        <div class="m-role">{{ user.role === 'admin' ? '管理员' : '项目成员' }} · 欢迎回来</div>
      </div>
    </div>

    <!-- 关键数字 —— 白底卡，大数字带颜色 -->
    <div class="m-stats">
      <div class="m-stat" v-for="s in stats" :key="s.label">
        <div class="m-stat-v" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="m-stat-l">{{ s.label }}</div>
      </div>
    </div>

    <!-- 快捷入口 —— 白底 -->
    <div class="m-shortcut">
      <div class="m-grid-item" @click="$router.push('/m/projects')">
        <IconSvg name="projects" :size="22" color="#1a1a1a" />
        <span>项目</span>
      </div>
      <div class="m-grid-item" @click="$router.push('/m/tasks')">
        <IconSvg name="tasks" :size="22" color="#1a1a1a" />
        <span>任务</span>
      </div>
      <div class="m-grid-item" @click="$router.push('/m/workload')">
        <IconSvg name="chart" :size="22" color="#1a1a1a" />
        <span>工作量</span>
      </div>
      <div class="m-grid-item" @click="$router.push('/m/changes')">
        <IconSvg name="doc" :size="22" color="#1a1a1a" />
        <span>动态</span>
      </div>
    </div>

    <!-- 延期预警 - 可点击跳到延期管理页 -->
    <div v-if="overdueCount" class="m-alert" @click="$router.push('/m/overdue')">
      <IconSvg name="warning" :size="20" color="#ee0a24" />
      <div class="m-alert-content">
        <div class="m-alert-title">检测到 {{ overdueCount }} 个延期项</div>
        <div class="m-alert-desc">点击查看详情</div>
      </div>
      <IconSvg name="arrow-right" :size="16" color="#ee0a24" />
    </div>

    <!-- 进行中项目 -->
    <div class="m-section">
      <div class="m-section-head">
        <span class="m-section-title">进行中的项目</span>
        <span class="m-section-more" @click="$router.push('/m/projects')">查看全部 ›</span>
      </div>
      <div v-for="p in activeProjects" :key="p.id" class="m-project-card" @click="$router.push(`/m/project/${p.id}`)">
        <div class="m-project-top">
          <span class="m-project-name">{{ p.name }}</span>
          <span class="m-project-pct">{{ projectProgress(p.id) }}%</span>
        </div>
        <div class="m-project-meta">
          <span><IconSvg name="location" :size="12" color="#999" /> {{ p.location }}</span>
          <span><IconSvg name="profile" :size="12" color="#999" /> {{ p.manager }}</span>
        </div>
        <div class="m-project-bar">
          <div class="m-project-bar-fill" :style="{ width: projectProgress(p.id) + '%' }"></div>
        </div>
      </div>
      <div v-if="activeProjects.length === 0" class="m-empty">暂无进行中项目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { UserFilled } from '@element-plus/icons-vue'
import { getProjects, getTaskStats, getAllOverdue } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const projects = ref([])
const taskStats = ref({})
const overdueCount = ref(0)

const stats = computed(() => {
  const total = projects.value.length
  const active = projects.value.filter(p => p.status === 'in_progress').length
  const done = projects.value.filter(p => p.status === 'completed').length
  return [
    { label: '项目', value: total, color: '#1a1a1a' },
    { label: '进行中', value: active, color: '#1a1a1a' },
    { label: '已完成', value: done, color: '#1a1a1a' },
    { label: '延期', value: overdueCount.value, color: '#ee0a24' },  // 红色高亮
  ]
})

const activeProjects = computed(() => projects.value.filter(p => p.status === 'in_progress'))
function projectProgress(id) { return Math.round(taskStats.value[id]?.avg_progress || 0) }

onMounted(async () => {
  projects.value = await getProjects().catch(() => [])
  for (const p of projects.value) {
    try { taskStats.value[p.id] = await getTaskStats(p.id) } catch {}
  }
  const od = await getAllOverdue().catch(() => ({}))
  overdueCount.value = (od.overdue_projects?.length || 0) + (od.overdue_tasks?.length || 0)
})
</script>

<style scoped>
/* ========== 白底黑字风格 ========== */
.m-dashboard { padding: 0; }

.m-welcome {
  display: flex; align-items: center; gap: 12px;
  background: #ffffff;
  border: 1px solid #eaeaea;
  color: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.m-avatar { background: #f5f5f5; border: 1px solid #eaeaea; }
.m-name { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.m-role { font-size: 12px; color: #666; margin-top: 2px; }

/* 统计卡 —— 白底黑字大数字 */
.m-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.m-stat {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px 4px;
  text-align: center;
}
.m-stat-v { font-size: 24px; font-weight: 700; line-height: 1.1; color: #1a1a1a; }
.m-stat-l { font-size: 11px; color: #999; margin-top: 4px; }

/* 快捷入口 —— 白底 */
.m-shortcut {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px 0;
}
.m-grid-item {
  text-align: center;
  font-size: 12px;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.m-grid-item:active { opacity: 0.5; }

/* 延期预警 - 可点击 */
.m-alert {
  background: #fff5f5;
  border: 1px solid #ffd6d6;
  color: #ee0a24;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  cursor: pointer;
}
.m-alert:active { opacity: 0.6; }
.m-alert-content { flex: 1; }
.m-alert-title { font-weight: 600; color: #ee0a24; }
.m-alert-desc { font-size: 12px; color: #ee0a24; opacity: 0.85; }

/* 项目列表 */
.m-section { background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 0 12px; }
.m-section-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.m-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.m-section-more { font-size: 12px; color: #666; cursor: pointer; }
.m-section-more:active { opacity: 0.5; }

.m-project-card {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.m-project-card:last-child { border-bottom: none; }
.m-project-top { display: flex; justify-content: space-between; align-items: center; }
.m-project-name { font-weight: 500; color: #1a1a1a; flex: 1; }
.m-project-pct { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.m-project-meta { display: flex; gap: 12px; font-size: 12px; color: #999; margin-top: 4px; }
.m-project-meta > span { display: flex; align-items: center; gap: 4px; }
.m-project-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}
.m-project-bar-fill {
  height: 100%;
  background: #1a1a1a;
  transition: width 0.3s;
}
.m-empty { text-align: center; color: #999; padding: 24px 0; font-size: 13px; }
</style>
