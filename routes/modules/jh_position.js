const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWritePosition, fsJhDeletePosition} = require('../../modules/fileSystem')
const {setPositionDict} = require('../../modules/setDict')

// 刪除職缺
router.delete('/:position_id', (req, res) => {
  const {position_id} = req.params
  const cpyId = res.locals.user.CPY_ID
  const request = new sql.Request(pool)

  request.query(`select b.POSITION_NAME 
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where a.POSITION_ID = ${position_id}
  and a.CPY_ID = '${cpyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionDesCheck = result.recordset[0]
    if(!positionDesCheck){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/position')
    }else{
      request.query(`delete from BF_JH_POSITION
      where POSITION_ID = ${position_id}
      and CPY_ID = '${cpyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        // fsJhDeletePosition(positionDesCheck, request)
        req.flash('success_msg', '成功刪除職缺!')
        res.redirect('/position')
      })
    }
  })
})

// 編輯職缺
router.put('/:position_id', (req, res) => {
  const {position_id} = req.params
  const {des} = req.body
  const request = new sql.Request(pool)

  if(!des){
    req.flash('warning_msg', '職缺內容為必填欄位!!')
    return res.redirect(`/position/${position_id}/edit`)
  }

  request.query(`select * 
  from BF_JH_POSITION
  where POSITION_ID = ${position_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const positionDesCheck = result.recordset[0]
    if(!positionDesCheck){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/position')
    }else{
      request.query(`update BF_JH_POSITION
      set POSITION_DES = '${des}'
      where POSITION_ID = ${position_id}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新職缺內容成功!')
        res.redirect('/position')
      })
    }
  })
})

// 顯示編輯職缺頁面
router.get('/:position_id/edit', (req, res) => {
  const {position_id} = req.params
  const request = new sql.Request(pool)

  request.query(`select b.POSITION_NAME as name, b.POSITION_ID as id, a.POSITION_DES as des 
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where a.POSITION_ID = ${position_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionInfo = result.recordset[0]
    if(!positionInfo){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/position')
    }
    res.render('jh_edit_position', {positionInfo})
  })
})

// 新增職缺資訊
router.post('/', (req, res) => {
  const user = res.locals.user
	const cpyId = user.CPY_ID
  const {name, entity_name, des} = req.body
  const request = new sql.Request(pool)
  const errors = []

  if(!name || !entity_name || !des){
    errors.push({message: '所有欄位都是必填的!'})
  }

  if(errors.length){
    return res.render('jh_new_position', {name, entity_name, des, errors})
  }else{
    // 驗證資料庫是否有職缺類別資料
    request.query(`select * 
    from BF_JH_POSITION_CATEGORY
    where POSITION_NAME = '${name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const positionCheck = result.recordset[0]

      if(positionCheck){
        const position_id = positionCheck.POSITION_ID

        // 驗證使用者是否已添加過此職缺資訊
        request.query(`select * 
        from BF_JH_POSITION
        where POSITION_ID = ${position_id}
        and CPY_ID = ${cpyId}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const positionDesCheck = result.recordset[0]

          if(positionDesCheck){
            req.flash('warning_msg', '已新增過此職缺資訊，如要修改職缺內容請使用編輯功能!')
            return res.redirect('/position')
          }else{
            request.input('cpyId', sql.NVarChar(30), cpyId)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpyId, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.redirect('/position')
            })
          }
        })
      }else{
        // 資料庫沒有職缺類別資料時先新增
        request.input('name', sql.NVarChar(200), name)
        .input('entity', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_POSITION_CATEGORY (POSITION_NAME, ENTITY_NAME)
        values (@name, @entity)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          // 將職缺類別資料寫入訓練檔及BF_JH_TRAINING_DATA資料表
          fsJhWritePosition(name, entity_name, request)
          setPositionDict(name)
          // 新增完職缺類別資料後，獲取position_id
          request.query(`select POSITION_ID 
          from BF_JH_POSITION_CATEGORY
          where POSITION_NAME = '${name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const position_id = result.recordset[0]['POSITION_ID']

            request.input('cpyId', sql.NVarChar(30), cpyId)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpyId, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.redirect('/position')
            })
          })
        })
      }
    }) 
  }
})

// 顯示新增position頁面
router.get('/new', (req, res) => {
  res.render('jh_new_position')
})


// 顯示position頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select a.POSITION_DES, b.POSITION_NAME, b.POSITION_ID
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where CPY_ID = '${cpyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const positionResult = result.recordset

		if(positionResult.length == 0) warning.push({message: '還未新增職缺，請拉到下方點選按鈕新增職缺!!'})
		return res.render('jh_position', {positionResult, warning})
  })
})

module.exports = router
