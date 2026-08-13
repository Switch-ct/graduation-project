<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="22"><OfficeBuilding /></el-icon>
        </div>
        <span class="logo-text">施工进度管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#ffffff"
        text-color="#606266"
        active-text-color="#409EFF"
        class="side-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/overdue">
          <el-icon><Warning /></el-icon>
          <span>延期管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="header-title">{{ $route.meta.title || '施工进度管理系统' }}</span>
        </div>
        <div class="header-right">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="user-name">{{ user?.real_name || user?.username }}</span>
          <el-button type="danger" text @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, Folder, User, UserFilled, Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const user = JSON.parse(localStorage.getItem('user') || 'null')
const activeMenu = computed(() => route.path)

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
  background: var(--bg-page);
}
.aside {
  background: #fff;
  border-right: 1px solid var(--border-lighter);
  box-shadow: var(--shadow-sm);
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  border-bottom: 1px solid var(--border-lighter);
}
.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409EFF, #337ECC);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.logo-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.side-menu {
  border-right: none;
}
.side-menu .el-menu-item {
  margin: 4px 12px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}
.side-menu .el-menu-item:hover {
  background: #ecf5ff;
}
.side-menu .el-menu-item.is-active {
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}
.header {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-lighter);
  padding: 0 24px;
  box-shadow: var(--shadow-sm);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-name {
  color: var(--text-regular);
  font-size: 14px;
}
.main {
  background: var(--bg-page);
  padding: 24px;
  overflow-y: auto;
}

/* 页面过渡 */
.page-enter-active {
  animation: pageIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-leave-active {
  animation: pageOut 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
</style>