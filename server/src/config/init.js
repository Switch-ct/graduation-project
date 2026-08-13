const bcrypt = require('bcryptjs');
const db = require('./db');

async function init() {
  // PostgreSQL: 用 SERIAL 主键，BOOLEAN 等类型不同
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      total_budget REAL,
      manager TEXT,
      description TEXT,
      status TEXT DEFAULT 'planning',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      parent_id INTEGER,
      wbs_code TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      duration INTEGER,
      progress INTEGER DEFAULT 0,
      assignee TEXT,
      status TEXT DEFAULT 'pending',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 任务评论表
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 任务附件表
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploader_id INTEGER REFERENCES users(id),
      uploader_name TEXT,
      -- 用 TEXT 存 base64 简单演示（生产环境应该存文件路径或对象存储 URL）
      file_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 变更日志表
    CREATE TABLE IF NOT EXISTS change_logs (
      id SERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,  -- 'project' / 'task' / 'user'
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,       -- 'create' / 'update' / 'delete'
      field_name TEXT,            -- 被修改的字段
      old_value TEXT,
      new_value TEXT,
      operator_id INTEGER REFERENCES users(id),
      operator_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
  `);

  // 检查是否已有数据
  const r = await db.query('SELECT COUNT(*) as cnt FROM users');
  if (parseInt(r.rows[0].cnt) > 0) return;

  const hash = bcrypt.hashSync('admin123', 10);

  // 用户
  const users = [
    ['admin', '系统管理员', 'admin'],
    ['zhangong', '张工', 'user'],
    ['ligong', '李工', 'user'],
    ['wangong', '王工', 'user'],
    ['zhaogong', '赵工', 'user'],
    ['chengong', '陈工', 'user'],
    ['liugong', '刘工', 'user'],
    ['huanggong', '黄工', 'user'],
    ['zhougong', '周工', 'user'],
    ['wugong', '吴工', 'user'],
    ['zhenggong', '郑工', 'user'],
  ];
  for (const [u, name, role] of users) {
    await db.query('INSERT INTO users (username, password, real_name, role) VALUES ($1, $2, $3, $4)', [u, hash, name, role]);
  }

  const insertProject = async (name, location, start, end, budget, manager, desc, status) => {
    const r = await db.query(
      'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [name, location, start, end, budget, manager, desc, status]
    );
    return r.rows[0].id;
  };

  const insertTask = async (pid, parentId, wbs, name, start, end, duration, progress, assignee, status) => {
    const r = await db.query(
      'INSERT INTO tasks (project_id, parent_id, wbs_code, name, start_date, end_date, duration, progress, assignee, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [pid, parentId, wbs, name, start, end, duration, progress, assignee, status]
    );
    return r.rows[0].id;
  };

  // 项目1: 京投大厦
  const p1 = await insertProject('京投大厦建设项目', '北京市朝阳区', '2026-03-01', '2027-06-30', 8500, '张工', '京投大厦为综合性商业办公建筑，总建筑面积约5.2万平方米，地下3层，地上22层。', 'in_progress');
  let t = await insertTask(p1, null, '1', '施工准备阶段', '2026-03-01', '2026-04-15', 46, 100, '张工', 'completed');
  await insertTask(p1, t, '1.1', '场地平整', '2026-03-01', '2026-03-15', 15, 100, '张工', 'completed');
  await insertTask(p1, t, '1.2', '临时设施搭建', '2026-03-10', '2026-03-25', 16, 100, '张工', 'completed');
  await insertTask(p1, t, '1.3', '施工图纸会审', '2026-03-20', '2026-04-05', 17, 100, '张工', 'completed');
  await insertTask(p1, t, '1.4', '材料设备进场', '2026-04-01', '2026-04-15', 15, 100, '张工', 'completed');
  t = await insertTask(p1, null, '2', '地基与基础工程', '2026-04-16', '2026-07-15', 91, 85, '李工', 'in_progress');
  await insertTask(p1, t, '2.1', '土方开挖', '2026-04-16', '2026-05-10', 25, 100, '李工', 'completed');
  await insertTask(p1, t, '2.2', '基坑支护', '2026-04-20', '2026-05-20', 31, 100, '李工', 'completed');
  await insertTask(p1, t, '2.3', '桩基础施工', '2026-05-15', '2026-06-20', 37, 100, '李工', 'completed');
  await insertTask(p1, t, '2.4', '地下室结构', '2026-06-15', '2026-07-15', 31, 50, '李工', 'in_progress');
  t = await insertTask(p1, null, '3', '主体结构工程', '2026-07-16', '2027-01-31', 200, 0, '王工', 'pending');
  await insertTask(p1, t, '3.1', '1-5层结构施工', '2026-07-16', '2026-09-30', 77, 0, '王工', 'pending');
  await insertTask(p1, t, '3.2', '6-12层结构施工', '2026-10-01', '2026-11-30', 61, 0, '王工', 'pending');
  await insertTask(p1, t, '3.3', '13-22层结构施工', '2026-12-01', '2027-01-31', 62, 0, '王工', 'pending');
  t = await insertTask(p1, null, '4', '装饰装修工程', '2027-02-01', '2027-05-15', 104, 0, '赵工', 'pending');
  await insertTask(p1, t, '4.1', '外墙装饰', '2027-02-01', '2027-03-31', 59, 0, '赵工', 'pending');
  await insertTask(p1, t, '4.2', '室内装修', '2027-03-01', '2027-05-01', 62, 0, '赵工', 'pending');
  await insertTask(p1, t, '4.3', '机电安装', '2027-02-15', '2027-05-15', 90, 0, '赵工', 'pending');
  await insertTask(p1, null, '5', '竣工验收', '2027-05-16', '2027-06-30', 46, 0, '张工', 'pending');

  // 项目2: 天河商业广场
  const p2 = await insertProject('天河商业广场项目', '广州市天河区', '2025-09-01', '2027-03-31', 12000, '陈工', '大型商业综合体，总建筑面积约8.6万平方米，地下4层，地上28层。', 'in_progress');
  t = await insertTask(p2, null, '1', '施工准备', '2025-09-01', '2025-10-15', 45, 100, '陈工', 'completed');
  await insertTask(p2, t, '1.1', '场地清理与三通一平', '2025-09-01', '2025-09-20', 20, 100, '陈工', 'completed');
  await insertTask(p2, t, '1.2', '临时设施搭建', '2025-09-15', '2025-10-05', 21, 100, '陈工', 'completed');
  await insertTask(p2, t, '1.3', '施工组织设计编制', '2025-09-20', '2025-10-10', 21, 100, '陈工', 'completed');
  await insertTask(p2, t, '1.4', '图纸会审与技术交底', '2025-10-01', '2025-10-15', 15, 100, '陈工', 'completed');
  t = await insertTask(p2, null, '2', '基坑及基础工程', '2025-10-16', '2026-02-28', 136, 100, '陈工', 'completed');
  await insertTask(p2, t, '2.1', '土方开挖', '2025-10-16', '2025-11-15', 31, 100, '陈工', 'completed');
  await insertTask(p2, t, '2.2', '基坑支护', '2025-10-20', '2025-12-10', 52, 100, '陈工', 'completed');
  await insertTask(p2, t, '2.3', '桩基施工', '2025-11-15', '2026-01-15', 62, 100, '陈工', 'completed');
  await insertTask(p2, t, '2.4', '地下室底板施工', '2026-01-10', '2026-02-15', 37, 100, '陈工', 'completed');
  await insertTask(p2, t, '2.5', '地下室结构施工', '2026-02-01', '2026-02-28', 28, 100, '陈工', 'completed');
  t = await insertTask(p2, null, '3', '主体结构工程', '2026-03-01', '2026-10-31', 245, 55, '陈工', 'in_progress');
  await insertTask(p2, t, '3.1', '1-7层结构施工', '2026-03-01', '2026-05-31', 92, 100, '陈工', 'completed');
  await insertTask(p2, t, '3.2', '8-15层结构施工', '2026-06-01', '2026-08-15', 76, 60, '陈工', 'in_progress');
  await insertTask(p2, t, '3.3', '16-22层结构施工', '2026-08-16', '2026-10-15', 61, 0, '陈工', 'pending');
  await insertTask(p2, t, '3.4', '23-28层结构施工', '2026-10-01', '2026-10-31', 31, 0, '陈工', 'pending');
  await insertTask(p2, t, '3.5', '屋面结构施工', '2026-10-15', '2026-10-31', 17, 0, '陈工', 'pending');
  t = await insertTask(p2, null, '4', '砌体及二次结构', '2026-06-01', '2026-12-31', 214, 25, '陈工', 'in_progress');
  await insertTask(p2, t, '4.1', '1-7层砌体施工', '2026-06-01', '2026-07-31', 61, 100, '陈工', 'completed');
  await insertTask(p2, t, '4.2', '8-15层砌体施工', '2026-08-01', '2026-10-15', 76, 20, '陈工', 'in_progress');
  await insertTask(p2, t, '4.3', '16-28层砌体施工', '2026-10-16', '2026-12-31', 77, 0, '陈工', 'pending');
  t = await insertTask(p2, null, '5', '机电安装工程', '2026-08-01', '2027-01-31', 184, 10, '陈工', 'in_progress');
  await insertTask(p2, t, '5.1', '给排水管道安装', '2026-08-01', '2026-10-31', 92, 20, '陈工', 'in_progress');
  await insertTask(p2, t, '5.2', '电气系统安装', '2026-09-01', '2026-12-31', 122, 5, '陈工', 'in_progress');
  await insertTask(p2, t, '5.3', '暖通空调安装', '2026-10-01', '2027-01-15', 107, 0, '陈工', 'pending');
  await insertTask(p2, t, '5.4', '消防系统安装', '2026-10-15', '2027-01-31', 109, 0, '陈工', 'pending');
  await insertTask(p2, t, '5.5', '电梯安装', '2026-12-01', '2027-01-31', 62, 0, '陈工', 'pending');
  await insertTask(p2, null, '6', '装饰装修工程', '2027-01-01', '2027-03-15', 74, 0, '陈工', 'pending');
  await insertTask(p2, null, '7', '室外工程及竣工验收', '2027-03-01', '2027-03-31', 31, 0, '陈工', 'pending');

  // 项目3: 南沙港区物流中心
  const p3 = await insertProject('南沙港区物流中心', '广州市南沙区', '2026-01-15', '2027-09-30', 6500, '刘工', '现代化物流仓储中心，总建筑面积约4.2万平方米。', 'in_progress');
  t = await insertTask(p3, null, '1', '施工准备', '2026-01-15', '2026-02-28', 45, 100, '刘工', 'completed');
  await insertTask(p3, t, '1.1', '场地清表与平整', '2026-01-15', '2026-02-05', 22, 100, '刘工', 'completed');
  await insertTask(p3, t, '1.2', '临时道路及设施', '2026-02-01', '2026-02-20', 20, 100, '刘工', 'completed');
  await insertTask(p3, t, '1.3', '施工图深化设计', '2026-02-10', '2026-02-28', 19, 100, '刘工', 'completed');
  t = await insertTask(p3, null, '2', '地基处理与基础', '2026-03-01', '2026-05-31', 92, 90, '刘工', 'in_progress');
  await insertTask(p3, t, '2.1', '地基强夯处理', '2026-03-01', '2026-03-20', 20, 100, '刘工', 'completed');
  await insertTask(p3, t, '2.2', '独立基础施工', '2026-03-15', '2026-04-30', 47, 100, '刘工', 'completed');
  await insertTask(p3, t, '2.3', '地梁及承台施工', '2026-04-15', '2026-05-15', 31, 80, '刘工', 'in_progress');
  await insertTask(p3, t, '2.4', '基础验收', '2026-05-16', '2026-05-31', 16, 0, '刘工', 'pending');
  t = await insertTask(p3, null, '3', '钢结构主体', '2026-06-01', '2026-10-31', 153, 5, '刘工', 'in_progress');
  await insertTask(p3, t, '3.1', '钢柱安装', '2026-06-01', '2026-07-15', 45, 15, '刘工', 'in_progress');
  await insertTask(p3, t, '3.2', '钢梁及檩条安装', '2026-07-01', '2026-08-31', 62, 0, '刘工', 'pending');
  await insertTask(p3, t, '3.3', '屋面板安装', '2026-08-15', '2026-09-30', 47, 0, '刘工', 'pending');
  await insertTask(p3, t, '3.4', '墙面板安装', '2026-09-01', '2026-10-31', 61, 0, '刘工', 'pending');
  await insertTask(p3, null, '4', '仓库地面及配套', '2026-10-01', '2027-01-31', 123, 0, '刘工', 'pending');
  await insertTask(p3, null, '5', '办公楼及附属设施', '2026-11-01', '2027-04-30', 181, 0, '刘工', 'pending');
  await insertTask(p3, null, '6', '室外工程', '2027-03-01', '2027-07-31', 153, 0, '刘工', 'pending');
  await insertTask(p3, null, '7', '竣工验收', '2027-08-01', '2027-09-30', 61, 0, '刘工', 'pending');

  // 项目4: 珠江新城住宅小区二期
  const p4 = await insertProject('珠江新城住宅小区（二期）', '广州市天河区珠江新城', '2025-06-01', '2027-12-31', 18500, '黄工', '高端住宅小区，总建筑面积约12万平方米。', 'in_progress');
  t = await insertTask(p4, null, '1', '施工准备阶段', '2025-06-01', '2025-07-15', 45, 100, '黄工', 'completed');
  await insertTask(p4, t, '1.1', '场地围蔽及清表', '2025-06-01', '2025-06-20', 20, 100, '黄工', 'completed');
  await insertTask(p4, t, '1.2', '临时设施搭建', '2025-06-15', '2025-07-05', 21, 100, '黄工', 'completed');
  await insertTask(p4, t, '1.3', '施工组织设计', '2025-06-20', '2025-07-15', 26, 100, '黄工', 'completed');
  t = await insertTask(p4, null, '2', '桩基及基坑工程', '2025-07-16', '2025-11-30', 138, 100, '黄工', 'completed');
  await insertTask(p4, t, '2.1', '支护桩施工', '2025-07-16', '2025-08-31', 47, 100, '黄工', 'completed');
  await insertTask(p4, t, '2.2', '土方开挖', '2025-09-01', '2025-10-15', 45, 100, '黄工', 'completed');
  await insertTask(p4, t, '2.3', '工程桩施工', '2025-09-15', '2025-11-15', 62, 100, '黄工', 'completed');
  await insertTask(p4, t, '2.4', '桩基检测', '2025-11-16', '2025-11-30', 15, 100, '黄工', 'completed');
  t = await insertTask(p4, null, '3', '地下室结构', '2025-12-01', '2026-03-31', 121, 100, '黄工', 'completed');
  await insertTask(p4, t, '3.1', '底板施工', '2025-12-01', '2025-12-31', 31, 100, '黄工', 'completed');
  await insertTask(p4, t, '3.2', 'B2层结构', '2026-01-01', '2026-01-31', 31, 100, '黄工', 'completed');
  await insertTask(p4, t, '3.3', 'B1层结构', '2026-02-01', '2026-02-28', 28, 100, '黄工', 'completed');
  await insertTask(p4, t, '3.4', '地下室顶板', '2026-03-01', '2026-03-31', 31, 100, '黄工', 'completed');
  t = await insertTask(p4, null, '4', '主体结构工程', '2026-04-01', '2027-01-31', 306, 35, '黄工', 'in_progress');
  await insertTask(p4, t, '4.1', '1#-2#楼（1-15层）', '2026-04-01', '2026-07-31', 122, 100, '黄工', 'completed');
  await insertTask(p4, t, '4.2', '3#-4#楼（1-15层）', '2026-06-01', '2026-09-30', 122, 70, '黄工', 'in_progress');
  await insertTask(p4, t, '4.3', '5#-6#楼（1-15层）', '2026-08-01', '2026-11-30', 122, 20, '黄工', 'in_progress');
  await insertTask(p4, t, '4.4', '7#-8#楼（1-15层）', '2026-10-01', '2027-01-31', 123, 0, '黄工', 'pending');
  t = await insertTask(p4, null, '5', '砌体及装修', '2026-08-01', '2027-06-30', 334, 10, '黄工', 'in_progress');
  await insertTask(p4, t, '5.1', '1#-2#楼砌体', '2026-08-01', '2026-10-31', 92, 80, '黄工', 'in_progress');
  await insertTask(p4, t, '5.2', '3#-4#楼砌体', '2026-10-01', '2026-12-31', 92, 0, '黄工', 'pending');
  await insertTask(p4, t, '5.3', '5#-8#楼砌体', '2027-01-01', '2027-03-31', 90, 0, '黄工', 'pending');
  await insertTask(p4, t, '5.4', '内外墙抹灰', '2027-02-01', '2027-05-31', 120, 0, '黄工', 'pending');
  await insertTask(p4, t, '5.5', '精装修施工', '2027-04-01', '2027-06-30', 91, 0, '黄工', 'pending');
  await insertTask(p4, null, '6', '机电安装', '2027-01-01', '2027-08-31', 243, 0, '黄工', 'pending');
  await insertTask(p4, null, '7', '室外及景观工程', '2027-06-01', '2027-10-31', 153, 0, '黄工', 'pending');
  await insertTask(p4, null, '8', '竣工验收', '2027-11-01', '2027-12-31', 61, 0, '黄工', 'pending');

  // 项目5: 白云区实验中学 (已完成)
  const p5 = await insertProject('白云区实验中学教学楼', '广州市白云区', '2024-03-01', '2025-08-31', 3200, '周工', '6层教学楼及配套实验楼，总建筑面积约1.8万平方米。', 'completed');
  t = await insertTask(p5, null, '1', '施工准备', '2024-03-01', '2024-04-15', 46, 100, '周工', 'completed');
  await insertTask(p5, t, '1.1', '场地清理', '2024-03-01', '2024-03-15', 15, 100, '周工', 'completed');
  await insertTask(p5, t, '1.2', '临时设施', '2024-03-10', '2024-04-05', 27, 100, '周工', 'completed');
  await insertTask(p5, t, '1.3', '施工组织设计', '2024-03-20', '2024-04-15', 27, 100, '周工', 'completed');
  t = await insertTask(p5, null, '2', '基础工程', '2024-04-16', '2024-07-15', 91, 100, '周工', 'completed');
  await insertTask(p5, t, '2.1', '土方开挖', '2024-04-16', '2024-05-10', 25, 100, '周工', 'completed');
  await insertTask(p5, t, '2.2', '基础垫层', '2024-05-01', '2024-05-20', 20, 100, '周工', 'completed');
  await insertTask(p5, t, '2.3', '独立基础施工', '2024-05-15', '2024-06-30', 47, 100, '周工', 'completed');
  await insertTask(p5, t, '2.4', '基础验收', '2024-07-01', '2024-07-15', 15, 100, '周工', 'completed');
  t = await insertTask(p5, null, '3', '主体结构', '2024-07-16', '2025-01-31', 200, 100, '周工', 'completed');
  await insertTask(p5, t, '3.1', '1-2层结构', '2024-07-16', '2024-09-15', 62, 100, '周工', 'completed');
  await insertTask(p5, t, '3.2', '3-4层结构', '2024-09-16', '2024-11-15', 61, 100, '周工', 'completed');
  await insertTask(p5, t, '3.3', '5-6层结构', '2024-11-16', '2025-01-15', 61, 100, '周工', 'completed');
  await insertTask(p5, t, '3.4', '屋面结构', '2025-01-16', '2025-01-31', 16, 100, '周工', 'completed');
  await insertTask(p5, null, '4', '装饰装修', '2025-02-01', '2025-05-31', 120, 100, '周工', 'completed');
  await insertTask(p5, null, '5', '机电安装', '2025-03-01', '2025-06-30', 122, 100, '周工', 'completed');
  await insertTask(p5, null, '6', '室外工程', '2025-06-01', '2025-08-15', 76, 100, '周工', 'completed');
  await insertTask(p5, null, '7', '竣工验收', '2025-08-16', '2025-08-31', 16, 100, '周工', 'completed');

  // 项目6: 黄埔区地铁上盖 (计划中)
  await insertProject('黄埔区地铁上盖综合体', '广州市黄埔区', '2026-10-01', '2028-12-31', 22000, '吴工', '地铁上盖TOD项目，总建筑面积约15万平方米。', 'planning');

  // 项目7: 番禺区旧改安置房 (已暂停)
  const p7 = await insertProject('番禺区旧改安置房项目', '广州市番禺区', '2025-11-01', '2027-06-30', 9800, '郑工', '旧村改造安置房项目，总建筑面积约7.5万平方米。', 'suspended');
  t = await insertTask(p7, null, '1', '施工准备', '2025-11-01', '2025-12-31', 61, 100, '郑工', 'completed');
  await insertTask(p7, t, '1.1', '场地测绘', '2025-11-01', '2025-11-20', 20, 100, '郑工', 'completed');
  await insertTask(p7, t, '1.2', '临时设施搭建', '2025-11-15', '2025-12-15', 31, 100, '郑工', 'completed');
  await insertTask(p7, t, '1.3', '施工许可证办理', '2025-12-01', '2025-12-31', 31, 100, '郑工', 'completed');
  t = await insertTask(p7, null, '2', '桩基工程', '2026-01-01', '2026-03-31', 90, 40, '郑工', 'delayed');
  await insertTask(p7, t, '2.1', '试桩施工', '2026-01-01', '2026-01-31', 31, 100, '郑工', 'completed');
  await insertTask(p7, t, '2.2', '工程桩施工（1#-6#）', '2026-02-01', '2026-03-15', 43, 60, '郑工', 'delayed');
  await insertTask(p7, t, '2.3', '工程桩施工（7#-12#）', '2026-03-01', '2026-03-31', 31, 0, '郑工', 'delayed');
  await insertTask(p7, null, '3', '土方及基坑', '2026-04-01', '2026-05-31', 61, 0, '郑工', 'delayed');
  await insertTask(p7, null, '4', '基础及地下室', '2026-06-01', '2026-08-31', 92, 0, '郑工', 'delayed');
  await insertTask(p7, null, '5', '主体结构', '2026-09-01', '2027-04-30', 242, 0, '郑工', 'delayed');
  await insertTask(p7, null, '6', '装饰装修', '2027-05-01', '2027-06-30', 61, 0, '郑工', 'delayed');

  // 一些种子评论（让前端有数据展示）
  const allTasks = (await db.query('SELECT id, name FROM tasks LIMIT 5')).rows;
  if (allTasks.length > 0) {
    const samples = [
      ['进度正常推进中', '管理员'],
      ['现场材料已到位，可以继续', '张工'],
      ['等待设计院图纸确认', '李工'],
    ];
    for (let i = 0; i < allTasks.length; i++) {
      const t = allTasks[i];
      const [content, name] = samples[i % samples.length];
      await db.query(
        'INSERT INTO comments (task_id, user_name, content) VALUES ($1, $2, $3)',
        [t.id, name, content]
      );
    }
  }

  // 一些种子变更日志
  await db.query(
    `INSERT INTO change_logs (entity_type, entity_id, action, field_name, new_value, operator_name)
     VALUES
       ('project', 1, 'create', null, '京投大厦建设项目已创建', '系统'),
       ('project', 2, 'create', null, '天河商业广场项目已创建', '系统'),
       ('task', 1, 'update', 'progress', '50', '张工'),
       ('task', 2, 'update', 'progress', '80', '张工'),
       ('task', 3, 'update', 'status', 'completed', '李工')`
  );

  const pCount = (await db.query('SELECT COUNT(*) as cnt FROM projects')).rows[0].cnt;
  const tCount = (await db.query('SELECT COUNT(*) as cnt FROM tasks')).rows[0].cnt;
  console.log(`✅ 数据库初始化完成 - 项目: ${pCount} 个，任务: ${tCount} 个，用户: ${users.length} 个`);
}

module.exports = init;