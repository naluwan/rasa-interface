const sql = require("mssql");

// DB 資料
const db = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// 建立連接池
const pool = new sql.ConnectionPool(db);

// 連接池連線 
pool.connect((err) => {
  if (err) {
    console.log("sql error!");
    console.log(err);
    return;
  }
  console.log("sql connected!");
  const request = new sql.Request(pool);

  // 檢查資料表是否存在
  request.query(`select * from ${process.env.DB_TABLE}`, (err, result) => {
    if (err) {
      // 不存在則建立資料表
      request.query(`create table ${process.env.DB_TABLE}(
        CPNY_ID varchar(30),
        DATA_NAME nvarchar(50),
        DATA_CONTENT nvarchar(max),
        primary key(CPNY_ID, DATA_NAME)
        )`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        console.log('data_table created!')
      })
    }
    console.log("data_base correct!");
  });
});

module.exports = pool;
