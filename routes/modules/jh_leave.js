const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsWriteSubsidy} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_leave = true
  
  request.query(`select a.LEAVE_DES, b.LEAVE_ID, b.LEAVE_NAME
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where a.CPY_ID = ${cpnyId}
  order by b.LEAVE_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const leaveInfo = result.recordset
    if(!leaveInfo.length) warning.push({message: '還未新增假別資訊，請拉到下方點選按鈕新增假別資訊!!'})
    res.render('index', {leaveInfo, cpnyId, warning, jh_leave})
  })
})

module.exports = router