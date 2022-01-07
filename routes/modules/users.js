const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {resetMail} = require('../../modules/sendMail')

// 重置密碼
router.put('/resetPassword/:email', (req, res) => {
  const {email} = req.params
  const {password, confirmPassword} = req.body
  const request = new sql.Request(pool)

  // 驗證密碼與確認密碼是否相符
  if(password !== confirmPassword){
    req.flash('error', '密碼與確認密碼不符，請重新嘗試!!')
    return res.redirect(`/users/resetPassword/${email}`)
  }

  // 驗證帳號使否存在
  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where EMAIL = '${email}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const emailCheck = result.recordset[0]
    if(!emailCheck){
      req.flash('error', '查無此帳號，請重新嘗試!!')
      return res.redirect(`/users/resetPassword/${email}`)
    }else{
      // 使用bcrypt加密並存入資料庫
      return bcrypt.genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        request.input('password', sql.NVarChar(100), hash)
        .query(`update BOTFRONT_USERS_INFO
        set PASSWORD = @password
        where EMAIL = '${email}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        // console.log(result)
        })
      }).then(() => {
        req.flash('success_msg', '密碼修改成功，請使用新密碼登入!!')
        // 寄送修改密碼完成mail
        resetMail(res, 'mail_resetPasswordDone', email, '密碼修改成功')
        return res.redirect('/users/login')
      }).catch(err => console.log(err))
    }
  })
})

// 郵件連接至重設密碼頁面
router.get('/resetPassword/:email', (req, res) => {
  const {email} = req.params
  return res.render('resetPassword', {email})
})

// 發送重設密碼郵件
router.get('/sendResetMail', (req, res) => {
  const {resetEmail} = req.query
  const request = new sql.Request(pool)

  // 驗證帳號是否存在
  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where EMAIL = '${resetEmail}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const emailCheck = result.recordset[0]
    if(!emailCheck){
      req.flash('error', '查無此帳號，請重新嘗試!!')
      return res.redirect('/users/login')
    }else{
      resetMail(res, 'mail_resetPassword', resetEmail, 'Botfront Interface 密碼重置')
      req.flash('success_msg', `重設密碼郵件已經發送至${resetEmail}，請至信箱查看!`)
      return res.redirect('/users/login')
    }
  })
})

router.post('/register', (req, res) => {
  const {cpy_no, cpy_name, industry_no, email, password, confirmPassword} = req.body
  let {isadmin} = req.body

  const request = new sql.Request(pool)
  const errors = []
  

  // isadmin沒有要給使用者設定，故在這設預設值如果沒有收到值就給0
  if(!isadmin) isadmin = 0

  // 由於0 = false，如果這邊設定檢覈的話，會一直false
  if(!cpy_no || !cpy_name ||!industry_no || !email || !password || !confirmPassword){
    errors.push({message: '所有欄位都是必填的!'})
  }

  if(password !== confirmPassword){
    errors.push({message: '密碼和確認密碼不相符!'})
  }

  if(errors.length){
    request.query(`select * 
    from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const industryInfo = result.recordset
      return res.render('register', {
        industryInfo,
        errors,
        cpy_no,
        cpy_name,
        industry_no,
        email,
        isadmin,
        password,
        confirmPassword})
    })
  }else{
    request.query(`select * 
    from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const industryInfo = result.recordset
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
          if(user.EMAIL == email){
            errors.push({message: `此 Email 已經註冊過了!!`})
            return res.render('register', {
            errors,
            cpy_no,
            cpy_name,
            industry_no,
            email,
            isadmin,
            password,
            confirmPassword,
            industryInfo
            })
          }

          if(user.CPY_ID == cpy_no){
            errors.push({message: `此 公司代號 已經註冊過了!!`})
            return res.render('register', {
            errors,
            cpy_no,
            cpy_name,
            industry_no,
            email,
            isadmin,
            password,
            confirmPassword,
            industryInfo
            })
          }

          if(user.CPY_NAME == cpy_name){
            errors.push({message: `此 公司名稱 已經註冊過了!!`})
            return res.render('register', {
            errors,
            cpy_no,
            cpy_name,
            industry_no,
            email,
            isadmin,
            password,
            confirmPassword,
            industryInfo
            })
          }
          
        }else{
          return bcrypt
          .genSalt(10)
          .then(salt => bcrypt.hash(password, salt))
          .then(hash => {
            request.input('cpy_no', sql.NVarChar(30), cpy_no)
            .input('cpy_name', sql.NVarChar(80), cpy_name)
            .input('industry_no', sql.NVarChar(30), industry_no)
            .input('email', sql.NVarChar(80), email)
            .input('isadmin', sql.Bit, parseInt(isadmin))
            .input('password', sql.NVarChar(100), hash)
            .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD, INDUSTRY_NO, ISADMIN)
            values (@cpy_no, @cpy_name, @email, @password, @industry_no, @isadmin)`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            
            })
          }).then(() => {
            req.flash('success_msg', `帳號註冊成功!!`)
            return res.redirect('/users/login')
          })
          .catch(err => console.log(err))
        }
      })
    })
  }
})

router.get('/register', (req, res) => {
  const request = new sql.Request(pool)

  request.query(`select * 
  from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const industryInfo = result.recordset
    res.render('register', {industryInfo})
  })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/users/login',
  failureFlash: true,
}))

router.get('/login', (req, res) => {
  res.render('login')
})

router.get('/logout', (req, res) => {
  req.logOut()
  req.flash('success_msg', '你已經成功登出!')
  res.redirect('/users/login')
})


module.exports = router