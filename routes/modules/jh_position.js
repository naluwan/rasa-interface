const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.get('/new', (req, res) => {
  res.render('jh_new_position')
})

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select *
  from BF_JH_POSITION
  where CPY_ID = '${cpyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const positionResult = result.recordset

		if(positionResult.length == 0) warning.push({message: '還未新增職缺，請拉到下方點選按鈕新增職缺!!'})
		return res.render('jh_position', {positionResult, warning})
  })
})

module.exports = router
