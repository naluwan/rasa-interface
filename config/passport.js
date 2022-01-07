const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

const sql = require('mssql')
const pool = require('./connectPool')

module.exports = app => {
  
  app.use(passport.initialize())
  app.use(passport.session())

  passport.use(new LocalStrategy({usernameField: 'email', passReqToCallback: true}, (req, email, password, done) => {
    const request = new sql.Request(pool)
    request.query(`select CPY_ID, CPY_NAME, EMAIL, PASSWORD, INDUSTRY_NO, ISADMIN
    from BOTFRONT_USERS_INFO
    where EMAIL = '${email}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const user = result.recordset[0]
      // console.log(user)
      if(!user) {
        return done(null, false, {message: '這個Email還未註冊!!'})
      }
      return bcrypt.compare(password, user.PASSWORD).then(isMatch => {
        if(!isMatch) {
          return done(null, false, {message: '帳號或密碼錯誤!!'})
        }else{
          return done(null, user)
        }
      }).catch(err => console.log(err))
    })
  }))

  passport.serializeUser(function(user, done){
    done(null, user.EMAIL)
  })

  passport.deserializeUser(function(email, done){
    const request = new sql.Request(pool)
    request.query(`select * 
    from BOTFRONT_USERS_INFO
    where EMAIL = '${email}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const user = result.recordset[0]
      // console.log(user)
      done(null, user)
    })
  })
}