const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsWriteSubsidy} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')


router.delete('/:subsidy_name/:subsidy_id', (req, res) => {
  const {subsidy_name,subsidy_id} = req.params
  const request = new sql.Request(pool)
  request.query(`select *
  from BF_JH_SUBSIDY_CATEGORY
  where SUBSIDY_ID = ${subsidy_id}
  and SUBSIDY_NAME = '${subsidy_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    result = result.recordset[0]
    if(!result){
      req.flash('error', '查無此補助類別，請重新嘗試!!')
      return res.redirect('/admin_subsidyInfo')
    }else{
      request.query(`delete
      from BF_JH_SUBSIDY_CATEGORY
      where SUBSIDY_ID = ${subsidy_id}
      and SUBSIDY_NAME = '${subsidy_name}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '已成功刪除公司補助類別!!')
        res.redirect('/admin_subsidyInfo')
      })
    }
  })
})

router.post('/', (req, res) => {
  const {name, entity_name} = req.body
  const request = new sql.Request(pool)
  const admin_new_subsidyInfo = true
  const warning = []

  if(!name || !entity_name){
    warning.push({message: '所有欄位都是必填的!!'})
    return res.render('index', {name, entity_name, warning, admin_new_subsidyInfo})
  }

  request.query(`select *
  from BF_JH_SUBSIDY_CATEGORY
  where SUBSIDY_NAME = '${name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyCheck = result.recordset[0]
    if(subsidyCheck){
      warning.push({message: '此補助津貼類別已存在，請確認後重新嘗試!!'})
      return res.render('index', {
        warning,
        name,
        entity_name,
        admin_new_subsidyInfo
      })
    }else{
      request.input('name', sql.NVarChar(20), name)
      .input('entity_name', sql.NVarChar(50), entity_name)
      .query(`insert into BF_JH_SUBSIDY_CATEGORY (SUBSIDY_NAME, ENTITY_NAME)
      values (@name, @entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        // 寫檔及寫入dict
        fsWriteSubsidy(name, entity_name, request)
        setInfoDict(name)

        req.flash('success_msg', '新增公司補助類別成功!!')
        res.redirect('/admin_subsidyInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  const admin_new_subsidyInfo = true
  res.render('index', {admin_new_subsidyInfo})
})

router.get('/', (req, res) => {
  const {search} = req.query
  const admin_subsidyInfo = true
  const warning = []
  const request = new sql.Request(pool)
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g
  if(!search){
    request.query(`select *
    from BF_JH_SUBSIDY_CATEGORY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSubsidyInfo = result.recordset
      if(!adminSubsidyInfo.length) warning.push({message: '查無公司補助類別，請拉到下方新增公司補助類別!!!'})
      res.render('index', {adminSubsidyInfo, warning, admin_subsidyInfo})
    })
  }else{
    // 驗證搜尋字串是否有非法字元
    if(regex.test(search)){
      req.flash('warning_msg', '搜尋字串包含非法字元，請重新嘗試!')
      return res.redirect('/admin_subsidyInfo')
    }

    request.query(`select *
    from BF_JH_SUBSIDY_CATEGORY
    where SUBSIDY_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSubsidyInfo = result.recordset
      if(!adminSubsidyInfo.length) warning.push({message: '查無此補助!'})
      res.render('index', {adminSubsidyInfo, warning, search, admin_subsidyInfo})
    })
  }
})

module.exports = router