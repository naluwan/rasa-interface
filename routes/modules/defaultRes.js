const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.put('/:default_no', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const {default_no} = req.params
  const {DEFAULT_DES} = req.body

  const errors = []

  const request = new sql.Request(pool)
  request.query(`select a.DEFAULT_NO, b.DEFAULT_NAME, a.DEFAULT_DES
  from BOTFRONT_DEFAULT_INFO a
  left join BOTFRONT_ALL_DEFAULT b
  on a.DEFAULT_NO = b.DEFAULT_ID
  where a.CPY_NO = '${cpyNo}' and a.DEFAULT_NO = ${default_no}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    result = result.recordset[0]
    if(!result) errors.push({message: '查無此資料，請重新嘗試!'})
    if(errors.length){
      request.query(`select a.DEFAULT_NO, b.DEFAULT_NAME, a.DEFAULT_DES
      from BOTFRONT_DEFAULT_INFO a
      left join BOTFRONT_ALL_DEFAULT b
      on a.DEFAULT_NO = b.DEFAULT_ID
      where a.CPY_NO = '${cpyNo}' order by a.DEFAULT_NO`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const defaultInfo = result.recordset
      res.render('defaultRes', {defaultInfo, errors})
      }) 
    }else{
      request.input('des', sql.NVarChar(2000), DEFAULT_DES)
      .query(`update BOTFRONT_DEFAULT_INFO
      set DEFAULT_DES = @des
      where CPY_NO = '${cpyNo}' and DEFAULT_NO = ${default_no}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.redirect('/defaultRes')
      })
    }
  })
})

router.get('/:default_no/edit', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const {default_no} = req.params

  const errors = []

  const request = new sql.Request(pool)
  request.query(`select a.DEFAULT_NO, b.DEFAULT_NAME, a.DEFAULT_DES
  from BOTFRONT_DEFAULT_INFO a
  left join BOTFRONT_ALL_DEFAULT b
  on a.DEFAULT_NO = b.DEFAULT_ID
  where a.CPY_NO = '${cpyNo}' and a.DEFAULT_NO = ${default_no}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    result = result.recordset[0]
    if(!result) errors.push({message: '查無此資料，請重新嘗試!'})
    if(errors.length){
      request.query(`select a.DEFAULT_NO, b.DEFAULT_NAME, a.DEFAULT_DES
      from BOTFRONT_DEFAULT_INFO a
      left join BOTFRONT_ALL_DEFAULT b
      on a.DEFAULT_NO = b.DEFAULT_ID
      where a.CPY_NO = '${cpyNo}' order by a.DEFAULT_NO`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const defaultInfo = result.recordset
      res.render('defaultRes', {defaultInfo, errors})
      }) 
    }else{
      res.render('edit_defaultRes', {result})
    }
  })
})

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID


  const request = new sql.Request(pool)
  request.query(`select a.DEFAULT_NO, b.DEFAULT_NAME, a.DEFAULT_DES
  from BOTFRONT_DEFAULT_INFO a
  left join BOTFRONT_ALL_DEFAULT b
  on a.DEFAULT_NO = b.DEFAULT_ID
  where a.CPY_NO = '${cpyNo}' order by a.DEFAULT_NO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const defaultInfo = result.recordset
    // console.log(defaultInfo)
    if(defaultInfo.length == 0){
      for(i = 1 ; i <= 3; i++){
        request.input(`des${i}`, sql.NVarChar, '')
        .query(`insert into BOTFRONT_DEFAULT_INFO (CPY_NO, DEFAULT_NO, DEFAULT_DES)
        values (${cpyNo}, ${i}, @des${i})`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
      }
      return res.redirect('/defaultRes')
    } else {
      res.render('defaultRes', {defaultInfo})
    }
  })
})

module.exports = router