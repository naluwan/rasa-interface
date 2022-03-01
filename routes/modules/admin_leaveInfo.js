const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsWriteLeave, fsJhDeleteNlu} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')


router.delete('/:leave_name/:leave_id', (req, res) => {
  const {leave_name, leave_id} = req.params
  const request = new sql.Request(pool)
  request.query(`select *
  from BF_JH_LEAVE_CATEGORY
  where LEAVE_ID = ${leave_id}
  and LEAVE_NAME = '${leave_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const leaveCheck = result.recordset[0]

    if(!leaveCheck){
      req.flash('error', '查無此假別資訊，請重新嘗試!!')
      return res.redirect('/admin_leaveInfo')
    }else{
      request.query(`delete
      from BF_JH_LEAVE_CATEGORY
      where LEAVE_ID = ${leave_id}
      and LEAVE_NAME = '${leave_name}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        fsJhDeleteNlu(leaveCheck.LEAVE_NAME, '問公司資訊', request)
        req.flash('success_msg', '已成功刪除公司假別!!')
        res.redirect('/admin_leaveInfo')
      })
    }
  })
})

router.post('/', (req, res) => {
  const {name, entity_name} = req.body
  const warning = []
  const admin_new_leaveInfo = true
  const request = new sql.Request(pool)

  if(!name || !entity_name){
    warning.push({message: '所有欄位都是必填的!!'})
    return res.render('index', {name, entity_name, warning, admin_new_leaveInfo})
  }

  request.query(`select *
  from BF_JH_LEAVE_CATEGORY
  where LEAVE_NAME = '${name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const leaveCheck = result.recordset
    if(leaveCheck.length){
      warning.push({message: '此假別類別已存在，請確認後重新嘗試!!'})
      return res.render('index', {
        warning,
        name,
        entity_name,
        admin_new_leaveInfo
      })
    }else{
      request.input('name', sql.NVarChar(20), name)
      .input('entity_name', sql.NVarChar(50), entity_name)
      .query(`insert into BF_JH_LEAVE_CATEGORY (LEAVE_NAME, ENTITY_NAME)
      values (@name, @entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        // 寫檔及寫入dict
        fsWriteLeave(name, entity_name, request)
        setInfoDict(name)

        req.flash('success_msg', '公司假別新增成功!!')
        res.redirect('/admin_leaveInfo')
      })
    }
  })
})

router.get('/new', (req, res) => {
  const admin_new_leaveInfo = true
  res.render('index', {admin_new_leaveInfo})
})

router.get('/', (req, res) => {
  const {search} = req.query
  const admin_leaveInfo = true
  const warning = []
  const request = new sql.Request(pool)
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(!search){
    request.query(`select * 
    from BF_JH_LEAVE_CATEGORY`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminLeaveInfo = result.recordset
      if(!adminLeaveInfo.length) warning.push({message: '查無公司假別，請拉到下方新增公司假別!!'})
      res.render('index', {adminLeaveInfo, warning, admin_leaveInfo})
    })
  }else{
    request.query(`select *
    from BF_JH_LEAVE_CATEGORY
    where LEAVE_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminLeaveInfo = result.recordset
      if(!adminLeaveInfo.length) warning.push({message: '查無此假別!'})
      res.render('index', {adminLeaveInfo, warning, search, admin_leaveInfo})
    })
  }
  
})

module.exports = router