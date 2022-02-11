const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

// 顯示公司新增資訊頁面
router.get('/new', (req, res) => {
  res.render('jh_new_cpnyInfo')
})

// 顯示公司資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  // 抓取公司資訊
  request.query(`select a.INFO_DES, b.INFO_NAME, b.INFO_ID
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.INFO_ID = b.INFO_ID
  where CPY_ID = '${cpyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const cpnyInfo = result.recordset

		if(cpnyInfo.length == 0){
      request.input('cpyId', sql.NVarChar(30), cpyId)
      .input('tel', sql.Int, 1)
      .input('address', sql.Int, 2)
      .input('introduction', sql.Int, 3)
      .query(`insert into BF_JH_CPNYINFO(CPY_ID, INFO_ID, INFO_DES)
      values (@cpyId, @tel, ''), (@cpyId, @address, ''), (@cpyId, @introduction, '')`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
      return res.redirect('/company')
    }else{
      res.render('jh_cpnyInfo', {cpnyInfo})
    }
  })
})

module.exports = router