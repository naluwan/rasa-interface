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

// 徵厲害 admin 刪除資訊類別 API
router.get('/delete', isAdmin, (req, res) => {
  const {infoId} = req.query
  const request = new sql.Request(pool)

  if(!infoId) return res.send({status: 'error', message: '查無此類別，請重新嘗試'})
  const data = {
    category: 'cpnyinfo',
    infoId
  }

  const fsFunc = {
    fsJhDeleteNlu
  }

  deleteCategory(request, res, data, fsFunc)
})

// 徵厲害 admin 編輯資訊類別 API
router.get('/:entity/edit/update', isAdmin, (req, res) => {
  const {entity} = req.params
  const {cnName, entity_name, infoId} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'cpnyinfo',
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

// 徵厲害 admin 顯示編輯資訊頁面
router.get('/:entity_name/edit', isAdmin, (req, res) => {
  const {entity_name} = req.params
  const admin_edit_category = true
  const category = 'cpnyinfo'
  const request = new sql.Request(pool)

  request.query(`select CPNYINFO_NAME as name, ENTITY_NAME as entity_name, CPNYINFO_ID as id 
  from BF_JH_CPNYINFO_CATEGORY
  where ENTITY_NAME = '${entity_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const infoCategory = result.recordset[0]
    if(!infoCategory){
      req.flash('error', '找不到此公司資訊類別，請重新嘗試!!')
      return res.redirect('/admin_companyInfo')
    }else{
      res.render('index', {admin_edit_category, infoCategory, category})
    }
  })
})

// 徵厲害 admin 新增資訊類別 API
router.get('/new/insert', isAdmin, (req, res) => {
  const {cnName, entity_name} = req.query
  const request = new sql.Request(pool)

  if(!cnName || !entity_name) return res.send({status: 'warning', message: '所有欄位都是必填的'})

  const data = {
    category: 'cpnyinfo',
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

// 徵厲害 admin 顯示新增資訊類別頁面
router.get('/new', isAdmin, (req, res) => {
  const admin_new_category = true
  const category = 'cpnyinfo'
  res.render('index', {admin_new_category, category})
})

router.get('/', isAdmin, (req, res) => {
  const {search} = req.query
  const warning = []
  const request = new sql.Request(pool)
  const admin_category = true
  const category = 'cpnyinfo'
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(!search){
    request.query(`select CPNYINFO_NAME as cnName, ENTITY_NAME as entity_name, CPNYINFO_ID as id
    from BF_JH_CPNYINFO_CATEGORY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCategoryInfo = result.recordset
      if(!adminCategoryInfo.length) warning.push({message: '查無公司資訊類別，請拉到下方新增公司資訊類別!'})
      res.render('index', {adminCategoryInfo, warning, admin_category, category})
    })
  }else{
    // 驗證搜尋字串是否有非法字元
    if(regex.test(search)){
      req.flash('warning_msg', '搜尋字串包含非法字元，請重新嘗試!')
      return res.redirect('/admin_companyInfo')
    }

    request.query(`select CPNYINFO_NAME as cnName, ENTITY_NAME as entity_name, CPNYINFO_ID as id
    from BF_JH_CPNYINFO_CATEGORY
    where CPNYINFO_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCategoryInfo = result.recordset
      if(!adminCategoryInfo.length) warning.push({message: '查無此資訊!'})
      res.render('index', {adminCategoryInfo, warning, search, admin_category, category})
    })
  }
})

module.exports = router