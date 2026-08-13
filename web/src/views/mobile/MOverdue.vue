<template>
  <div class="m-overdue">
    <!-- 顶部汇总卡 -->
    <div class="m-sum-row">
      <div class="m-sum m-sum-danger">
        <div class="m-sum-v">{{ data.summary?.project_count || 0 }}</div>
        <div class="m-sum-l">延期项目</div>
      </div>
      <div class="m-sum m-sum-warn">
        <div class="m-sum-v">{{ data.summary?.task_count || 0 }}</div>
        <div class="m-sum-l">延期任务</div>
      </div>
      <div class="m-sum m-sum-info">
        <div class="m-sum-v">{{ data.summary?.total_impact_days || 0 }}</div>
        <div class="m-sum-l">累计天数</div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="m-tabs">
      <span :class="['m-tab', activeTab === 'projects' && 'active']" @click="activeTab = 'projects'">
        项目 ({{ data.overdue_projects?.length || 0 }})
      </span>
      <span :class="['m-tab', activeTab === 'tasks' && 'active']" @click="activeTab = 'tasks'">
        任务 ({{ data.overdue_tasks?.length || 0 }})
      </span>
    </div>

    <!-- 延期项目列表 -->
    <div v-if="activeTab === 'projects'" class="m-list">
      <div v-if="!data.overdue_projects?.length" class="m-empty">没有延期的项目 ✓</div>
      <div v-for="p in data.overdue_projects" :key="p.id" class="m-card" @click="goProject(p)">
        <div class="m-card-top">
          <span class="m-card-name">{{ p.name }}</span>
          <span class="m-card-days">{{ p.days_overdue }}天</span>
        </div>
        <div class="m-card-row">
          <IconSvg name="profile" :size="12" color="#999" />
          <span>{{ p.manager || '未指定负责人' }}</span>
        </div>
        <div class="m-card-row">
          <IconSvg name="calendar" :size="12" color="#999" />
          <span>原计划完工 {{ p.end_date }}</span>
        </div>
      </div>
    </div>

    <!-- 延期任务列表 -->
    <div v-if="activeTab === 'tasks'" class="m-list">
      <div v-if="!data.overdue_tasks?.length" class="m-empty">没有延期的任务 ✓</div>
      <div v-for="t in data.overdue_tasks" :key="t.id" class="m-card" @click="goTask(t)">
        <div class="m-card-top">
          <span class="m-card-wbs">{{ t.wbs_code }}</span>
          <span class="m-card-days">{{ t.days_overdue }}天</span>
        </div>
        <div class="m-card-name">{{ t.name }}</div>
        <div class="m-card-row">
          <IconSvg name="projects" :size="12" color="#999" />
          <span>{{ t.project_name }}</span>
        </div>
        <div class="m-card-row">
          <IconSvg name="profile" :size="12" color="#999" />
          <span>{{ t.assignee || '未分配' }}</span>
        </div>
        <div class="m-card-row">
          <IconSvg name="calendar" :size="12" color="#999" />
          <span>原计划完工 {{ t.end_date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllOverdue } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const router = useRouter()
const data = ref({ overdue_projects: [], overdue_tasks: [], summary: {} })
const activeTab = ref('projects')

onMounted(async () => { data.value = await getAllOverdue() })

function goProject(p) { router.push(`/m/project/${p.id}`) }
function goTask(t) { router.push(`/m/task/${t.id}`) }
</script>

<style scoped>
.m-overdue { display: flex; flex-direction: column; gap: 12px; }

.m-sum-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.m-sum {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px 4px;
  text-align: center;
}
.m-sum-v { font-size: 24px; font-weight: 700; line-height: 1.1; }
.m-sum-l { font-size: 11px; color: #999; margin-top: 4px; }
.m-sum-danger { border-color: #ffd6d6; }
.m-sum-danger .m-sum-v { color: #ee0a24; }
.m-sum-warn { border-color: #ffe4b5; }
.m-sum-warn .m-sum-v { color: #d97706; }
.m-sum-info { border-color: #d6e4ff; }
.m-sum-info .m-sum-v { color: #1e6fd0; }

.m-tabs { display: flex; background: #fff; border: 1px solid #eaeaea; border-radius: 8px; padding: 4px; }
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

.m-list { display: flex; flex-direction: column; gap: 8px; }
.m-empty { text-align: center; color: #999; padding: 30px 0; font-size: 13px; background: #fff; border: 1px solid #eaeaea; border-radius: 8px; }

.m-card {
  background: #fff;
  border: 1px solid #ffe4e4;
  border-left: 3px solid #ee0a24;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
}
.m-card:active { opacity: 0.6; }
.m-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.m-card-name { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
.m-card-wbs { font-size: 11px; color: #999; font-family: monospace; }
.m-card-days {
  font-size: 12px;
  font-weight: 700;
  color: #ee0a24;
  background: #ffebee;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: 8px;
}
.m-card-row { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; margin-top: 4px; }
</style>
