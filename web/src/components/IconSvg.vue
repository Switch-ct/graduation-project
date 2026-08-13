<template>
  <component :is="tag" :class="['svg-icon', `icon-${name}`, spin && 'is-spin']" :style="style">
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <!-- 工作台/首页 -->
      <template v-if="name === 'dashboard'">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </template>
      <!-- 项目/文件夹 -->
      <template v-else-if="name === 'projects'">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M3 10h18" />
      </template>
      <!-- 任务/列表 -->
      <template v-else-if="name === 'tasks'">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" />
        <circle cx="5.5" cy="9" r="0.6" fill="currentColor" />
        <circle cx="5.5" cy="13" r="0.6" fill="currentColor" />
        <circle cx="5.5" cy="17" r="0.6" fill="currentColor" />
      </template>
      <!-- 我的/用户 -->
      <template v-else-if="name === 'profile'">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </template>
      <!-- 返回箭头 -->
      <template v-else-if="name === 'arrow-left'">
        <path d="M15 6l-6 6 6 6" />
      </template>
      <!-- 位置 -->
      <template v-else-if="name === 'location'">
        <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </template>
      <!-- 日历 -->
      <template v-else-if="name === 'calendar'">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </template>
      <!-- 钱/预算 -->
      <template v-else-if="name === 'money'">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9h.01M18 15h.01" />
      </template>
      <!-- 警告 -->
      <template v-else-if="name === 'warning'">
        <path d="M12 3l10 18H2L12 3z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="18" r="0.6" fill="currentColor" />
      </template>
      <!-- 时钟 -->
      <template v-else-if="name === 'clock'">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </template>
      <!-- 聊天/评论 -->
      <template v-else-if="name === 'comment'">
        <path d="M21 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4z" />
      </template>
      <!-- 附件/回形针 -->
      <template v-else-if="name === 'attachment'">
        <path d="M21 11.5l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />
      </template>
      <!-- 文档/动态 -->
      <template v-else-if="name === 'doc'">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
        <path d="M14 3v6h6" />
        <path d="M9 13h6M9 17h4" />
      </template>
      <!-- 统计/柱状图 -->
      <template v-else-if="name === 'chart'">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </template>
      <!-- 灯泡 -->
      <template v-else-if="name === 'bulb'">
        <path d="M9 18h6M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
      </template>
      <!-- 电脑/显示器 -->
      <template v-else-if="name === 'desktop'">
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </template>
      <!-- 信息 -->
      <template v-else-if="name === 'info'">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.01M11 12h1v5h1" />
      </template>
      <!-- 退出/X -->
      <template v-else-if="name === 'logout'">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </template>
      <!-- 关闭 -->
      <template v-else-if="name === 'close'">
        <path d="M6 6l12 12M18 6L6 18" />
      </template>
      <!-- 加载/loading -->
      <template v-else-if="name === 'loading'">
        <path d="M21 12a9 9 0 1 1-6.2-8.5" />
      </template>
      <!-- 搜索 -->
      <template v-else-if="name === 'search'">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </template>
      <!-- 右箭头 -->
      <template v-else-if="name === 'arrow-right'">
        <path d="M9 6l6 6-6 6" />
      </template>
      <!-- 趋势 -->
      <template v-else-if="name === 'trend'">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </template>
      <!-- 默认 fallback -->
      <template v-else>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9h.01M15 9h.01M9 15h6" />
      </template>
    </svg>
  </component>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: '' },
  spin: { type: Boolean, default: false },
  tag: { type: String, default: 'span' },
})
const style = computed(() => {
  const s = { fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size, lineHeight: 1 }
  if (props.color) s.color = props.color
  return s
})
</script>

<style scoped>
.svg-icon { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; }
.svg-icon svg { display: block; }
.svg-icon.is-spin svg { animation: spin 1s linear infinite; transform-origin: center; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
