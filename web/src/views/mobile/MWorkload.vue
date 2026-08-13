<template>
  <div class="m-workload">
    <div v-for="w in workload" :key="w.name" class="m-wl-card">
      <div class="m-wl-head">
        <div class="m-wl-avatar">{{ w.name?.[0] || '?' }}</div>
        <div class="m-wl-info">
          <div class="m-wl-name">{{ w.name }}</div>
          <div class="m-wl-stats">总任务 <strong>{{ w.total }}</strong> · 完成 <strong style="color:#16a34a">{{ w.completed }}</strong></div>
        </div>
      </div>
      <div class="m-wl-bar-wrap">
        <div class="m-wl-bar">
          <div class="m-wl-bar-fill" :style="{ width: w.completion_rate + '%' }"></div>
        </div>
        <span class="m-wl-bar-text">{{ w.completion_rate }}%</span>
      </div>
      <div class="m-wl-bottom">
        <div class="m-wl-stat">
          <div class="m-wl-stat-v">{{ w.in_progress }}</div>
          <div class="m-wl-stat-l">进行中</div>
        </div>
        <div class="m-wl-stat">
          <div class="m-wl-stat-v" style="color:#ee0a24">{{ w.delayed || 0 }}</div>
          <div class="m-wl-stat-l">延期</div>
        </div>
        <div class="m-wl-stat">
          <div class="m-wl-stat-v">{{ Math.round(w.avg_progress || 0) }}%</div>
          <div class="m-wl-stat-l">平均进度</div>
        </div>
      </div>
    </div>
    <div v-if="workload.length === 0" class="m-empty">暂无数据</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWorkload } from '../../api'

const workload = ref([])
onMounted(async () => {
  const data = await getWorkload().catch(() => [])
  workload.value = data
})
</script>

<style scoped>
.m-workload { display: flex; flex-direction: column; gap: 8px; }

.m-wl-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 14px;
}
.m-wl-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.m-wl-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}
.m-wl-info { flex: 1; }
.m-wl-name { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.m-wl-stats { font-size: 12px; color: #666; margin-top: 2px; }
.m-wl-stats strong { color: #1a1a1a; font-weight: 600; }

.m-wl-bar-wrap { display: flex; align-items: center; gap: 8px; }
.m-wl-bar { flex: 1; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.m-wl-bar-fill { height: 100%; background: #1a1a1a; transition: width 0.4s; }
.m-wl-bar-text { font-size: 13px; color: #1a1a1a; font-weight: 600; min-width: 40px; text-align: right; }

.m-wl-bottom { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.m-wl-stat { text-align: center; }
.m-wl-stat-v { font-size: 18px; font-weight: 700; color: #1a1a1a; }
.m-wl-stat-l { font-size: 11px; color: #999; margin-top: 2px; }

.m-empty { text-align: center; color: #999; padding: 40px 0; font-size: 13px; }
</style>
