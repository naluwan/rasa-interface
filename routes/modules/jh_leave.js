const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, editDes, deleteDes} = require('../../modules/useSql')

// 顯示編輯假別資訊頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_leave = true
  const request = new sql.Request(pool)

  request.query(`select a.LEAVE_DES as des, b.LEAVE_NAME as name, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const leaveInfo = result.recordset[0]
    leaveInfo.des = leaveInfo.des.replace(/\n/g, "\r")
    if(!leaveInfo){
      req.flash('warning_msg', '查無此假別資訊資料，請重新嘗試')
      return res.redirect('/jh_leave')
    }else{
      res.render('index', {leaveInfo, jh_edit_leave})
    }
  })

})

// 徵厲害刪除假別API
router.get('/delete', (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'leave',
    infoId
  }

  deleteDes(request, res, data)
})

// 徵厲害編輯假別API
router.get('/:entity_name/edit/update', (req, res) => {
  const {entity_name} = req.params
  const {des, infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'leave',
    entity_name,
    des,
    infoId
  }

  editDes(request, sql, res, data)
})

// 徵厲害新增假別API
router.get('/new/insert', async (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const {cnName, entity_name, des} = req.query
  const request = new sql.Request(pool)
  const num = await randomNum(cpnyId, request, checkNum)

  if(!cnName || !entity_name || !des){
    return res.send({status: 'warning', message: '所有欄位都為必填欄位'})
  }
  const data = {
    category: 'leave',
    cpnyId,
    cnName,
    entity_name,
    des,
    num
  }

  const fsFunc = {
    fsJhWriteInfo,
    fsJhWritePosition,
    fsWriteSubsidy,
    fsWriteLeave,
    setInfoDict,
    setPositionDict
  }

  insertDes(request, sql, res, data, fsFunc)
})

// 顯示新增假別頁面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_leave = true
  const route = 'johnnyHire'
  const action = 'new'
  const category = 'leave'
  
  res.render('index', {jh_new_leave, id: cpnyId, route, action, category})
})

// 顯示假別資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_leave = true
  
  request.query(`select a.LEAVE_DES, b.LEAVE_ID, b.LEAVE_NAME, b.ENTITY_NAME, a.INFO_ID as infoId
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
    leaveInfo.forEach(info => {
      info.LEAVE_DES = info.LEAVE_DES.replace(/\n/g, "\r")
    })
    if(!leaveInfo.length) warning.push({message: '還未新增假別資訊，請拉到下方點選按鈕新增假別資訊'})
    res.render('index', {leaveInfo, warning, jh_leave})
  })
})

module.exports = router