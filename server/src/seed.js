
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  await db.init();

  // ========== 项目2: 天河商业广场 ==========
  const p2 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('天河商业广场项目', '广州市天河区', '2025-09-01', '2027-03-31', 12000, '陈工', '大型商业综合体，总建筑面积约8.6万平方米，地下4层，地上28层，包含购物中心、写字楼和酒店。', 'in_progress').lastInsertRowid;

  // 项目3: 南沙港区物流中心
  const p3 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('南沙港区物流中心', '广州市南沙区', '2026-01-15', '2027-09-30', 6500, '刘工', '现代化物流仓储中心，总建筑面积约4.2万平方米，包含仓库、办公楼、停车场及配套设施。', 'in_progress').lastInsertRowid;

  // 项目4: 珠江新城住宅小区
  const p4 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('珠江新城住宅小区（二期）', '广州市天河区珠江新城', '2025-06-01', '2027-12-31', 18500, '黄工', '高端住宅小区，总建筑面积约12万平方米，包含8栋高层住宅、地下车库、社区配套及绿化景观。', 'in_progress').lastInsertRowid;

  // 项目5: 已完成的项目
  const p5 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('白云区实验中学教学楼', '广州市白云区', '2024-03-01', '2025-08-31', 3200, '周工', '6层教学楼及配套实验楼，总建筑面积约1.8万平方米。', 'completed').lastInsertRowid;

  // 项目6: 计划中
  const p6 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('黄埔区地铁上盖综合体', '广州市黄埔区', '2026-10-01', '2028-12-31', 22000, '吴工', '地铁上盖TOD项目，总建筑面积约15万平方米，包含商业、办公、公寓及公共配套设施。', 'planning').lastInsertRowid;

  // 项目7: 已暂停
  const p7 = db.prepare(
    'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run('番禺区旧改安置房项目', '广州市番禺区', '2025-11-01', '2027-06-30', 9800, '郑工', '旧村改造安置房项目，总建筑面积约7.5万平方米，包含12栋住宅楼。因规划调整暂停。', 'suspended').lastInsertRowid;

  // ========== 为项目2-4添加详细的WBS任务 ==========

  const insertTask = (pid, parentId, wbs, name, start, end, duration, progress, assignee, status) => {
    return db.prepare(
      'INSERT INTO tasks (project_id, parent_id, wbs_code, name, start_date, end_date, duration, progress, assignee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(pid, parentId, wbs, name, start, end, duration, progress, assignee, status).lastInsertRowid;
  };

  // ---- 天河商业广场 (p2) ----
  const p2a = insertTask(p2, null, '1', '施工准备', '2025-09-01', '2025-10-15', 45, 100, '陈工', 'completed');
  insertTask(p2, p2a, '1.1', '场地清理与三通一平', '2025-09-01', '2025-09-20', 20, 100, '陈工', 'completed');
  insertTask(p2, p2a, '1.2', '临时设施搭建', '2025-09-15', '2025-10-05', 21, 100, '陈工', 'completed');
  insertTask(p2, p2a, '1.3', '施工组织设计编制', '2025-09-20', '2025-10-10', 21, 100, '陈工', 'completed');
  insertTask(p2, p2a, '1.4', '图纸会审与技术交底', '2025-10-01', '2025-10-15', 15, 100, '陈工', 'completed');

  const p2b = insertTask(p2, null, '2', '基坑及基础工程', '2025-10-16', '2026-02-28', 136, 100, '陈工', 'completed');
  insertTask(p2, p2b, '2.1', '土方开挖', '2025-10-16', '2025-11-15', 31, 100, '陈工', 'completed');
  insertTask(p2, p2b, '2.2', '基坑支护', '2025-10-20', '2025-12-10', 52, 100, '陈工', 'completed');
  insertTask(p2, p2b, '2.3', '桩基施工', '2025-11-15', '2026-01-15', 62, 100, '陈工', 'completed');
  insertTask(p2, p2b, '2.4', '地下室底板施工', '2026-01-10', '2026-02-15', 37, 100, '陈工', 'completed');
  insertTask(p2, p2b, '2.5', '地下室结构施工', '2026-02-01', '2026-02-28', 28, 100, '陈工', 'completed');

  const p2c = insertTask(p2, null, '3', '主体结构工程', '2026-03-01', '2026-10-31', 245, 55, '陈工', 'in_progress');
  insertTask(p2, p2c, '3.1', '1-7层结构施工', '2026-03-01', '2026-05-31', 92, 100, '陈工', 'completed');
  insertTask(p2, p2c, '3.2', '8-15层结构施工', '2026-06-01', '2026-08-15', 76, 60, '陈工', 'in_progress');
  insertTask(p2, p2c, '3.3', '16-22层结构施工', '2026-08-16', '2026-10-15', 61, 0, '陈工', 'pending');
  insertTask(p2, p2c, '3.4', '23-28层结构施工', '2026-10-01', '2026-10-31', 31, 0, '陈工', 'pending');
  insertTask(p2, p2c, '3.5', '屋面结构施工', '2026-10-15', '2026-10-31', 17, 0, '陈工', 'pending');

  const p2d = insertTask(p2, null, '4', '砌体及二次结构', '2026-06-01', '2026-12-31', 214, 25, '陈工', 'in_progress');
  insertTask(p2, p2d, '4.1', '1-7层砌体施工', '2026-06-01', '2026-07-31', 61, 100, '陈工', 'completed');
  insertTask(p2, p2d, '4.2', '8-15层砌体施工', '2026-08-01', '2026-10-15', 76, 20, '陈工', 'in_progress');
  insertTask(p2, p2d, '4.3', '16-28层砌体施工', '2026-10-16', '2026-12-31', 77, 0, '陈工', 'pending');

  const p2e = insertTask(p2, null, '5', '机电安装工程', '2026-08-01', '2027-01-31', 184, 10, '陈工', 'in_progress');
  insertTask(p2, p2e, '5.1', '给排水管道安装', '2026-08-01', '2026-10-31', 92, 20, '陈工', 'in_progress');
  insertTask(p2, p2e, '5.2', '电气系统安装', '2026-09-01', '2026-12-31', 122, 5, '陈工', 'in_progress');
  insertTask(p2, p2e, '5.3', '暖通空调安装', '2026-10-01', '2027-01-15', 107, 0, '陈工', 'pending');
  insertTask(p2, p2e, '5.4', '消防系统安装', '2026-10-15', '2027-01-31', 109, 0, '陈工', 'pending');
  insertTask(p2, p2e, '5.5', '电梯安装', '2026-12-01', '2027-01-31', 62, 0, '陈工', 'pending');

  insertTask(p2, null, '6', '装饰装修工程', '2027-01-01', '2027-03-15', 74, 0, '陈工', 'pending');
  insertTask(p2, null, '7', '室外工程及竣工验收', '2027-03-01', '2027-03-31', 31, 0, '陈工', 'pending');

  // ---- 南沙港区物流中心 (p3) ----
  const p3a = insertTask(p3, null, '1', '施工准备', '2026-01-15', '2026-02-28', 45, 100, '刘工', 'completed');
  insertTask(p3, p3a, '1.1', '场地清表与平整', '2026-01-15', '2026-02-05', 22, 100, '刘工', 'completed');
  insertTask(p3, p3a, '1.2', '临时道路及设施', '2026-02-01', '2026-02-20', 20, 100, '刘工', 'completed');
  insertTask(p3, p3a, '1.3', '施工图深化设计', '2026-02-10', '2026-02-28', 19, 100, '刘工', 'completed');

  const p3b = insertTask(p3, null, '2', '地基处理与基础', '2026-03-01', '2026-05-31', 92, 90, '刘工', 'in_progress');
  insertTask(p3, p3b, '2.1', '地基强夯处理', '2026-03-01', '2026-03-20', 20, 100, '刘工', 'completed');
  insertTask(p3, p3b, '2.2', '独立基础施工', '2026-03-15', '2026-04-30', 47, 100, '刘工', 'completed');
  insertTask(p3, p3b, '2.3', '地梁及承台施工', '2026-04-15', '2026-05-15', 31, 80, '刘工', 'in_progress');
  insertTask(p3, p3b, '2.4', '基础验收', '2026-05-16', '2026-05-31', 16, 0, '刘工', 'pending');

  const p3c = insertTask(p3, null, '3', '钢结构主体', '2026-06-01', '2026-10-31', 153, 5, '刘工', 'in_progress');
  insertTask(p3, p3c, '3.1', '钢柱安装', '2026-06-01', '2026-07-15', 45, 15, '刘工', 'in_progress');
  insertTask(p3, p3c, '3.2', '钢梁及檩条安装', '2026-07-01', '2026-08-31', 62, 0, '刘工', 'pending');
  insertTask(p3, p3c, '3.3', '屋面板安装', '2026-08-15', '2026-09-30', 47, 0, '刘工', 'pending');
  insertTask(p3, p3c, '3.4', '墙面板安装', '2026-09-01', '2026-10-31', 61, 0, '刘工', 'pending');

  insertTask(p3, null, '4', '仓库地面及配套', '2026-10-01', '2027-01-31', 123, 0, '刘工', 'pending');
  insertTask(p3, null, '5', '办公楼及附属设施', '2026-11-01', '2027-04-30', 181, 0, '刘工', 'pending');
  insertTask(p3, null, '6', '室外工程', '2027-03-01', '2027-07-31', 153, 0, '刘工', 'pending');
  insertTask(p3, null, '7', '竣工验收', '2027-08-01', '2027-09-30', 61, 0, '刘工', 'pending');

  // ---- 珠江新城住宅小区二期 (p4) ----
  const p4a = insertTask(p4, null, '1', '施工准备阶段', '2025-06-01', '2025-07-15', 45, 100, '黄工', 'completed');
  insertTask(p4, p4a, '1.1', '场地围蔽及清表', '2025-06-01', '2025-06-20', 20, 100, '黄工', 'completed');
  insertTask(p4, p4a, '1.2', '临时设施搭建', '2025-06-15', '2025-07-05', 21, 100, '黄工', 'completed');
  insertTask(p4, p4a, '1.3', '施工组织设计', '2025-06-20', '2025-07-15', 26, 100, '黄工', 'completed');

  const p4b = insertTask(p4, null, '2', '桩基及基坑工程', '2025-07-16', '2025-11-30', 138, 100, '黄工', 'completed');
  insertTask(p4, p4b, '2.1', '支护桩施工', '2025-07-16', '2025-08-31', 47, 100, '黄工', 'completed');
  insertTask(p4, p4b, '2.2', '土方开挖', '2025-09-01', '2025-10-15', 45, 100, '黄工', 'completed');
  insertTask(p4, p4b, '2.3', '工程桩施工', '2025-09-15', '2025-11-15', 62, 100, '黄工', 'completed');
  insertTask(p4, p4b, '2.4', '桩基检测', '2025-11-16', '2025-11-30', 15, 100, '黄工', 'completed');

  const p4c = insertTask(p4, null, '3', '地下室结构', '2025-12-01', '2026-03-31', 121, 100, '黄工', 'completed');
  insertTask(p4, p4c, '3.1', '底板施工', '2025-12-01', '2025-12-31', 31, 100, '黄工', 'completed');
  insertTask(p4, p4c, '3.2', 'B2层结构', '2026-01-01', '2026-01-31', 31, 100, '黄工', 'completed');
  insertTask(p4, p4c, '3.3', 'B1层结构', '2026-02-01', '2026-02-28', 28, 100, '黄工', 'completed');
  insertTask(p4, p4c, '3.4', '地下室顶板', '2026-03-01', '2026-03-31', 31, 100, '黄工', 'completed');

  const p4d = insertTask(p4, null, '4', '主体结构工程', '2026-04-01', '2027-01-31', 306, 35, '黄工', 'in_progress');
  insertTask(p4, p4d, '4.1', '1#-2#楼（1-15层）', '2026-04-01', '2026-07-31', 122, 100, '黄工', 'completed');
  insertTask(p4, p4d, '4.2', '3#-4#楼（1-15层）', '2026-06-01', '2026-09-30', 122, 70, '黄工', 'in_progress');
  insertTask(p4, p4d, '4.3', '5#-6#楼（1-15层）', '2026-08-01', '2026-11-30', 122, 20, '黄工', 'in_progress');
  insertTask(p4, p4d, '4.4', '7#-8#楼（1-15层）', '2026-10-01', '2027-01-31', 123, 0, '黄工', 'pending');

  const p4e = insertTask(p4, null, '5', '砌体及装修', '2026-08-01', '2027-06-30', 334, 10, '黄工', 'in_progress');
  insertTask(p4, p4e, '5.1', '1#-2#楼砌体', '2026-08-01', '2026-10-31', 92, 80, '黄工', 'in_progress');
  insertTask(p4, p4e, '5.2', '3#-4#楼砌体', '2026-10-01', '2026-12-31', 92, 0, '黄工', 'pending');
  insertTask(p4, p4e, '5.3', '5#-8#楼砌体', '2027-01-01', '2027-03-31', 90, 0, '黄工', 'pending');
  insertTask(p4, p4e, '5.4', '内外墙抹灰', '2027-02-01', '2027-05-31', 120, 0, '黄工', 'pending');
  insertTask(p4, p4e, '5.5', '精装修施工', '2027-04-01', '2027-06-30', 91, 0, '黄工', 'pending');

  insertTask(p4, null, '6', '机电安装', '2027-01-01', '2027-08-31', 243, 0, '黄工', 'pending');
  insertTask(p4, null, '7', '室外及景观工程', '2027-06-01', '2027-10-31', 153, 0, '黄工', 'pending');
  insertTask(p4, null, '8', '竣工验收', '2027-11-01', '2027-12-31', 61, 0, '黄工', 'pending');

  // ---- 白云区实验中学 (p5) 已完成项目 ----
  const p5a = insertTask(p5, null, '1', '施工准备', '2024-03-01', '2024-04-15', 46, 100, '周工', 'completed');
  insertTask(p5, p5a, '1.1', '场地清理', '2024-03-01', '2024-03-15', 15, 100, '周工', 'completed');
  insertTask(p5, p5a, '1.2', '临时设施', '2024-03-10', '2024-04-05', 27, 100, '周工', 'completed');
  insertTask(p5, p5a, '1.3', '施工组织设计', '2024-03-20', '2024-04-15', 27, 100, '周工', 'completed');

  const p5b = insertTask(p5, null, '2', '基础工程', '2024-04-16', '2024-07-15', 91, 100, '周工', 'completed');
  insertTask(p5, p5b, '2.1', '土方开挖', '2024-04-16', '2024-05-10', 25, 100, '周工', 'completed');
  insertTask(p5, p5b, '2.2', '基础垫层', '2024-05-01', '2024-05-20', 20, 100, '周工', 'completed');
  insertTask(p5, p5b, '2.3', '独立基础施工', '2024-05-15', '2024-06-30', 47, 100, '周工', 'completed');
  insertTask(p5, p5b, '2.4', '基础验收', '2024-07-01', '2024-07-15', 15, 100, '周工', 'completed');

  const p5c = insertTask(p5, null, '3', '主体结构', '2024-07-16', '2025-01-31', 200, 100, '周工', 'completed');
  insertTask(p5, p5c, '3.1', '1-2层结构', '2024-07-16', '2024-09-15', 62, 100, '周工', 'completed');
  insertTask(p5, p5c, '3.2', '3-4层结构', '2024-09-16', '2024-11-15', 61, 100, '周工', 'completed');
  insertTask(p5, p5c, '3.3', '5-6层结构', '2024-11-16', '2025-01-15', 61, 100, '周工', 'completed');
  insertTask(p5, p5c, '3.4', '屋面结构', '2025-01-16', '2025-01-31', 16, 100, '周工', 'completed');

  insertTask(p5, null, '4', '装饰装修', '2025-02-01', '2025-05-31', 120, 100, '周工', 'completed');
  insertTask(p5, null, '5', '机电安装', '2025-03-01', '2025-06-30', 122, 100, '周工', 'completed');
  insertTask(p5, null, '6', '室外工程', '2025-06-01', '2025-08-15', 76, 100, '周工', 'completed');
  insertTask(p5, null, '7', '竣工验收', '2025-08-16', '2025-08-31', 16, 100, '周工', 'completed');

  // ---- 番禺区旧改安置房 (p7) 暂停项目 ----
  const p7a = insertTask(p7, null, '1', '施工准备', '2025-11-01', '2025-12-31', 61, 100, '郑工', 'completed');
  insertTask(p7, p7a, '1.1', '场地测绘', '2025-11-01', '2025-11-20', 20, 100, '郑工', 'completed');
  insertTask(p7, p7a, '1.2', '临时设施搭建', '2025-11-15', '2025-12-15', 31, 100, '郑工', 'completed');
  insertTask(p7, p7a, '1.3', '施工许可证办理', '2025-12-01', '2025-12-31', 31, 100, '郑工', 'completed');

  const p7b = insertTask(p7, null, '2', '桩基工程', '2026-01-01', '2026-03-31', 90, 40, '郑工', 'delayed');
  insertTask(p7, p7b, '2.1', '试桩施工', '2026-01-01', '2026-01-31', 31, 100, '郑工', 'completed');
  insertTask(p7, p7b, '2.2', '工程桩施工（1#-6#）', '2026-02-01', '2026-03-15', 43, 60, '郑工', 'delayed');
  insertTask(p7, p7b, '2.3', '工程桩施工（7#-12#）', '2026-03-01', '2026-03-31', 31, 0, '郑工', 'delayed');

  insertTask(p7, null, '3', '土方及基坑', '2026-04-01', '2026-05-31', 61, 0, '郑工', 'delayed');
  insertTask(p7, null, '4', '基础及地下室', '2026-06-01', '2026-08-31', 92, 0, '郑工', 'delayed');
  insertTask(p7, null, '5', '主体结构', '2026-09-01', '2027-04-30', 242, 0, '郑工', 'delayed');
  insertTask(p7, null, '6', '装饰装修', '2027-05-01', '2027-06-30', 61, 0, '郑工', 'delayed');

  // 添加更多用户
  const hash = bcrypt.hashSync('123456', 10);
  const users = [
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
    try {
      db.prepare('INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)').run(u, hash, name, role);
    } catch (e) {}
  }

  const totalProjects = db.prepare('SELECT COUNT(*) as cnt FROM projects').get().cnt;
  const totalTasks = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get().cnt;
  console.log(`✅ 数据填充完成！项目: ${totalProjects} 个，任务: ${totalTasks} 个`);
}

seed().catch(e => console.error(e));
