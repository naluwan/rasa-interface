const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')
const trainingDataList = require('../../models/trainingDataSeeds.json')
const yaml = require('js-yaml')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {resetMail} = require('../../modules/sendMail')
const jwt = require('jsonwebtoken')
const {auth} = require('../../middleware/auth')

const SECRET = 'thisisthenewjwttoken'

// user 重置密碼
router.get('/resetPassword/:email/update', (req, res) => {
  const {email} = req.params
  const {password, confirmPassword} = req.query
  const request = new sql.Request(pool)

  // 驗證密碼與確認密碼是否相符
  if(password !== confirmPassword){
    return res.send({status: 'warning', message: '密碼與確認密碼不符，請重新嘗試'})
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
      return res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
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
        })
      }).then(() => {
        // 寄送修改密碼完成mail
        resetMail(res, 'mail_resetPasswordDone', email, 'ChatBot 密碼修改成功')
        res.send({status: 'success', message: '密碼修改成功，請使用新密碼登入'})
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
  const {email} = req.query
  const request = new sql.Request(pool)

  if(!email) return res.send({status: 'warning', message: '請輸入E-mail'})

  // 驗證帳號是否存在
  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where EMAIL = '${email}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const emailCheck = result.recordset[0]
    if(!emailCheck){
      res.send({status: 'error', message: '查無此帳號，請重新嘗試'})
    }else{
      resetMail(res, 'mail_resetPassword', email, 'ChatBot 密碼重置')
      res.send({status: 'success', message: `重設密碼郵件已經發送至${email}，請至信箱查看`})
    }
  })
})

// user 註冊帳號
router.get('/register/insert', (req, res) => {
  const {cpy_no, cpy_name, email, password, confirmPassword} = req.query

  const request = new sql.Request(pool)

  // 由於0 = false，如果這邊設定檢覈的話，會一直false
  if(!cpy_no || !cpy_name || !email || !password || !confirmPassword) return res.send({status: 'warning', message: '所有欄位都是必填的'})
  if(password !== confirmPassword) return res.send({status: 'warning', message: '密碼和確認密碼不相符!'})

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where EMAIL = '${email}' or CPY_ID = '${cpy_no}' or CPY_NAME = '${cpy_name}'`, (err, result) => {
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
      bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        request.input('cpy_no', sql.NVarChar(30), cpy_no)
        .input('cpy_name', sql.NVarChar(80), cpy_name)
        .input('email', sql.NVarChar(80), email)
        .input('password', sql.NVarChar(100), hash)
        .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD)
        values (@cpy_no, @cpy_name, @email, @password)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
        return cpy_no
      })
      .then(cpnyNo => {
        trainingDataList.map(data => {
          if(data.name === 'config-test'){
            request.input('cpny_no', sql.NVarChar(30), cpnyNo)
            .input('dataName', sql.NVarChar(50), data.name)
            .input('dataContent', sql.NVarChar(sql.MAX), yaml.dump(data.content))
            .query(`insert into BF_JH_DATA_TEST(CPNY_ID, DATA_NAME, DATA_CONTENT)
            values (@cpny_no, @dataName, @dataContent)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
            })
          }
        })
      })
      .then(() => {
        return res.send({status: 'success', message: '帳號註冊成功'})
      })
      .catch(err => console.log(err))
    }
  })
})

// JWT TOKEN 註冊帳號 
router.post('/register', (req, res) => {
  const {cpy_no, cpy_name, email, password, confirmPassword} = req.body
  const request = new sql.Request(pool)
  if(!cpy_no || !cpy_name || !email || !password || !confirmPassword) return res.send({status: 'warning', message: '所有欄位都是必填的'})
  if(password !== confirmPassword) return res.send({status: 'warning', message: '密碼和確認密碼不相符!'})

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where EMAIL = '${email}' or CPY_ID = '${cpy_no}' or CPY_NAME = '${cpy_name}'`, (err, result) => {
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
      bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(password, salt))
      .then(hash => {
        const token = jwt.sign({id: cpy_no}, SECRET)
        request.input('cpy_no', sql.NVarChar(30), cpy_no)
        .input('cpy_name', sql.NVarChar(80), cpy_name)
        .input('email', sql.NVarChar(80), email)
        .input('password', sql.NVarChar(100), hash)
        .input('jwtToken', sql.NVarChar(sql.MAX), JSON.stringify([{token}]))
        .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD, TOKENS)
        values (@cpy_no, @cpy_name, @email, @password, @jwtToken)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
        return {cpy_no, token}
      })
      .then(info => {
        trainingDataList.map(data => {
          if(data.name === 'config-test'){
            request.input('cpny_no', sql.NVarChar(30), info.cpy_no)
            .input('dataName', sql.NVarChar(50), data.name)
            .input('dataContent', sql.NVarChar(sql.MAX), yaml.dump(data.content))
            .query(`insert into BF_JH_DATA_TEST(CPNY_ID, DATA_NAME, DATA_CONTENT)
            values (@cpny_no, @dataName, @dataContent)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
            })
          }
        })
        return info.token
      })
      .then((token) => {
        request.query(`select CPY_ID, CPY_NAME, EMAIL, ISADMIN, TOKENS
        from BOTFRONT_USERS_INFO
        where EMAIL = '${email}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const user = result.recordsets[0]
          return res.send({status: 'success', message: '帳號註冊成功', user, token})
        })
      })
      .catch(err => console.log(err))
    }
  })
})

// JWT TOKEN 登入
router.post('/react/login', (req, res) => {
  const {email, password, expiresIn} = req.body

  const request = new sql.Request(pool)
  request.query(`select CPY_ID, CPY_NAME, EMAIL, PASSWORD, ISADMIN, TOKENS
    from BOTFRONT_USERS_INFO
    where EMAIL = '${email}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const user = result.recordset[0]

      if(!user) return res.send({status:'error', message: '這個Email還未註冊'})
      
      return bcrypt.compare(password, user.PASSWORD)
      .then(isMatch => {
        if(!isMatch) return res.send({statue:'warning', message: '帳號或密碼錯誤'})
        const token = jwt.sign({id: user.CPY_ID}, SECRET, {expiresIn})
        const tokens = JSON.stringify(JSON.parse(user.TOKENS).concat({token}))
        
        request.input('jwtToken', sql.NVarChar(sql.MAX), tokens)
        .query(`update BOTFRONT_USERS_INFO
        set TOKENS = @jwtToken 
        where CPY_ID = '${user.CPY_ID}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          request.query(`select CPY_ID, CPY_NAME, EMAIL, ISADMIN
          from BOTFRONT_USERS_INFO
          where EMAIL = '${email}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const currentUser = result.recordsets[0]
            return res.send({status: 'success', message: '登入成功', user: currentUser[0], token})
          })
        })
      }).catch(err => console.log(err))
    })
})

// JWT TOKEN 登出
router.post('/react/logout', auth, (req, res) => {
  const request = new sql.Request(pool)

  try{
    req.user.TOKENS = JSON.stringify(JSON.parse(req.user.TOKENS).filter(token => token.token !== req.token))
    
    request.input('jwtToken', sql.NVarChar(sql.Max), req.user.TOKENS)
    .query(`update BOTFRONT_USERS_INFO
    set TOKENS = @jwtToken 
    where CPY_ID = '${req.user.CPY_ID}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      res.status(200).send({status: 'success', message: '登出成功'})
    })
  }catch(err){
    res.status(500).send({status:'error', message: '資料錯誤'})
  }
})

// JWT TOKEN 驗證
router.get('/react/auth', auth, (req, res) => {
  const user = req.user
  const token = req.token
  res.status(200).send({user, token})
})

// 顯示user註冊頁面
router.get('/register', (req, res) => {
    res.render('register')
})

// user登入
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/users/login',
  failureFlash: true,
}))

// 顯示user登入頁面
router.get('/login', (req, res) => {
  res.render('login')
})

// user登出
router.get('/logout', (req, res) => {
  const user = res.locals.user
  if(!user) {
    res.redirect('/users/login')
    return 
  }
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  request.input('logout', sql.Bit, 0)
  .query(`update BOTFRONT_USERS_INFO
  set ISLOGIN = @logout
  where CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    req.logOut()
    res.redirect('/users/login')
    req.session.destroy()
    
  })
})


module.exports = router