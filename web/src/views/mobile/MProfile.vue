<template>
  <div class="m-profile">
    <div class="m-profile-card">
      <el-avatar :size="88" class="m-avatar">
        <el-icon :size="44"><UserFilled /></el-icon>
      </el-avatar>
      <div class="m-name">{{ user.real_name || user.username }}</div>
      <div class="m-role">{{ user.role === 'admin' ? '管理员' : '项目成员' }}</div>
    </div>

    <div class="m-section">
      <div class="m-item" @click="$router.push('/m/changes')">
        <IconSvg name="doc" :size="20" color="#1a1a1a" />
        <span class="m-item-text">最新动态</span>
        <IconSvg name="arrow-right" :size="14" color="#ccc" />
      </div>
      <div class="m-item" @click="$router.push('/m/workload')">
        <IconSvg name="chart" :size="20" color="#1a1a1a" />
        <span class="m-item-text">工作量统计</span>
        <IconSvg name="arrow-right" :size="14" color="#ccc" />
      </div>
      <div class="m-item" @click="$router.push('/m/overdue')">
        <IconSvg name="warning" :size="20" color="#ee0a24" />
        <span class="m-item-text" style="color:#ee0a24">延期管理</span>
        <IconSvg name="arrow-right" :size="14" color="#ccc" />
      </div>
    </div>

    <div class="m-section">
      <div class="m-item" @click="switchToDesktop">
        <IconSvg name="desktop" :size="20" color="#1a1a1a" />
        <span class="m-item-text">切换到电脑版</span>
        <IconSvg name="arrow-right" :size="14" color="#ccc" />
      </div>
      <div class="m-item" @click="logout">
        <IconSvg name="logout" :size="20" color="#ee0a24" />
        <span class="m-item-text" style="color:#ee0a24">退出登录</span>
        <IconSvg name="arrow-right" :size="14" color="#ccc" />
      </div>
    </div>

    <div class="m-footer">
      <div class="m-footer-title">基于 Web 技术的工程项目施工进度管理系统</div>
      <div class="m-footer-sub">v1.0 · 龙超滔 · 2026</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { UserFilled } from '@element-plus/icons-vue'
import IconSvg from '../../components/IconSvg.vue'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

function switchToDesktop() {
  localStorage.setItem('forceDesktop', '1')
  window.location.href = '/dashboard'
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
.m-profile { display: flex; flex-direction: column; gap: 12px; }

.m-profile-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
}
.m-avatar { background: #f5f5f5; }
.m-name { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-top: 12px; }
.m-role { font-size: 12px; color: #999; margin-top: 4px; }

.m-section {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
}
/* 关键：列表项 = flex 左右结构，文字占中间，箭头在右 */
.m-item {
  display: flex;
  align-items: center;
  flex-direction: row;          /* 左右结构 */
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
  text-align: left;             /* 关键：取消居中 */
}
.m-item:last-child { border-bottom: none; }
.m-item:active { background: #f9f9f9; }
.m-item-text { flex: 1; }

.m-footer { text-align: center; padding: 20px 0; }
.m-footer-title { font-size: 12px; color: #999; }
.m-footer-sub { font-size: 11px; color: #ccc; margin-top: 4px; }
</style>
