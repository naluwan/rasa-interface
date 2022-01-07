const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const { query } = require('express')


router.delete('/:subsidy_id', (req, res) => {
  const {subsidy_id} = req.params
  const request = new sql.Request(pool)
  request.query(`select *
  from BOTFRONT_ALL_SUBSIDY
  where SUBSIDY_ID = ${subsidy_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    result = result.recordset[0]
    if(!result){
      req.flash('error', '查無此補助類別，請重新嘗試!!')
      return res.redirect('/adminSubsidyInfo')
    }

    request.query(`delete
    from BOTFRONT_ALL_SUBSIDY
    where SUBSIDY_ID = ${subsidy_id}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      req.flash('success_msg', '已成功刪除公司補助類別!!')
      res.redirect('/adminSubsidyInfo')
    })
  })
})

router.post('/', (req, res) => {
  const {subsidy_name, subsidy_entity_name} = req.body
  const request = new sql.Request(pool)
  const errors = []

  if(!subsidy_name || !subsidy_entity_name){
    errors.push({message: '所有欄位都是必填的!!'})
    return res.render('new_adminSubsidyInfo', {subsidy_name, subsidy_entity_name, errors})
  }

  request.query(`select *
  from BOTFRONT_ALL_SUBSIDY
  where SUBSIDY_NAME = '${subsidy_name}' or SUBSIDY_ENTITY_NAME = '${subsidy_entity_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyCheck = result.recordset
    if(subsidyCheck.length){
      errors.push({message: '補助名稱或英文名稱重複，請確認後重新嘗試!!'})
      return res.render('new_adminSubsidyInfo', {
        errors,
        subsidy_name,
        subsidy_entity_name
      })
    }else{
      request.input('subsidy_name', sql.NVarChar(20), subsidy_name)
      .input('subsidy_entity_name', sql.NVarChar(50), subsidy_entity_name)
      .query(`insert into BOTFRONT_ALL_SUBSIDY (SUBSIDY_NAME, SUBSIDY_ENTITY_NAME)
      values (@subsidy_name, @subsidy_entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '新增公司補助類別成功!!')
        res.redirect('/adminSubsidyInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  res.render('new_adminSubsidyInfo')
})

router.get('/', (req, res) => {
  const {search} = req.query
  const warning = []
  const request = new sql.Request(pool)
  if(!search){
    request.query(`select *
    from BOTFRONT_ALL_SUBSIDY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSubsidyInfo = result.recordset
      if(!adminSubsidyInfo || adminSubsidyInfo == '') warning.push({message: '查無公司補助類別，請拉到下方新增公司補助類別!!!'})
      res.render('adminSubsidyInfo', {adminSubsidyInfo, warning})
    })
  }else{
    request.query(`select *
    from BOTFRONT_ALL_SUBSIDY
    where SUBSIDY_NAME like '%${search}%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSubsidyInfo = result.recordset
      if(!adminSubsidyInfo || adminSubsidyInfo == '') warning.push({message: '還未新增過此公司補助類別!'})
      res.render('adminSubsidyInfo', {adminSubsidyInfo, warning, search})
    })
  }
})

module.exports = router