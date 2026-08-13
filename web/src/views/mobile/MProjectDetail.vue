<template>
  <div class="m-detail" v-if="project">
    <div class="m-detail-card">
      <div class="m-detail-name">{{ project.name }}</div>
      <div class="m-detail-tag" :class="`tag-${project.status}`">{{ statusLabel(project.status) }}</div>
    </div>

    <div class="m-info">
      <div class="m-info-row">
        <IconSvg name="location" :size="14" color="#999" />
        <span class="lbl">项目地点</span>
        <span class="val">{{ project.location || '-' }}</span>
      </div>
      <div class="m-info-row">
        <IconSvg name="profile" :size="14" color="#999" />
        <span class="lbl">项目负责人</span>
        <span class="val">{{ project.manager || '-' }}</span>
      </div>
      <div class="m-info-row">
        <IconSvg name="calendar" :size="14" color="#999" />
        <span class="lbl">工期</span>
        <span class="val">{{ project.start_date }} ~ {{ project.end_date }}</span>
      </div>
      <div class="m-info-row">
        <IconSvg name="money" :size="14" color="#999" />
        <span class="lbl">总预算</span>
        <span class="val">{{ project.total_budget?.toLocaleString() || 0 }} 万</span>
      </div>
    </div>

    <div class="m-progress" v-if="stats">
      <div class="m-progress-head">
        <span>项目整体进度</span>
        <span class="m-progress-pct">{{ Math.round(stats.avg_progress || 0) }}<span style="font-size:16px">%</span></span>
      </div>
      <div class="m-progress-bar">
        <div class="m-progress-fill" :style="{ width: (stats.avg_progress || 0) + '%' }"></div>
      </div>
      <div class="m-progress-stats">
        <div class="m-progress-stat">
          <div class="m-progress-stat-v">{{ stats.total || 0 }}</div>
          <div class="m-progress-stat-l">总任务</div>
        </div>
        <div class="m-progress-stat">
          <div class="m-progress-stat-v" style="color:#16a34a">{{ stats.completed || 0 }}</div>
          <div class="m-progress-stat-l">已完成</div>
        </div>
        <div class="m-progress-stat">
          <div class="m-progress-stat-v" style="color:#1e6fd0">{{ stats.in_progress || 0 }}</div>
          <div class="m-progress-stat-l">进行中</div>
        </div>
        <div class="m-progress-stat">
          <div class="m-progress-stat-v" style="color:#ee0a24">{{ stats.delayed || 0 }}</div>
          <div class="m-progress-stat-l">延期</div>
        </div>
      </div>
    </div>

    <div class="m-actions">
      <div class="m-action" @click="$router.push(`/m/tasks`)">
        <IconSvg name="tasks" :size="20" color="#1a1a1a" />
        <span class="m-action-text">查看任务</span>
        <IconSvg name="arrow-right" :size="14" color="#999" />
      </div>
    </div>

    <div v-if="project.description" class="m-desc">
      <div class="m-desc-title">项目说明</div>
      <div class="m-desc-content">{{ project.description }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProject, getTaskStats } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const route = useRoute()
const project = ref(null)
const stats = ref(null)

onMounted(async () => {
  const id = route.params.id
  project.value = await getProject(id)
  stats.value = await getTaskStats(id).catch(() => null)
})

function statusLabel(s) { return { planning: '计划中', in_progress: '进行中', completed: '已完成', suspended: '已暂停' }[s] || s }
</script>

<style scoped>
.m-detail { display: flex; flex-direction: column; gap: 12px; }

.m-detail-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px;
}
.m-detail-name { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.m-detail-tag {
  display: inline-block;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #666;
}
.tag-planning { background: #e8f3ff; color: #1e6fd0; }
.tag-in_progress { background: #e6f7ec; color: #16a34a; }
.tag-completed { background: #f0f0f0; color: #999; }
.tag-suspended { background: #fff3e0; color: #d97706; }

.m-info {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 4px 12px;
}
.m-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}
.m-info-row:last-child { border-bottom: none; }
.lbl { color: #999; width: 80px; }
.val { color: #1a1a1a; flex: 1; }

.m-progress {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px;
}
.m-progress-head { display: flex; justify-content: space-between; align-items: baseline; color: #1a1a1a; font-size: 14px; }
.m-progress-pct { font-size: 28px; font-weight: 700; color: #1a1a1a; }
.m-progress-bar { height: 6px; background: #f0f0f0; border-radius: 3px; margin: 12px 0; overflow: hidden; }
.m-progress-fill { height: 100%; background: #1a1a1a; transition: width 0.4s; }
.m-progress-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.m-progress-stat { text-align: center; }
.m-progress-stat-v { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.m-progress-stat-l { font-size: 11px; color: #999; margin-top: 2px; }

.m-actions { display: flex; flex-direction: column; gap: 8px; }
.m-action {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: row;       /* 左右结构 */
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
  text-align: left;
}
.m-action-text { flex: 1; }   /* 文字占满中间 */

.m-desc {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px;
}
.m-desc-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.m-desc-content { font-size: 13px; color: #666; line-height: 1.6; }
</style>
