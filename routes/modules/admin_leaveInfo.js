const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsJhWriteInfo, fsJhDeleteNlu, fsUpdateCategoryNlu, fsJhWritePosition, fsWriteLeave, fsWriteSubsidy} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {updateCategory, insertCategory, deleteCategory} = require('../../modules/useSql')

// 徵厲害 admin 刪除假別類別 API
router.get('/delete', isAdmin, (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  if(!infoId) return res.send({status: 'error', message: '查無此類別，請重新嘗試'})
  const data = {
    category: 'leave',
    infoId
  }

  const fsFunc = {
    fsJhDeleteNlu
  }

  deleteCategory(request, res, data, fsFunc)
})

// 徵厲害 admin 編輯假別類別 API
router.get('/:entity/edit/update', isAdmin, (req, res) => {
  const {entity} = req.params
  const {cnName, entity_name, infoId} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'leave',
    infoId,
    entity,
    cnName,
    entity_name
  }

  const fsFunc = {
    fsUpdateCategoryNlu,
    setInfoDict,
    setPositionDict
  }

  updateCategory(request, sql, res, data, fsFunc)
})

// 徵厲害 admin 顯示編輯假別類別頁面
router.get('/:category_id/edit', isAdmin, (req, res) => {
  const {category_id} = req.params
  const admin_edit_category = true
  const category = 'leave'
  const request = new sql.Request(pool)

  request.query(`select LEAVE_NAME as name, ENTITY_NAME as entity_name, LEAVE_ID as id 
  from BF_JH_LEAVE_CATEGORY
  where LEAVE_ID = ${category_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const infoCategory = result.recordset[0]
    if(!infoCategory){
      return res.send('<pre>{"status":"warning","message":"找不到此公司資訊類別，請重新嘗試"}</pre>')
    }else{
      res.render('index', {admin_edit_category, infoCategory, category})
    }
  })
})

// 徵厲害 admin 新增假別類別 API
router.get('/new/insert', isAdmin, (req, res) => {
  const {cnName, entity_name} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'leave',
    cnName,
    entity_name
  }

  const fsFunc = {
    fsJhWriteInfo,
    fsJhWritePosition,
    fsWriteLeave,
    fsWriteSubsidy,
    setInfoDict,
    setPositionDict
  }

  insertCategory(request, sql, res, data, fsFunc)
})

// 徵厲害 admin 顯示新增假別類別頁面
router.get('/new', isAdmin, (req, res) => {
  const admin_new_category = true
  const category = 'leave'
  res.render('index', {admin_new_category, category})
})

router.get('/', isAdmin, (req, res) => {
  const admin_category = true
  const category = 'leave'
  const warning = []
  const request = new sql.Request(pool)

  request.query(`select LEAVE_NAME as cnName, ENTITY_NAME as entity_name, LEAVE_ID as id 
  from BF_JH_LEAVE_CATEGORY`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCategoryInfo = result.recordset
    if(!adminCategoryInfo.length) return res.send('<pre>{"status":"warning","message":"查無公司假別，請拉到下方新增公司假別"}</pre>')
    res.render('index', {adminCategoryInfo, warning, admin_category, category})
  })
})

module.exports = router