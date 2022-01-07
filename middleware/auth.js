module.exports = {
  authenticator: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    req.flash('warning_msg', '請先登入才能使用!')
    res.redirect('/users/login')
  },
  isAdmin: (req, res, next) => {
    const isAdmin = res.locals.isAdmin
    if(isAdmin){
      return next()
    }
    req.flash('warning_msg', '權限不足!')
    res.redirect('/')
  }
}