const jwt = require('jsonwebtoken')
const SECRET = 'thisisthenewjwttoken'
const sql = require('mssql')
const pool = require('../config/connectPool')

module.exports = {
  authenticator: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    req.flash('warning_msg', '請先登入才能使用')
    res.redirect('/users/login')
  },
  isAdmin: (req, res, next) => {
    const isAdmin = res.locals.isAdmin
    if(isAdmin){
      return next()
    }
    req.flash('warning_msg', '權限不足')
    res.redirect('/')
  },
  // JWT 驗證
  auth: (req, res, next) => {
    const request = new sql.Request(pool)
    try{
      const token = req.header('Authorization').replace('Bearer ', '')
      const decoded = jwt.verify(token, SECRET, {expiresIn: '10000'})

      request.query(`select CPY_ID, CPY_NAME, EMAIL, ISADMIN, TOKENS
      from BOTFRONT_USERS_INFO
      where CPY_ID = '${decoded.id}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        const user = result.recordset[0]
        if(!user) {throw new Error()}

        const tokens = JSON.parse(user.TOKENS)
        const isCurrentToken = tokens.some(item => item.token === token)
        
        if(isCurrentToken){
          delete user.TOKENS
          req.token = token
          req.user = user
          next()
        }else{
          res.status(401).send({status: 'error', message:'無效Token'})
        }
      })
    }catch(err){
      res.status(401).send({status: 'error', message:'資料錯誤，請重新嘗試'})
    }
  }
}

