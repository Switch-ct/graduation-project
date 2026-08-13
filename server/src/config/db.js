const { Pool } = require('pg');

// 从环境变量读取数据库配置
// Render 会自动注入 DATABASE_URL（Neon 的连接串）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 统一查询接口：兼容原来的 db.prepare(sql).run/all/get 写法
const db = {
  query: (text, params) => pool.query(text, params),

  // 兼容旧 API: db.prepare(sql).all(...params)
  prepare: (sql) => {
    // 把 SQLite 的 ? 占位符转换为 PostgreSQL 的 $1, $2, $3
    const pgSql = convertPlaceholders(sql);

    return {
      run: async (...params) => {
        const flat = params.flat();
        const result = await pool.query(pgSql, flat);
        return { lastInsertRowid: result.rows[0]?.id, rowCount: result.rowCount };
      },
      get: async (...params) => {
        const flat = params.flat();
        const result = await pool.query(pgSql, flat);
        return result.rows[0];
      },
      all: async (...params) => {
        const flat = params.flat();
        const result = await pool.query(pgSql, flat);
        return result.rows;
      },
    };
  },

  // 关闭连接池
  end: () => pool.end(),
};

// 把 SQL 中的 ? 转换为 $1, $2, $3
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

module.exports = db;