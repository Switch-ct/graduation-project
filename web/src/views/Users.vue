<template>
  <div class="users">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">用户管理</h3>
        <span class="page-count">共 {{ users.length }} 个用户</span>
      </div>
    </div>

    <el-card shadow="hover" class="table-card">
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="real_name" label="姓名" width="160" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" effect="plain" size="small">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from '../api'

const users = ref([])

onMounted(async () => {
  users.value = await getUsers()
})
</script>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.page-count {
  font-size: 13px;
  color: var(--text-secondary);
}
.table-card {
  border-radius: 8px;
}
</style>