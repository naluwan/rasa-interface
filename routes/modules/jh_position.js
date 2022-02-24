const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWritePosition, fsJhDeletePosition} = require('../../modules/fileSystem')
const {setPositionDict} = require('../../modules/setDict')

// 刪除職缺
router.delete('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  request.query(`select b.POSITION_ID
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const position_id = result.recordset[0]
    if(!position_id){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/jh_position')
    }else{
      request.query(`delete from BF_JH_POSITION
      where POSITION_ID = ${position_id.POSITION_ID}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        // fsJhDeletePosition(positionDesCheck, request)
        req.flash('success_msg', '成功刪除職缺!')
        res.redirect('/jh_position')
      })
    }
  })
})

// 編輯職缺
router.put('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const {des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  if(!des){
    req.flash('warning_msg', '職缺內容為必填欄位!!')
    return res.redirect(`/jh_position/${entity_name}/edit`)
  }

  request.query(`select b.POSITION_ID
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const position_id = result.recordset[0]
    if(!position_id){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/jh_position')
    }else{
      request.input('des', sql.NVarChar(2000), des)
      .query(`update BF_JH_POSITION
      set POSITION_DES = @des
      where POSITION_ID = ${position_id.POSITION_ID}
      and CPY_ID = ${cpnyId}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新職缺內容成功!')
        res.redirect('/jh_position')
      })
    }
  })
})

// 顯示編輯職缺頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_position = true
  const request = new sql.Request(pool)

  request.query(`select b.POSITION_NAME as name, b.POSITION_ID as id, a.POSITION_DES as des, b.ENTITY_NAME as entity_name
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const positionInfo = result.recordset[0]
    positionInfo.des = positionInfo.des.replace(/\r\n/g, "\r")
    if(!positionInfo){
      req.flash('error', '查無此職缺，請重新嘗試!')
      return res.redirect('/jh_position')
    }
    res.render('index', {positionInfo, cpnyId, jh_edit_position})
  })
})

// 新增職缺資訊
router.post('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const {name, entity_name, des} = req.body
  const request = new sql.Request(pool)
  const warning = []

  if(!name || !entity_name || !des){
    warning.push({message: '所有欄位都是必填的!'})
  }

  if(warning.length){
    const jh_new_position = true
    return res.render('index', {name, entity_name, des, warning, jh_new_position})
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
        and CPY_ID = '${cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const positionDesCheck = result.recordset[0]

          if(positionDesCheck){
            req.flash('warning_msg', '已新增過此職缺資訊，如要修改職缺內容請使用編輯功能!')
            return res.redirect('/jh_position')
          }else{
            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpnyId, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增職缺資訊成功!')
              res.redirect('/jh_position')
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

            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpnyId, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增職缺成功!')
              res.redirect('/jh_position')
            })
          })
        })
      }
    }) 
  }
})

// 顯示新增position頁面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_position = true
  res.render('index', {cpnyId, jh_new_position})
})


// 顯示position頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select a.POSITION_DES, b.POSITION_NAME, b.POSITION_ID, b.ENTITY_NAME
  from BF_JH_POSITION a
  left join BF_JH_POSITION_CATEGORY b
  on a.POSITION_ID = b.POSITION_ID
  where CPY_ID = '${cpnyId}'
  order by b.POSITION_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const positionInfo = result.recordset
    positionInfo.forEach(info => {
      info.POSITION_DES = info.POSITION_DES.replace(/\r\n/g, "\r")
    })
    const jh_position = true
		if(!positionInfo.length) warning.push({message: '還未新增職缺，請拉到下方點選按鈕新增職缺!!'})

		return res.render('index', {positionInfo, warning, cpnyId, jh_position})
  })
})

module.exports = router
