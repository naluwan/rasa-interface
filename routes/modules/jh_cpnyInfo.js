const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes} = require('../../modules/useSql')

// 顯示編輯公司資訊頁面
router.get('/:entity_name/edit', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const {entity_name} = req.params
  const jh_edit_des = true
  const category = 'cpnyinfo'
  const request = new sql.Request(pool)

  request.query(`select a.CPNYINFO_DES as des, b.CPNYINFO_NAME as name, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const desInfo = result.recordset[0]
    desInfo.des = desInfo.des.replace(/\n/g,"\r")
    if(!desInfo){
      req.flash('warning_msg', '查無此資訊資料，請重新嘗試')
      return res.redirect('/jh_cpnyInfo')
    }else{
      res.render('index', {desInfo, jh_edit_des, category})
    }
  })
})

// 徵厲害刪除資訊API
router.get('/delete', (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'cpnyinfo',
    infoId
  }

  deleteDes(request, res, data)
})

// 徵厲害編輯資訊API
router.get('/:entity_name/edit/update', (req, res) => {
  const {entity_name} = req.params
  const {des, infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'cpnyinfo',
    entity_name,
    des,
    infoId
  }

  updateDes(request, sql, res, data)
})

// 徵厲害新增資訊API
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
    category: 'cpnyinfo',
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

// 顯示公司新增資訊頁面
router.get('/new', (req, res) => {
  const jh_new_des = true
  const category = 'cpnyinfo'

  res.render('index', {jh_new_des, category})
})

// 顯示公司資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const jh_des = true
  const category = 'cpnyinfo'
  const warning = []

  // 抓取公司資訊
  request.query(`select a.CPNYINFO_DES as des, b.CPNYINFO_NAME as name, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where CPY_ID = '${cpnyId}'
  order by b.CPNYINFO_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const desInfo = result.recordset
    desInfo.forEach(info => {
      info.des = info.des.replace(/\n/g, "\r")
    })

		if(!desInfo.length){
      warning.push({message: '還未新增公司資訊，請拉到下方點選按鈕新增公司資訊'})
      warning.push({message: 'ex.地址、電話、簡介、福利、上班時間等公司相關資訊'})
    }
    res.render('index', {desInfo, warning, jh_des, category})
    
  })
})

module.exports = router