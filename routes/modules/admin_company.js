const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.delete('/:name/:cpnyId', (req, res) => {
  const {name, cpnyId} = req.params
  const request = new sql.Request(pool)

  request.query(`select *
  from BOTFRONT_USERS_INFO
  where CPY_NAME = '${name}'
  and CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const companyCheck = result.recordset[0]
    if(!companyCheck){
      req.flash('error', '查無此公司，請重新嘗試!!')
      return res.redirect('/admin_company')
    }else{
      request.query(`delete BOTFRONT_USERS_INFO
      where CPY_NAME = '${name}'
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
          req.flash('success_msg', '刪除成功!!')
          res.redirect('/admin_company')
      })
    }
  })
})

router.put('/password/:CPY_ID', (req, res) => {
  const {CPY_ID} = req.params
  const {password, confirmPassword} = req.body

  if(!password || !confirmPassword){
    req.flash('error', '所有欄位都是必填的!!')
    return res.redirect(`/admin_company/${CPY_ID}/edit/password`)
  }

  if(password !== confirmPassword){
    req.flash('error', '密碼與確認密碼不相符!')
    return res.redirect(`/admin_company/${CPY_ID}/edit/password`)
  }

  const request = new sql.Request(pool)

  request.query(`select CPY_ID, CPY_NAME
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${CPY_ID}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompanyInfo = result.recordset[0]
    if(!adminCompanyInfo){
      req.flash('error', '查無此公司，請重新嘗試!!')
      return res.redirect('/admin_company')
    }else{
      return bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        request.input('password', sql.NVarChar(100), hash)
        .query(`update BOTFRONT_USERS_INFO 
        set password = @password
        where CPY_ID = '${CPY_ID}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
      }).then(() => {
        req.flash('success_msg', '密碼修改成功!!')
        return res.redirect('/admin_company')
      })
      .catch(err => console.log(err))
    }
  })
})

router.get('/:CPY_ID/edit/password', (req, res) => {
  const {CPY_ID} = req.params
  const admin_edit_pwd = true
  const request = new sql.Request(pool)
  request.query(`select CPY_ID, CPY_NAME
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${CPY_ID}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompanyInfo = result.recordset[0]
    if(!adminCompanyInfo){
      req.flash('error', '查無此公司，請重新嘗試!!')
      return res.redirect('/admin_company')
    }
    res.render('index', {adminCompanyInfo, admin_edit_pwd})
  })
})

router.put('/:CPY_ID', (req, res) => {
  const {CPY_ID} = req.params
  const {cpy_no, cpy_name, email, isadmin, ishr} = req.body

  const request = new sql.Request(pool)

  if(!cpy_no || !cpy_name || !email || !isadmin || !ishr){
    req.flash('error', '所有欄位都是必填的!!')
    return res.redirect(`/admin_company/${CPY_ID}/edit`)
  }

  request.query(`select *
  from BOTFRONT_USERS_INFO 
  where CPY_ID = '${CPY_ID}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompanyInfo = result.recordset[0]
    if(!adminCompanyInfo) {
      req.flash('error', '查無此公司，請重新嘗試!!')
      return res.redirect('/admin_company')
    }
    if(adminCompanyInfo.CPY_ID == cpy_no){
      request.input('cpy_name', sql.NVarChar(80), cpy_name)
      .input('email', sql.NVarChar(80), email)
      .input('isadmin', sql.Bit, parseInt(isadmin))
      .input('ishr', sql.Bit, parseInt(ishr))
      .query(`update BOTFRONT_USERS_INFO
      set CPY_NAME = @cpy_name, EMAIL = @email, ISADMIN = @isadmin, ISHR = @ishr
      where CPY_ID = '${CPY_ID}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新資料成功!!')
        return res.redirect('/admin_company')
      })
    }else{
      request.input('cpy_no', sql.NVarChar(30), cpy_no)
      .input('cpy_name', sql.NVarChar(80), cpy_name)
      .input('email', sql.NVarChar(80), email)
      .input('isadmin', sql.Bit, parseInt(isadmin))
      .input('ishr', sql.Bit, parseInt(ishr))
      .query(`update BOTFRONT_USERS_INFO
      set CPY_ID = @cpy_no, CPY_NAME = @cpy_name, EMAIL = @email, ISADMIN = @isadmin, ISHR = @ishr
      where CPY_ID = '${CPY_ID}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新資料成功!!')
        return res.redirect('/admin_company')
      })
    }
  })
})

router.get('/:CPY_ID/edit', (req, res) => {
  const {CPY_ID} = req.params
  const request = new sql.Request(pool)
  const admin_edit_company = true

    request.query(`select a.CPY_ID, a.CPY_NAME, a.EMAIL, a.PASSWORD, a.INDUSTRY_NO, b.INDUSTRY_NAME, a.ISADMIN, a.ISHR
    from BOTFRONT_USERS_INFO a
    left join BOTFRONT_TYPE_OF_INDUSTRY b
    on a.INDUSTRY_NO = b.INDUSTRY_ID
    where CPY_ID = '${CPY_ID}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset[0]
      if(!adminCompanyInfo) {
        req.flash('error', '查無此公司，請重新嘗試!!')
        return res.redirect('/admin_company')
      }
      res.render('index', {adminCompanyInfo, admin_edit_company})
    })
})

router.post('/new', isAdmin, (req, res) => {
  const {cpy_no, cpy_name, email, isadmin, password, confirmPassword, ishr} = req.body

  const request = new sql.Request(pool)
  const errors = []
  const warning = []
  const admin_register = true
  if(!cpy_no || !cpy_name || !email || !isadmin || !password || !confirmPassword || !ishr){
    warning.push({message: '所有欄位都是必填的!'})
  }

  if(password !== confirmPassword){
    warning.push({message: '密碼和確認密碼不相符!'})
  }

  if(warning.length){
      return res.render('index', {
        warning,
        cpy_no,
        cpy_name,
        email,
        isadmin,
        ishr,
        password,
        confirmPassword,
        admin_register
      })
  }else{
    request.query(`select * 
    from BOTFRONT_USERS_INFO
    where EMAIL = '${email}' or CPY_ID = '${cpy_no}' or CPY_NAME = '${cpy_name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const user = result.recordset[0]
      // console.log(user)
      if(user){
        if(user.EMAIL == email) errors.push({message: `此「Email」已經註冊過了!!`})

        if(user.CPY_ID == cpy_no) errors.push({message: `此「公司代號」已經註冊過了!!`})

        if(user.CPY_NAME == cpy_name) errors.push({message: `此「公司名稱」已經註冊過了!!`})

        if(errors.length){
          return res.render('index', {
            errors,
            cpy_no,
            cpy_name,
            email,
            isadmin,
            ishr,
            password,
            confirmPassword,
            admin_register,
          })
        }
      }else{
        return bcrypt
        .genSalt(10)
        .then(salt => bcrypt.hash(password, salt))
        .then(hash => {
          request.input('cpy_no', sql.NVarChar(30), cpy_no)
          .input('cpy_name', sql.NVarChar(80), cpy_name)
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
          // console.log(result)
          })
        }).then(() => {
          req.flash('success_msg', '使用者新增成功!!')
          return res.redirect('/admin_company')
        })
        .catch(err => console.log(err))
      }
    })
  }
})

router.get('/new', isAdmin, (req, res) => {
  const admin_register = true
  res.render('index', {admin_register})
})

router.get('/', (req, res) => {
  const request = new sql.Request(pool)
  const admin_company = true

  request.query(`select a.CPY_ID, a.CPY_NAME, a.EMAIL, a.PASSWORD, a.INDUSTRY_NO, b.INDUSTRY_NAME, a.ISADMIN, a.ISHR
  from BOTFRONT_USERS_INFO a
  left join BOTFRONT_TYPE_OF_INDUSTRY b
  on a.INDUSTRY_NO = b.INDUSTRY_ID`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompanyInfo = result.recordset
    res.render('index', {adminCompanyInfo, admin_company})
  })
})

module.exports = router