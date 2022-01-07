const sql = require('mssql')

const db = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

const pool = new sql.ConnectionPool(db)

pool.connect(err => {
  if(err){
    console.log('sql error!')
    console.log(err)
    return
  } 
  console.log('sql connected!')
})

module.exports = pool