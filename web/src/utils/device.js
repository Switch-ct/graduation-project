// 移动端入口：先判断设备跳转
// 在路由 beforeEach 里判断
import { useRouter } from 'vue-router'

export function isMobile() {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768
}
