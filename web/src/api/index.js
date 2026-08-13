import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  // 优先使用环境变量，部署时设置 VITE_API_URL
  // 本地开发时 fallback 到 localhost:3000
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.message || '请求失败'
    ElMessage.error(msg)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// 项目
export const getProjects = () => api.get('/projects')
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

// 任务
export const getTask = (id) => api.get(`/tasks/${id}`)
export const getTasks = (projectId) => api.get(`/tasks/project/${projectId}`)
export const getTasksFlat = (projectId) => api.get(`/tasks/flat/${projectId}`)
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
export const getTaskStats = (projectId) => api.get(`/tasks/stats/${projectId}`)

// 用户
export const getUsers = () => api.get('/users')

// 评论
export const getComments = (taskId) => api.get(`/comments/task/${taskId}`)
export const addComment = (data) => api.post('/comments', data)
export const deleteComment = (id) => api.delete(`/comments/${id}`)

// 附件
export const getAttachments = (taskId) => api.get(`/attachments/task/${taskId}`)
export const uploadAttachment = (data) => api.post('/attachments', data)
export const downloadAttachment = (id) => api.get(`/attachments/${id}/download`)
export const deleteAttachment = (id) => api.delete(`/attachments/${id}`)

// 变更日志
export const getChangeLogs = (entityType, entityId) => api.get(`/changelogs/${entityType}/${entityId}`)
export const getChangelogsByTask = (taskId) => api.get(`/changelogs/task/${taskId}`)
export const getChangelogs = (limit = 20) => api.get(`/changelogs?limit=${limit}`)
export const getRecentChangeLogs = (limit = 20) => api.get(`/changelogs?limit=${limit}`)

// 统计
export const getCriticalPath = (projectId) => api.get(`/stats/critical-path/project/${projectId}`)
export const getOverdue = (projectId) => api.get(`/stats/overdue/project/${projectId}`)
export const getAllOverdue = () => api.get('/stats/overdue/all')
export const getWorkload = () => api.get('/stats/workload')
export const getDashboardStats = () => api.get('/stats/dashboard')

export default api