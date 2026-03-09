/* ===================================================
   数据库连接池（MySQL）
   请根据你的本地 MySQL 配置修改 host/user/password/database
   =================================================== */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '', // <-- 填写你的 MySQL 密码
  database: 'campusconnect', // <-- 确保已创建该数据库
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
