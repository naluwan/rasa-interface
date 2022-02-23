const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsJhWritePosition} = require('../../modules/fileSystem')
const {setPositionDict} = require('../../modules/setDict')

// 刪除職缺類別
router.delete('/:position_name/:position_id', (req, res) => {
  const {position_name, position_id} = req.params

  const request = new sql.Request(pool)

  // 驗證是否有這個職缺類別
  request.query(`select * 
  from BF_JH_POSITION_CATEGORY
  where POSITION_ID = ${position_id}
  and POSITION_NAME = '${position_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    result = result.recordset[0]
    if(!result){
      req.flash('error', '查無此職缺類別，請重新嘗試!')
      return res.redirect('/admin_positionInfo')
    }
    // 刪除職缺類別
    request.query(`delete
    from BF_JH_POSITION_CATEGORY
    where POSITION_ID = ${position_id}
    and POSITION_NAME = '${position_name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      req.flash('success_msg', '職缺類別刪除成功!!')
      res.redirect('/admin_positionInfo')
    })
  })
})

// 新增職缺類別
router.post('/', (req, res) => {
  const {name, entity_name} = req.body
  const admin_new_positionInfo = true
  const request = new sql.Request(pool)
  const errors = []
  const warning = []
  // 驗證欄位
  if(!name || !entity_name){
    warning.push({message: '所有欄位都是必填的!'})
    return res.render('index', {name, entity_name, warning, admin_new_positionInfo})
  }

  // 驗證此產業類別中是否有相同的職缺類別
  request.query(`select *
  from BF_JH_POSITION_CATEGORY
  where POSITION_NAME = '${name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionCheck = result.recordset[0]
    if(positionCheck){
      errors.push({message: '此職缺類別已存在，請後重新嘗試!!'})
        return res.render('index', {
          errors,
          name,
          entity_name,
          admin_new_positionInfo
        })
    }else{
      request.input('name', sql.NVarChar(200), name)
      .input('entity_name', sql.NVarChar(200), entity_name)
      .query(`insert into BF_JH_POSITION_CATEGORY (POSITION_NAME, ENTITY_NAME)
      values (@name, @entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        fsJhWritePosition(name, entity_name, request)
        setPositionDict(name)
        req.flash('success_msg', '新增職缺類別成功!!')
        res.redirect('/admin_positionInfo')
      })
    }
  })
})

// 顯示新增頁面
router.get('/new', (req, res) => {
  const admin_new_positionInfo = true
  res.render('index', {admin_new_positionInfo})
})

// 顯示今日新增且未讀的職缺類別
router.get('/notRead', (req, res) => {
  const request = new sql.Request(pool)

  // 查詢未讀的職缺類別
  request.query(`select a.POSITION_ID, a.POSITION_NAME, a.POSITION_ENTITY_NAME, a.TRAINED, a.HAD_READ, b.INDUSTRY_NAME
  from BOTFRONT_ALL_POSITION a
  left join BOTFRONT_TYPE_OF_INDUSTRY b
  on a.INDUSTRY_NO = b.INDUSTRY_ID
  where a.HAD_READ = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminPositionInfo = result.recordset
    if(adminPositionInfo.length == 0){
      req.flash('warning', '沒有未讀的職缺類別!')
      return res.redirect('/admin_positionInfo')
    }else{
      request.query(`select *
      from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const industryInfo = result.recordset
        // 點擊顯示後將未讀改成已讀
        adminPositionInfo.forEach(position => {
          request.query(`update BOTFRONT_ALL_POSITION
          set HAD_READ = 1
          where POSITION_ID = ${position.POSITION_ID}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
          })
        })
        return res.render('adminPositionInfo', {adminPositionInfo, industryInfo})
      })
    }
  })
})

// 點擊完成訓練後更新SQL資料庫TRAINED狀態
router.put('/trained/:position_id', (req, res) => {
  const {position_id} = req.params
  const request = new sql.Request(pool)

  // 驗證職缺類別是否存在
  request.query(`select *
  from BOTFRONT_ALL_POSITION
  where POSITION_ID = ${position_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionCheck = result.recordset[0]

    if(!positionCheck){
      req.flash('error', '查無此職缺類別!請重新嘗試!!')
      return res.redirect('/adminPositionInfo/notTrained')
    }else{
      request.query(`update BOTFRONT_ALL_POSITION
      set TRAINED = 1
      where POSITION_ID = ${position_id}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', `職缺類別：『${positionCheck.POSITION_NAME}』已訓練完成`)
        // 查詢是否還有未訓練的職缺類別
        request.query(`select * 
        from BOTFRONT_ALL_POSITION
        where TRAINED = 0`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const trainedCheck = result.recordset
          if(trainedCheck.length > 0){
            return res.redirect('/adminPositionInfo/notTrained')
          }else{
            req.flash('success_msg', '所有職缺類別已訓練完成!!')
            return res.redirect('/')
          }
        })
        
      })
    }
  })
})

// 顯示沒有訓練過的職缺類別
router.get('/notTrained', (req, res) => {
  const request = new sql.Request(pool)

  request.query(`select a.POSITION_ID, a.POSITION_NAME, a.POSITION_ENTITY_NAME, a.TRAINED, a.HAD_READ, b.INDUSTRY_NAME
  from BOTFRONT_ALL_POSITION a
  left join BOTFRONT_TYPE_OF_INDUSTRY b
  on a.INDUSTRY_NO = b.INDUSTRY_ID
  where a.TRAINED = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const adminPositionInfo = result.recordset
    if(adminPositionInfo.length == 0){
      req.flash('warning', '沒有需要訓練的職缺類別!')
      return res.redirect('/adminPositionInfo')
    }else{
      request.query(`select *
      from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const industryInfo = result.recordset
        adminPositionInfo.forEach(position => {
          request.query(`update BOTFRONT_ALL_POSITION
          set HAD_READ = 1
          where POSITION_ID = ${position.POSITION_ID}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
          })
        })
        return res.render('adminPositionInfo', {adminPositionInfo, industryInfo})
      })
    }
  })
})

router.get('/', (req, res) => {
  const request = new sql.Request(pool)
  const {search} = req.query
  const warning = []
  const admin_positionInfo = true
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

    if(!search){
      // 如果沒有搜尋字串，顯示所有結果
      request.query(`select * 
      from BF_JH_POSITION_CATEGORY`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        const adminPositionInfo = result.recordset 
        if(adminPositionInfo.length == 0) warning.push({message: '查無職缺類別，請拉到下方新增職缺類別!'})
        return res.render('index', {adminPositionInfo, admin_positionInfo, warning})
      })
    }else{
      // 驗證搜尋字串是否有非法字元
      if(regex.test(search)){
        req.flash('warning_msg', '搜尋字串包含非法字元，請重新嘗試!')
        return res.redirect('/admin_positionInfo')
      }

      // 有選擇分類的話，顯示篩選後結果
      request.query(`select *
      from BF_JH_POSITION_CATEGORY
      where POSITION_NAME like '%%${search}%%'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const adminPositionInfo = result.recordset
        return res.render('index', {adminPositionInfo, admin_positionInfo})
      })
    }
})

module.exports = router