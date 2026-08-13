<template>
  <div class="m-layout">
    <header class="m-header">
      <span class="m-header-side m-back-btn" @click="goBack" v-if="showBack">
        <IconSvg name="arrow-left" :size="22" />
      </span>
      <span class="m-header-side" v-else></span>
      <h1 class="m-title">{{ title }}</h1>
      <span class="m-header-side m-exit-btn" @click="logout" v-if="!showBack">
        <IconSvg name="logout" :size="20" />
      </span>
      <span class="m-header-side" v-else></span>
    </header>

    <main class="m-main">
      <router-view />
    </main>

    <nav class="m-tabbar" v-if="showTabbar">
      <router-link to="/m/dashboard" class="m-tab">
        <IconSvg name="dashboard" :size="22" />
        <span>工作台</span>
      </router-link>
      <router-link to="/m/projects" class="m-tab">
        <IconSvg name="projects" :size="22" />
        <span>项目</span>
      </router-link>
      <router-link to="/m/tasks" class="m-tab">
        <IconSvg name="tasks" :size="22" />
        <span>任务</span>
      </router-link>
      <router-link to="/m/profile" class="m-tab">
        <IconSvg name="profile" :size="22" />
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import IconSvg from '../../components/IconSvg.vue'

const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta?.title || '施工进度')
const showTabbar = computed(() => ['/m/dashboard', '/m/projects', '/m/tasks', '/m/profile'].includes(route.path))
const showBack = computed(() => !showTabbar.value && route.path !== '/m/dashboard')

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/m/dashboard')
}

async function logout() {
  try {
    await showConfirmDialog({ title: '提示', message: '确认退出登录？' })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  } catch {}
}
</script>

<style scoped>
/* ========== 白底黑字 移动端布局 ========== */
.m-layout {
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a1a;
}
/* 顶部 Header —— z-index 提高，避免被 .van-grid 遮挡 */
.m-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  background: #ffffff;
  color: #1a1a1a;
  border-bottom: 1px solid #eaeaea;
  position: sticky;
  top: 0;
  z-index: 1000;  /* 关键：比 .van-grid 的 1/2 高 */
  box-shadow: 0 1px 0 rgba(0,0,0,0.02);
}
.m-title { font-size: 16px; font-weight: 600; margin: 0; flex: 1; text-align: center; color: #1a1a1a; }
.m-header-side { width: 40px; height: 32px; display: flex; align-items: center; justify-content: center; }
.m-back-btn, .m-exit-btn { cursor: pointer; color: #1a1a1a; }
.m-back-btn:active, .m-exit-btn:active { opacity: 0.6; }

.m-main { padding: 12px; padding-bottom: 70px; min-height: calc(100vh - 48px); }

/* 底部 Tabbar —— 白底黑字 */
.m-tabbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  height: 56px;
  background: #ffffff;
  border-top: 1px solid #eaeaea;
  z-index: 1000;
}
.m-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #666666;
  font-size: 11px;
  gap: 2px;
}
.m-tab.router-link-active { color: #1a1a1a; font-weight: 600; }
.m-tab.router-link-active :deep(.svg-icon) { color: #1a1a1a; }
</style>

<style>
/* 全局：让 van-sticky 也能正确显示 */
.van-sticky { z-index: 10 !important; }
</style>
