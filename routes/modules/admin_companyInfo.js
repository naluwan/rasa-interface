const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsJhWriteInfo, fsJhDeleteNlu} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')


router.delete('/:name/:info_id', (req, res) => {
  const {name, info_id} = req.params
  const request = new sql.Request(pool)
  request.query(`select *
  from BF_JH_CPNYINFO_CATEGORY
  where CPNYINFO_ID = ${info_id}
  and CPNYINFO_NAME = '${name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpynyInfoCheck = result.recordset[0]
    if(!cpynyInfoCheck){
      req.flash('error', '找不到此公司資訊類別，請重新嘗試!!')
      return res.redirect('/admin_companyInfo')
    }else{
      request.query(`delete 
      from BF_JH_CPNYINFO_CATEGORY
      where CPNYINFO_ID = ${info_id}
      and CPNYINFO_NAME = '${name}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        fsJhDeleteNlu(cpynyInfoCheck.CPNYINFO_NAME, '問公司資訊', request)
        req.flash('success_msg', '已成功刪除公司資訊類別!!')
        res.redirect('/admin_companyInfo')
      })
    }
  })
})

router.post('/', (req, res) => {
  const {info_name, entity_name} = req.body
  const errors = []
  const admin_new_companyInfo = true
  const request = new sql.Request(pool)

  if(!info_name || !entity_name){
    errors.push({message: '所有欄位都是必填的!!'})
    return res.render('index', {info_name, entity_name, errors, admin_new_companyInfo})
  }

  request.query(`select *
  from BF_JH_CPNYINFO_CATEGORY
  where CPNYINFO_NAME = '${info_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const infoCheck = result.recordset[0]
    if(infoCheck){
      errors.push({message: '此資訊類別已存在，請重新嘗試!!'})
      return res.render('index',{
        errors,
        info_name,
        entity_name,
        admin_new_companyInfo
      })
    }else{
      request.input('info_name', sql.NVarChar(200), info_name)
      .input('entity_name', sql.NVarChar(200), entity_name)
      .query(`insert into BF_JH_CPNYINFO_CATEGORY (CPNYINFO_NAME, ENTITY_NAME)
      values (@info_name, @entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        // 寫檔及寫入dict
        fsJhWriteInfo(info_name, entity_name, request)
        setInfoDict(info_name)
        req.flash('success_msg', '新增公司資訊類別成功!!')
        res.redirect('/admin_companyInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  const admin_new_companyInfo = true
  res.render('index', {admin_new_companyInfo})
})

router.get('/', (req, res) => {
  const {search} = req.query
  const warning = []
  const request = new sql.Request(pool)
  const admin_companyInfo = true
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(!search){
    request.query(`select *
    from BF_JH_CPNYINFO_CATEGORY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset
      if(!adminCompanyInfo.length) warning.push({message: '查無公司資訊類別，請拉到下方新增公司資訊類別!'})
      res.render('index', {adminCompanyInfo, warning, admin_companyInfo})
    })
  }else{
    // 驗證搜尋字串是否有非法字元
    if(regex.test(search)){
      req.flash('warning_msg', '搜尋字串包含非法字元，請重新嘗試!')
      return res.redirect('/admin_companyInfo')
    }

    request.query(`select *
    from BF_JH_CPNYINFO_CATEGORY
    where CPNYINFO_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset
      if(!adminCompanyInfo.length) warning.push({message: '查無此資訊!'})
      res.render('index', {adminCompanyInfo, warning, search, admin_companyInfo})
    })
  }
})

module.exports = router