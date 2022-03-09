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

// 徵厲害 admin 刪除職缺類別 API
router.get('/delete', isAdmin, (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  if(!infoId) return res.send({status: 'error', message: '查無此類別，請重新嘗試'})
  const data = {
    category: 'position',
    infoId
  }

  const fsFunc = {
    fsJhDeleteNlu
  }

  deleteCategory(request, res, data, fsFunc)
})

// 徵厲害 admin 編輯職缺類別 API
router.get('/:entity/edit/update', isAdmin, (req, res) => {
  const {entity} = req.params
  const {cnName, entity_name, infoId} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'position',
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

// 徵厲害 admin 顯示編輯職缺類別頁面
router.get('/:entity_name/edit', isAdmin, (req, res) => {
  const {entity_name} = req.params
  const admin_edit_category = true
  const category = 'position'
  const request = new sql.Request(pool)

  request.query(`select POSITION_NAME as name, ENTITY_NAME as entity_name, POSITION_ID as id 
  from BF_JH_POSITION_CATEGORY
  where ENTITY_NAME = '${entity_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const infoCategory = result.recordset[0]
    if(!infoCategory){
      req.flash('error', '找不到此公司資訊類別，請重新嘗試')
      return res.redirect('/admin_positionInfo')
    }else{
      res.render('index', {admin_edit_category, infoCategory, category})
    }
  })
})

// 徵厲害 admin 新增職缺類別 API
router.get('/new/insert', isAdmin, (req, res) => {
  const {cnName, entity_name} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'position',
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

// 徵厲害 admin 顯示新增缺類別頁面
router.get('/new', isAdmin, (req, res) => {
  const admin_new_category = true
  const category = 'position'
  res.render('index', {admin_new_category, category})
})

router.get('/', isAdmin, (req, res) => {
  const request = new sql.Request(pool)
  const warning = []
  const admin_category = true
  const category = 'position'

  // 如果沒有搜尋字串，顯示所有結果
  request.query(`select POSITION_NAME as cnName, ENTITY_NAME as entity_name, POSITION_ID as id 
  from BF_JH_POSITION_CATEGORY`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const adminCategoryInfo = result.recordset 
    if(adminCategoryInfo.length == 0) warning.push({message: '查無職缺類別，請拉到下方新增職缺類別'})
    return res.render('index', {adminCategoryInfo, admin_category, warning, category})
  })
})

module.exports = router