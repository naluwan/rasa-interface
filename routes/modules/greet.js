const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.put('/:greet_no', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const {greet_no} = req.params
  const {GREET_DES} = req.body

  const errors = []

  const request = new sql.Request(pool)
  request.query(`select a.GREET_NO, b.GREET_NAME, a.GREET_DES
  from BOTFRONT_GREET_INFO a
  left join BOTFRONT_ALL_GREET b
  on a.GREET_NO = b.GREET_ID
  where a.CPY_NO = '${cpyNo}' and a.GREET_NO = ${greet_no}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    result = result.recordset[0]
    if(!result) errors.push({message: '查無此資料，請重新嘗試!'})
    if(errors.length){
      request.query(`select a.GREET_NO, b.GREET_NAME, a.GREET_DES
      from BOTFRONT_GREET_INFO a
      left join BOTFRONT_ALL_GREET b
      on a.GREET_NO = b.GREET_ID
      where a.CPY_NO = '${cpyNo}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const greetInfo = result.recordset
      res.render('greet', {greetInfo, errors})
      }) 
    }else{
      request.input('des', sql.NVarChar(2000), GREET_DES)
      .query(`update BOTFRONT_GREET_INFO
      set GREET_DES = @des
      where CPY_NO = '${cpyNo}' and GREET_NO = ${greet_no}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.redirect('/greet')
      })
    }
  })
})

router.get('/:greet_no/edit', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const {greet_no} = req.params

  const errors = []

  const request = new sql.Request(pool)
  request.query(`select a.GREET_NO, b.GREET_NAME, a.GREET_DES
  from BOTFRONT_GREET_INFO a
  left join BOTFRONT_ALL_GREET b
  on a.GREET_NO = b.GREET_ID
  where a.CPY_NO = '${cpyNo}' and a.GREET_NO = ${greet_no}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    result = result.recordset[0]
    if(!result) errors.push({message: '查無此資料，請重新嘗試!'})
    if(errors.length){
      request.query(`select a.GREET_NO, b.GREET_NAME, a.GREET_DES
      from BOTFRONT_GREET_INFO a
      left join BOTFRONT_ALL_GREET b
      on a.GREET_NO = b.GREET_ID
      where a.CPY_NO = '${cpyNo}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const greetInfo = result.recordset
      res.render('greet', {greetInfo, errors})
      }) 
    }else{
      res.render('edit_greet', {result})
    }
  })
})

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID


  const request = new sql.Request(pool)
  request.query(`select a.GREET_NO, b.GREET_NAME, a.GREET_DES
  from BOTFRONT_GREET_INFO a
  left join BOTFRONT_ALL_GREET b
  on a.GREET_NO = b.GREET_ID
  where a.CPY_NO = '${cpyNo}' order by a.GREET_NO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const greetInfo = result.recordset
    if(greetInfo.length == 0){
      for(i = 2 ; i <= 6; i++){
        request.input(`des${i}`, sql.NVarChar, '')
        .query(`insert into BOTFRONT_GREET_INFO (CPY_NO, GREET_NO, GREET_DES)
        values (${cpyNo}, ${i}, @des${i})`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
      }
      return res.redirect('/greet')
    } else {
      res.render('greet', {greetInfo})
    }
  })
})

module.exports = router