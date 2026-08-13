import { createRouter, createWebHistory } from 'vue-router'
import { isMobile } from '../utils/device'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  // 移动端路由
  {
    path: '/m',
    component: () => import('../views/mobile/MobileLayout.vue'),
    children: [
      { path: '', redirect: '/m/dashboard' },
      { path: 'dashboard', name: 'MDashboard', component: () => import('../views/mobile/MDashboard.vue'), meta: { title: '工作台' } },
      { path: 'projects', name: 'MProjects', component: () => import('../views/mobile/MProjects.vue'), meta: { title: '项目' } },
      { path: 'project/:id', name: 'MProjectDetail', component: () => import('../views/mobile/MProjectDetail.vue'), meta: { title: '项目详情' } },
      { path: 'tasks', name: 'MTasks', component: () => import('../views/mobile/MTasks.vue'), meta: { title: '任务' } },
      { path: 'task/:id', name: 'MTaskDetail', component: () => import('../views/mobile/MTaskDetail.vue'), meta: { title: '任务详情' } },
      { path: 'workload', name: 'MWorkload', component: () => import('../views/mobile/MWorkload.vue'), meta: { title: '工作量' } },
      { path: 'changes', name: 'MChanges', component: () => import('../views/mobile/MChanges.vue'), meta: { title: '动态' } },
      { path: 'profile', name: 'MProfile', component: () => import('../views/mobile/MProfile.vue'), meta: { title: '我的' } },
      { path: 'overdue', name: 'MOverdue', component: () => import('../views/mobile/MOverdue.vue'), meta: { title: '延期管理' } },
    ],
  },
  // 电脑端路由
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'projects', name: 'Projects', component: () => import('../views/Projects.vue'), meta: { title: '项目管理' } },
      { path: 'project/:id', name: 'ProjectDetail', component: () => import('../views/ProjectDetail.vue'), meta: { title: '项目详情' } },
      { path: 'gantt/:id', name: 'GanttChart', component: () => import('../views/GanttChart.vue'), meta: { title: '甘特图' } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'overdue', name: 'OverdueList', component: () => import('../views/OverdueList.vue'), meta: { title: '延期管理' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const forceDesktop = localStorage.getItem('forceDesktop') === '1'

  if (to.path !== '/login' && !token) {
    return next('/login')
  }

  // 设备判断：移动端访问电脑端路径自动跳转
  if (to.path === '/login' || to.path.startsWith('/m')) {
    return next()
  }
  // 电脑端路径（/dashboard, /projects 等）
  if (!forceDesktop && isMobile() && to.path !== '/login') {
    return next('/m/dashboard')
  }

  next()
})

export default router
