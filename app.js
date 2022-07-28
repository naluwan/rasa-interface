const express = require('express')
const session = require('express-session')
const {engine} = require('express-handlebars')
const methodOverride = require('method-override')
const hbshelpers = require('handlebars-helpers')
const multihelpers = hbshelpers()
const flash = require('connect-flash')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const routes = require('./routes')
const usePassport = require('./config/passport')
require('./config/connectPool')

const app = express()
const PORT = process.env.PORT

app.engine('hbs', engine({defaultLayout: 'main', extname: '.hbs'}))
app.set('view engine', 'hbs')

app.use(session({
  secret: 'botfrontSecret',
  resave: false,
  saveUninitialized: true
}))
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(methodOverride('_method'))

usePassport(app)
app.use(flash())
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated()
  res.locals.user = req.user
  const user = res.locals.user
  if(res.locals.isAuthenticated){
    res.locals.isAdmin = user.ISADMIN
    res.locals.isHr = user.ISHR
    res.locals.whichRole = user.WHICH_ROLE
  }
  res.locals.warning_msg = req.flash('warning_msg')
  res.locals.success_msg = req.flash('success_msg')
  res.locals.errorMsg = req.flash('error')
  next()
})

app.use(routes)

app.listen(PORT, () => {
  console.log(`chatbot is running oh http://localhost:${PORT}`)
})
