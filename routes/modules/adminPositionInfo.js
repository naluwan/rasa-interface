const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const { query } = require('express')

// 刪除職缺類別
router.delete('/:POSITION_ID', (req, res) => {
  const {POSITION_ID} = req.params

  const request = new sql.Request(pool)

  // 驗證是否有這個職缺類別
  request.query(`select * 
  from BOTFRONT_ALL_POSITION
  where POSITION_ID = ${POSITION_ID}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    result = result.recordset[0]
    if(!result){
      req.flash('error', '查無此職缺類別，請重新嘗試!')
      return res.redirect('/adminPositionInfo')
    }
    // 刪除職缺類別
    request.query(`delete
    from BOTFRONT_ALL_POSITION
    where POSITION_ID = ${POSITION_ID}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      req.flash('success_msg', '職缺類別刪除成功!!')
      res.redirect('/adminPositionInfo')
    })
  })
})

// 新增職缺類別
router.post('/', (req, res) => {
  const {industry_no, position_name, position_entity_name} = req.body

  // 驗證欄位
  if(!industry_no || !position_name || !position_entity_name){
    req.flash('error', '所有欄位都是必填的!!')
    return res.redirect('/adminPositionInfo/new')
  }

  // 連接資料庫
  const request = new sql.Request(pool)
  const errors = []

  // 驗證此產業類別中是否有相同的職缺類別
  request.query(`select *
  from BOTFRONT_ALL_POSITION
  where industry_no = '${industry_no}' and POSITION_NAME = '${position_name}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionCheck = result.recordset
    if(positionCheck.length){
      errors.push({message: '職缺類別已存在，請確認後重新嘗試!!'})
      request.query(`select *
      from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const industryInfo = result.recordset
        return res.render('new_adminPositionInfo', {
          errors,
          industry_no,
          position_name,
          position_entity_name,
          industryInfo
        })
      })
    }else{
      request.input('industry_no', sql.NVarChar(30), industry_no)
      .input('position_name', sql.NVarChar(200), position_name)
      .input('position_entity_name', sql.NVarChar(200), position_entity_name)
      .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME)
      values (@industry_no, @position_name, @position_entity_name)`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '新增成功!!')
        res.redirect('/adminPositionInfo')
      })
    }
  })
})

// 顯示新增頁面
router.get('/new', (req, res) => {
  const request = new sql.Request(pool)

  // 抓取產業類別
  request.query(`select *
  from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const industryInfo = result.recordset
    res.render('new_adminPositionInfo', {industryInfo})
  })
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
      return res.redirect('/adminPositionInfo')
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
  const {industryFilter} = req.query
  // let industryInfo = []
  
  // 取得所有分類類別
  request.query(`select *
  from BOTFRONT_TYPE_OF_INDUSTRY`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const industryInfo = result.recordset

    // console.log(industryFilter)

    if(!industryFilter || industryFilter == ''){
      // 如果沒有選擇分類，顯示所有結果
      request.query(`select a.POSITION_ID, a.POSITION_NAME, a.POSITION_ENTITY_NAME, a.TRAINED, a.HAD_READ, b.INDUSTRY_NAME
      from BOTFRONT_ALL_POSITION a
      left join BOTFRONT_TYPE_OF_INDUSTRY b
      on a.INDUSTRY_NO = b.INDUSTRY_ID`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        const adminPositionInfo = result.recordset
        return res.render('adminPositionInfo', {adminPositionInfo, industryInfo})
      })
    }else{
      // 有選擇分類的話，顯示篩選後結果
      request.query(`select a.POSITION_ID, a.POSITION_NAME, a.POSITION_ENTITY_NAME, a.TRAINED, a.HAD_READ, b.INDUSTRY_NAME
      from BOTFRONT_ALL_POSITION a
      left join BOTFRONT_TYPE_OF_INDUSTRY b
      on a.INDUSTRY_NO = b.INDUSTRY_ID
      where b.INDUSTRY_NAME = '${industryFilter}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        // console.log(industryInfo)
        const adminPositionInfo = result.recordset
        return res.render('adminPositionInfo', {adminPositionInfo, industryInfo, industryFilter})
      })
    }
  })
})

module.exports = router