const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes} = require('../../modules/useSql')

// 顯示編輯職缺頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_des = true
  const category = 'position'
  const request = new sql.Request(pool)

  request.query(`select b.POSITION_NAME as name, a.POSITION_DES as des, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const desInfo = result.recordset[0]
    desInfo.des = desInfo.des.replace(/\n/g, "\r")
    if(!desInfo){
      req.flash('error', '查無此職缺，請重新嘗試')
      return res.redirect('/jh_position')
    }
    res.render('index', {desInfo, jh_edit_des, category})
  })
})

// 徵厲害刪除職缺API
router.get('/delete', (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'position',
    infoId
  }

  deleteDes(request, res, data)
})

// 徵厲害編輯職缺API
router.get('/:entity_name/edit/update', (req, res) => {
  const {entity_name} = req.params
  const {des, infoId} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: 'position',
    entity_name,
    des,
    infoId
  }

  updateDes(request, sql, res, data)
})

// 徵厲害新增職缺API
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
    category: 'position',
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

// 顯示新增position頁面
router.get('/new', (req, res) => {
  const jh_new_des = true
  const category = 'position'

  res.render('index', {jh_new_des, category})
})


// 顯示position頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const jh_des = true
  const category = 'position'
  const warning = []

  request.query(`select a.POSITION_DES as des, b.POSITION_NAME as name, b.ENTITY_NAME as entity_name, a.INFO_ID as infoId
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where CPY_ID = '${cpnyId}'
  order by b.POSITION_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const desInfo = result.recordset
    desInfo.forEach(info => {
      info.des = info.des.replace(/\n/g, "\r")
    })

		if(!desInfo.length) warning.push({message: '還未新增職缺，請拉到下方點選按鈕新增職缺'})
		return res.render('index', {desInfo, warning, jh_des, category})
  })
})

module.exports = router
