const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes} = require('../../modules/useSql')

// 顯示編輯補助津貼內容頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_subsidy = true
  const request = new sql.Request(pool)

  request.query(`select a.SUBSIDY_DES as des, b.SUBSIDY_NAME as name, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyInfo = result.recordset[0]
    subsidyInfo.des = subsidyInfo.des.replace(/\n/g, "\r")
    if(!subsidyInfo){
      req.flash('warning_msg', '查無此補助津貼資料，請重新嘗試')
      return res.redirect('/jh_subsidy')
    }else{
      res.render('index', {subsidyInfo, jh_edit_subsidy})
    }
  })
})

// 徵厲害刪除補助API
router.get('/delete', (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'subsidy',
    infoId
  }

  deleteDes(request, res, data)
})

// 徵厲害編輯補助API
router.get('/:entity_name/edit/update', (req, res) => {
  const {entity_name} = req.params
  const {des, infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'subsidy',
    entity_name,
    des,
    infoId
  }

  updateDes(request, sql, res, data)
})

// 徵厲害新增補助API
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
    category: 'subsidy',
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

// 顯示新增津貼補助畫面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_subsidy = true
  const route = 'johnnyHire'
  const action = 'new'
  const category = 'subsidy'

  res.render('index', {id:cpnyId, jh_new_subsidy, route, action, category})
})

// 顯示補助津貼頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select a.SUBSIDY_DES, b.SUBSIDY_NAME, b.SUBSIDY_ID, b.ENTITY_NAME, a.INFO_ID as infoId
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where CPY_ID = '${cpnyId}'
  order by b.SUBSIDY_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyInfo = result.recordset
    subsidyInfo.forEach(info => {
      info.SUBSIDY_DES = info.SUBSIDY_DES.replace(/\n/g, "\r")
    })
    const jh_subsidy = true
    if(!subsidyInfo.length) warning.push({message: '還未新增補助津貼，請拉到下方點選按鈕新增補助津貼'})
    res.render('index', {subsidyInfo, jh_subsidy, warning, cpnyId})
  })
})

module.exports = router