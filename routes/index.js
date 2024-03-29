const express = require('express')
const router = express.Router()

const train = require('./modules/train')
const greet = require('./modules/greet')
const home = require('./modules/home')
// const position = require('./modules/position')
// const company = require('./modules/company')
// const subsidy = require('./modules/subsidy')
// const leave = require('./modules/leave')
const defaultRes = require('./modules/defaultRes')
const users = require('./modules/users')
const adminCompany = require('./modules/admin_company')
const adminPositionInfo = require('./modules/admin_positionInfo')
const adminCompanyInfo = require('./modules/admin_companyInfo')
const adminLeaveInfo = require('./modules/admin_leaveInfo')
const adminSubsidyInfo = require('./modules/admin_subsidyInfo')
const adminSearch = require('./modules/admin_search')
const johnnyHire = require('./modules/johnnyHireAPI')
const adminIndustryInfo = require('./modules/adminIndustryInfo')
const bf_cs = require('./modules/bf_cs')
const jh_position = require('./modules/jh_position')
const jh_cpnyInfo = require('./modules/jh_cpnyInfo')
const jh_subsidy = require('./modules/jh_subsidy')
const jh_leave = require('./modules/jh_leave')
const {authenticator} = require('../middleware/auth')


router.use('/jh_position', authenticator, jh_position)
router.use('/jh_cpnyInfo', authenticator, jh_cpnyInfo)
router.use('/jh_subsidy', authenticator, jh_subsidy)
router.use('/jh_leave', authenticator, jh_leave)
router.use('/bf_cs', authenticator, bf_cs)
router.use('/adminIndustryInfo', authenticator, adminIndustryInfo)
router.use('/admin_search', authenticator, adminSearch)
router.use('/admin_subsidyInfo', authenticator, adminSubsidyInfo)
router.use('/admin_leaveInfo', authenticator, adminLeaveInfo)
router.use('/admin_companyInfo', authenticator, adminCompanyInfo)
router.use('/admin_positionInfo', authenticator, adminPositionInfo)
router.use('/admin_company', authenticator, adminCompany)
router.use('/greet', authenticator, greet)
router.use('/defaultRes', authenticator, defaultRes)
// router.use('/position', authenticator, jh_position) 以上要改成這樣

router.use('/train', train)
router.use('/johnnyHire', johnnyHire)
router.use('/users', users)
router.use('/', home)

module.exports = router
