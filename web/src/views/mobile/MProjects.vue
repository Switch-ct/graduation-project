<template>
  <div class="m-projects">
    <div class="m-search">
      <IconSvg name="search" :size="18" color="#999" />
      <input v-model="keyword" placeholder="搜索项目" />
    </div>

    <div class="m-tabs">
      <span :class="['m-tab', filter === 'all' && 'active']" @click="filter = 'all'">全部</span>
      <span :class="['m-tab', filter === 'in_progress' && 'active']" @click="filter = 'in_progress'">进行中</span>
      <span :class="['m-tab', filter === 'planning' && 'active']" @click="filter = 'planning'">计划中</span>
      <span :class="['m-tab', filter === 'completed' && 'active']" @click="filter = 'completed'">已完成</span>
      <span :class="['m-tab', filter === 'suspended' && 'active']" @click="filter = 'suspended'">已暂停</span>
    </div>

    <div class="m-list">
      <div v-for="p in filtered" :key="p.id" class="m-item" @click="$router.push(`/m/project/${p.id}`)">
        <div class="m-item-top">
          <span class="m-item-name">{{ p.name }}</span>
          <span :class="['m-item-tag', `tag-${p.status}`]">{{ statusLabel(p.status) }}</span>
        </div>
        <div class="m-item-row">
          <IconSvg name="location" :size="13" color="#999" />
          <span>{{ p.location }}</span>
        </div>
        <div class="m-item-row">
          <IconSvg name="profile" :size="13" color="#999" />
          <span>{{ p.manager }}</span>
        </div>
        <div class="m-item-row">
          <IconSvg name="calendar" :size="13" color="#999" />
          <span>{{ p.start_date }} ~ {{ p.end_date }} · {{ duration(p) }} 天</span>
        </div>
        <div class="m-item-bottom">
          <span>预算 <strong>{{ p.total_budget?.toLocaleString() || 0 }}</strong> 万</span>
          <IconSvg name="arrow-right" :size="14" color="#999" />
        </div>
      </div>
      <div v-if="filtered.length === 0" class="m-empty">暂无项目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProjects } from '../../api'
import IconSvg from '../../components/IconSvg.vue'

const projects = ref([])
const keyword = ref('')
const filter = ref('all')

onMounted(async () => { projects.value = await getProjects().catch(() => []) })

const filtered = computed(() => {
  return projects.value.filter(p => {
    if (filter.value !== 'all' && p.status !== filter.value) return false
    if (keyword.value) {
      const k = keyword.value.toLowerCase()
      return (p.name || '').toLowerCase().includes(k)
        || (p.location || '').toLowerCase().includes(k)
        || (p.manager || '').toLowerCase().includes(k)
    }
    return true
  })
})

function statusLabel(s) { return { planning: '计划中', in_progress: '进行中', completed: '已完成', suspended: '已暂停' }[s] || s }
function duration(p) {
  if (!p.start_date || !p.end_date) return '-'
  return Math.ceil((new Date(p.end_date) - new Date(p.start_date)) / 86400000)
}
</script>

<style scoped>
.m-search {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
}
.m-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #1a1a1a;
}
.m-search input::placeholder { color: #999; }

.m-tabs { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; }
.m-tab {
  padding: 6px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.m-tab.active { background: #1a1a1a; color: #fff; }

.m-list { display: flex; flex-direction: column; gap: 8px; }
.m-item {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.m-item:active { opacity: 0.6; }
.m-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.m-item-name { font-weight: 500; color: #1a1a1a; flex: 1; font-size: 14px; }
.m-item-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
  margin-left: 8px;
  flex-shrink: 0;
}
.tag-planning { background: #e8f3ff; color: #1e6fd0; }
.tag-in_progress { background: #e6f7ec; color: #16a34a; }
.tag-completed { background: #f0f0f0; color: #999; }
.tag-suspended { background: #fff3e0; color: #d97706; }

.m-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
.m-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
}
.m-item-bottom strong { color: #1a1a1a; font-weight: 600; }

.m-empty { text-align: center; color: #999; padding: 40px 0; font-size: 13px; }
</style>
