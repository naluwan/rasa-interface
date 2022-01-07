const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const { query } = require('express')

router.delete('/:industry_id', (req, res) => {
  const {industry_id} = req.params
  const request = new sql.Request(pool)

  request.query(`select *
  from BOTFRONT_TYPE_OF_INDUSTRY
  where INDUSTRY_ID = '${industry_id}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const industryCheck = result.recordset[0]
    if(!industryCheck){
      req.flash('error', '查無此產業類別，請重新嘗試!!')
      return res.redirect('/adminIndustryInfo')
    }else{
      request.query(`delete from BOTFRONT_TYPE_OF_INDUSTRY
      where INDUSTRY_ID = '${industry_id}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '產業類別已成功刪除!!')
        return res.redirect('/adminIndustryInfo')
      })
    }
  })
})

router.post('/', (req, res) => {
  const {industry_id, industry_name} = req.body
  const request = new sql.Request(pool)
  const errors = []

  if(!industry_id || !industry_name){
    errors.push({message: '所有欄位都是必填的!!'})
    return res.render('new_adminIndustryInfo', {industry_id, industry_name, errors})
  }

  request.query(`select *
  from BOTFRONT_TYPE_OF_INDUSTRY
  where INDUSTRY_ID = '${industry_id}'
  or INDUSTRY_NAME = '${industry_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const industryCheck = result.recordset[0]
    if(industryCheck){
      if(industryCheck.INDUSTRY_ID == industry_id){
        errors.push({message: '產業類別代號重複，請重新嘗試!!'})
        return res.render('new_adminIndustryInfo', {errors, industry_name})
      }

      if(industryCheck.INDUSTRY_NAME = industry_name){
        errors.push({message: '產業類別名稱重複，請重新嘗試!!'})
        return res.render('new_adminIndustryInfo', {errors, industry_id})
      }
    }else{
      request.input('industry_id', sql.NVarChar(30), industry_id)
      .input('industry_name', sql.NVarChar(200), industry_name)
      .query(`insert into BOTFRONT_TYPE_OF_INDUSTRY (INDUSTRY_ID, INDUSTRY_NAME)
      values (@industry_id, @industry_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '產業類別新增成功!!')
        return res.redirect('/adminIndustryInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  res.render('new_adminIndustryInfo')
})

router.get('/', (req, res) => {
  const {search} = req.query
  const warning = []
  const request = new sql.Request(pool)
  if(!search){
    request.query(`select *
    from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminIndustryInfo = result.recordset
      if(adminIndustryInfo.length == 0) req.flash('warning_msg', '查無產業類別，請先拉到下方點選按鈕新增產業類別!!')
      return res.render('adminIndustryInfo', {adminIndustryInfo, warning})
    })

  }else{
    request.query(`select *
    from BOTFRONT_TYPE_OF_INDUSTRY
    where INDUSTRY_NAME like '%${search}%'
    or INDUSTRY_ID like '%${search}%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminIndustryInfo = result.recordset
      if(adminIndustryInfo.length == 0) warning.push({message: '還未新增過此產業類別，請重新嘗試!!'})
      return res.render('adminIndustryInfo', {adminIndustryInfo, search, warning})
    })
  }
})

module.exports = router