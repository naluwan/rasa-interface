const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const { query } = require('express')


router.delete('/:info_id', (req, res) => {
  const {info_id} = req.params
  const request = new sql.Request(pool)
  request.query(`select *
  from BOTFRONT_ALL_COMPANY_INFO
  where INFO_ID = ${info_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    result = result.recordset[0]
    if(!result){
      req.flash('error', '找不到此公司資訊類別，請重新嘗試!!')
      return res.redirect('/adminCompanyInfo')
    }
    request.query(`delete 
    from BOTFRONT_ALL_COMPANY_INFO
    where INFO_ID = ${info_id}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      req.flash('success_msg', '已成功刪除公司資訊類別!!')
      res.redirect('/adminCOmpanyInfo')
    })
  })
})

router.post('/', (req, res) => {
  const {info_name, info_entity_name} = req.body
  const errors = []
  const request = new sql.Request(pool)
  if(!info_name || !info_entity_name){
    errors.push({message: '所有欄位都是必填的!!'})
    return res.render('new_adminCompanyInfo', {info_name, info_entity_name, errors})
  }

  request.query(`select *
  from BOTFRONT_ALL_COMPANY_INFO
  where INFO_NAME = '${info_name}' or INFO_ENTITY_NAME = '${info_entity_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const infoCheck = result.recordset
    if(infoCheck.length){
      errors.push({message: '此資訊名稱或英文名稱重複，請確認後重新嘗試!!'})
      return res.render('new_adminCompanyInfo',{
        errors,
        info_name,
        info_entity_name
      })
    }else{
      request.input('info_name', sql.NVarChar(200), info_name)
      .input('info_entity_name', sql.NVarChar(200), info_entity_name)
      .query(`insert into BOTFRONT_ALL_COMPANY_INFO (INFO_NAME, INFO_ENTITY_NAME)
      values (@info_name, @info_entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '新增公司資訊類別成功!!')
        res.redirect('/adminCompanyInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  res.render('new_adminCompanyInfo')
})

router.get('/', (req, res) => {
  const {search} = req.query
  const warning = []
  const request = new sql.Request(pool)
  if(!search){
    request.query(`select *
    from BOTFRONT_ALL_COMPANY_INFO`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset
      if(!adminCompanyInfo || adminCompanyInfo == '') warning.push({message: '查無公司資訊類別，請拉到下方新增公司資訊類別!'})
      res.render('adminCompanyInfo', {adminCompanyInfo, warning})
    })
  }else{
    request.query(`select *
    from BOTFRONT_ALL_COMPANY_INFO
    where INFO_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminCompanyInfo = result.recordset
      if(!adminCompanyInfo) warning.push({message: '還未新增過此公司資訊類別!'})
      res.render('adminCompanyInfo', {adminCompanyInfo, warning, search})
    })
  }
})

module.exports = router