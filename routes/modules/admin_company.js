const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')

// 厲害 admin 刪除帳號 API
router.get('/delete', isAdmin, (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)
  if(!infoId) return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${infoId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyCheck = result.recordset[0]

    if(!cpnyCheck){
      return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
    }else{
      request.query(`delete from BOTFRONT_USERS_INFO
      where CPY_ID = '${infoId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.send({status: 'success', message: '刪除帳號成功'})
      })
    }
  })
})

// 徵厲害 admin 修改密碼 API
router.get('/repwd', isAdmin, (req, res) => {
  const {infoId, password, confirmPassword} = req.query
  const request = new sql.Request(pool)

  if(!infoId) return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
  if(!password || !confirmPassword) return res.send({status: 'warning', message: '所有欄位都為必填欄位'})
  if(password !== confirmPassword) return res.send({status: 'warning', message: '密碼和確認密碼不相符'})

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where CPY_NAME = '${infoId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyCheck = result.recordset[0]
    if(!cpnyCheck){
      return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
    }else{
      return bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        request.input('pwd', sql.NVarChar(100), hash)
        .query(`update BOTFRONT_USERS_INFO 
        set password = @pwd
        where CPY_NAME = '${infoId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
      }).then(() => {
        return res.send({status: 'success', message: '密碼修改成功'})
      })
      .catch(err => console.log(err))
    }
  })
})

// 徵厲害 admin 編輯 API
router.get('/:cpnyId/edit/update', isAdmin, (req, res) => {
  const {cpnyId} = req.params
  const {cpy_no, cpy_name, email, ishr, isadmin} = req.query
  const request = new sql.Request(pool)
  
  if(!cpy_no || !cpy_name || !email || !ishr || !isadmin){
    return res.send({status:'warning', message: '所有欄位都為必填欄位'})
  }

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyCheck = result.recordset[0]
    if(!cpnyCheck){
      return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
    }else{
      request.input('cpy_id', sql.NVarChar(30), cpy_no)
      .input('cpy_name', sql.NVarChar(80), decodeURI(cpy_name))
      .input('email', sql.NVarChar(80), email)
      .input('ishr', sql.Bit, parseInt(ishr))
      .input('isadmin', sql.Bit, parseInt(isadmin))
      .query(`update BOTFRONT_USERS_INFO
      set CPY_ID = @cpy_id, CPY_NAME = @cpy_name, EMAIL = @email, ISHR = @ishr, ISADMIN = @isadmin
      where CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.send({status: 'success', message: '帳號資料更新成功!'})
      })
    }
  })
})

// 徵厲害 admin 新增帳號 API
router.get('/new/insert', isAdmin, (req, res) => {
  const {cpy_no, cpy_name, email, ishr, isadmin, password, confirmPassword} = req.query

  if(!cpy_no || !cpy_name || !email || !isadmin || !password || !confirmPassword || !ishr) return res.send({status: 'warning', message: '所有欄位都為必填欄位'})
  if(password !== confirmPassword) return res.send({status: 'warning', message: '密碼和確認密碼不相符'})

  const request = new sql.Request(pool)

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${cpy_no}'
  or EMAIL = '${email}'
  or CPY_NAME = '${cpy_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyCheck = result.recordset
    if(cpnyCheck.length){
      cpnyCheck.forEach(user => {
        if(user.CPY_NAME == cpy_name) return res.send({status: 'warning', message: '此「公司名稱」已經註冊過'})
        if(user.CPY_ID == cpy_no) return res.send({status: 'warning', message: '此「公司代號」已經註冊過'})
        if(user.EMAIL == email) return res.send({status: 'warning', message: '此「Email」已經註冊過'})
      })
    }else{
      return bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        request.input('cpy_no', sql.NVarChar(30), cpy_no)
        .input('cpy_name', sql.NVarChar(80), decodeURI(cpy_name))
        .input('email', sql.NVarChar(80), email)
        .input('isadmin', sql.Bit, parseInt(isadmin))
        .input('ishr', sql.Bit, parseInt(ishr))
        .input('password', sql.NVarChar(100), hash)
        .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD, ISADMIN, ISHR)
        values (@cpy_no, @cpy_name, @email, @password, @isadmin, @ishr)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        })
      }).then(() => {
        return res.send({status: 'success', message: '新增帳號成功'})
      })
      .catch(err => console.log(err))
    }
  })
})

// 顯示徵厲害 admin 編輯帳號頁面
router.get('/:cpnyId/edit', isAdmin, (req, res) => {
  const {cpnyId} = req.params
  const request = new sql.Request(pool)
  const admin_edit_company = true
  const route = 'johnnyHire'
  const action = 'admin_edit'
  const category = 'cpny'
    request.query(`select a.CPY_ID, a.CPY_NAME, a.EMAIL, a.PASSWORD, a.ISADMIN, a.ISHR
    from BOTFRONT_USERS_INFO a
    where CPY_ID = '${cpnyId}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset[0]
      if(!adminCompanyInfo) {
        req.flash('error', '查無此公司，請重新嘗試!!')
        return res.redirect('/admin_company')
      }
      res.render('index', {adminCompanyInfo, route, id: cpnyId, admin_edit_company, category, action})
    })
})

// 顯示徵厲害admin 新增帳號頁面
router.get('/new', isAdmin, (req, res) => {
  const admin_register = true
  res.render('index', {admin_register})
})

// 顯示徵厲害admin頁面
router.get('/', (req, res) => {
  const request = new sql.Request(pool)
  const admin_company = true

  request.query(`select a.CPY_ID, a.CPY_NAME, a.EMAIL, a.PASSWORD, a.ISADMIN, a.ISHR
  from BOTFRONT_USERS_INFO a`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompanyInfo = result.recordset
    res.render('index', {adminCompanyInfo, admin_company})
  })
})

module.exports = router