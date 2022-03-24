const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes} = require('../../modules/useSql')

// 徵厲害 admin 刪除各公司資訊內容
router.get('/delete', isAdmin, (req, res) => {
  const {infoId, category} = req.query
  const request = new sql.Request(pool)

  const data = {
    infoId,
    category
  }

  deleteDes(request, res, data)
})

// 徵厲害 admin 新增各公司資訊內容
router.get('/new/insert', isAdmin, async (req, res) => {
  const {cpnyId, category, cnName, entity_name, des} = req.query
  const request = new sql.Request(pool)
  const num = await randomNum(cpnyId, request, checkNum)

  if(!cpnyId || !category || !cnName || !entity_name || !des) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    cpnyId,
    category,
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

// 徵厲害 admin 顯示新增頁面
router.get('/new', (req, res) => {
  const admin_new_search = true
  const request = new sql.Request(pool)

  request.query(`select *
  from BOTFRONT_USERS_INFO
  where ISHR = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset
    if(adminCompany.length == 1) return res.send('<pre>{"status":"warning","message":"還未新增公司，請先註冊公司帳號"}</pre>')
    res.render('index', {adminCompany, admin_new_search})
  })
})

// 徵厲害 admin 編輯各公司資訊內容
router.get('/:table/:entity_name/:infoId/edit/update', isAdmin, (req, res) => {
  const {table, entity_name, infoId} = req.params
  const {des} = req.query
  const request = new sql.Request(pool)

  const data = {
    category: table,
    entity_name,
    des,
    infoId
  }

  updateDes(request, sql, res, data)
})

// 徵厲害 admin 顯示編輯頁面
router.get('/:table/:entity_name/:infoId/edit', (req, res) => {
  const {table, entity_name, infoId} = req.params
  const admin_edit_search = true
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select b.${table}_NAME as adminSearch_name, a.${table}_DES as adminSearch_des, a.INFO_ID as infoId, b.ENTITY_NAME as adminSearch_entity_name, a.CPY_ID as cpnyId
  from BF_JH_${table} a
  left join BF_JH_${table}_CATEGORY b
  on a.${table}_ID = b.${table}_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.INFO_ID = '${infoId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminSearchInfo = result.recordset[0]
    if(!adminSearchInfo){
      return res.send('<pre>{"status":"warning","message":"查無此筆資料，請重新嘗試"}</pre>')
    }else{
      adminSearchInfo.adminSearch_des = adminSearchInfo.adminSearch_des.replace(/\n/g, "\r")
      res.render('index', {adminSearchInfo, table, entity_name, admin_edit_search})
    }
  })
})

// 徵厲害 admin 篩選公司及類別進行查詢並顯示頁面
router.get('/filter', (req, res) => {
  const {companyFilter, tableFilter, search} = req.query
  const admin_search = true
  const request = new sql.Request(pool)
  const warning = []

  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(regex.test(search) || regex.test(companyFilter) || regex.test(tableFilter)){
    return res.send('<pre>{"status":"warning","message":"搜尋字串包含非法字元，請重新嘗試"}</pre>')
  }

  if(search && (!companyFilter || !tableFilter)){
    return res.send('<pre>{"status":"warning","message":"請先選擇公司及分類再進行查詢"}</pre>')
  }

  // 獲取所有公司資料 => 選取公司的下拉選單
  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where ISHR = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset

    // 如果使用者只有一間(代表只有admin帳戶)
    if(adminCompany.length == 1){
      return res.send('<pre>{"status":"warning","message":"還未新增公司，請先註冊公司帳號"}</pre>')
    }
    if(!companyFilter || !tableFilter){
      return res.send('<pre>{"status":"warning","message":"公司和類別都是必選的"}</pre>')
    }
    
    request.query(`select a.CPY_ID, c.CPY_NAME, a.${tableFilter}_ID as adminSearch_id, a.${tableFilter}_DES as adminSearch_des, b.${tableFilter}_NAME as adminSearch_name, b.ENTITY_NAME as adminSearch_entity_name, a.INFO_ID as infoId
    from BF_JH_${tableFilter} a
    left join BF_JH_${tableFilter}_CATEGORY b
    on a.${tableFilter}_ID = b.${tableFilter}_ID
    left join BOTFRONT_USERS_INFO c
    on a.CPY_ID = c.CPY_ID
    where c.CPY_ID = '${companyFilter}'
    and (b.${tableFilter}_NAME like '%%${search}%%'
    or b.ENTITY_NAME like '%%${search}%%'
    or a.${tableFilter}_DES like '%%${search}%%')
    order by b.ENTITY_NAME ASC`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSearchInfo = result.recordset
      adminSearchInfo.forEach(search => {
        search.adminSearch_des = search.adminSearch_des.replace(/\n/g, "\r")
      })
      if(!adminSearchInfo.length){
        return res.send('<pre>{"status":"warning","message":"尚無此回覆資訊，請重新查詢"}</pre>')
      }else{
        res.render('index', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search, admin_search})
      }
    })
  })
})

// 徵厲害 admin 顯示空白查詢頁面
router.get('/', (req, res) => {
  const admin_search = true
  const request = new sql.Request(pool)

  // 獲取所有公司資料 => 選取公司的下拉選單
  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where ISHR = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset

    // 如果使用者只有一間(代表只有admin帳戶)
    if(adminCompany.length == 1){
      return res.send('<pre>{"status":"warning","message":"還未新增公司，請先註冊公司帳號"}</pre>')
    }
    res.render('index', {adminCompany, admin_search})
  })
})

module.exports = router