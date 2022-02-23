const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsWriteSubsidy} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')

// 刪除補助津貼資訊
router.delete('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  request.query(`select b.SUBSIDY_ID
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidy_id = result.recordset[0]

    if(!subsidy_id){
      req.flash('warning_msg', '查無此補助津貼資料，請重新嘗試!')
      return res.redirect('/jh_subsidy')
    }else{
      request.query(`delete from BF_JH_SUBSIDY
      where SUBSIDY_ID = ${subsidy_id.SUBSIDY_ID}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '成功刪除補助津貼資訊!')
        res.redirect('/jh_subsidy')
      })
    }
  })
})

// 編輯補助津貼內容
router.put('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const {des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  if(!des) return res.redirect(`/jh_subsidy/${entity_name}/edit`)

  request.query(`select b.SUBSIDY_ID
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidy_id = result.recordset[0]

    if(!subsidy_id){
      req.flash('warning_msg', '查無此補助津貼資料，請重新嘗試!')
      return res.redirect('/jh_subsidy')
    }else{
      request.input('des', sql.NVarChar(2000), des)
      .query(`update BF_JH_SUBSIDY
      set SUBSIDY_DES = @des
      where SUBSIDY_ID = ${subsidy_id.SUBSIDY_ID}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新補助津貼內容成功!')
        res.redirect('/jh_subsidy')
      })
    }
  })
})

// 顯示補助津貼內容頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_subsidy = true
  const request = new sql.Request(pool)

  request.query(`select a.SUBSIDY_DES as des, b.SUBSIDY_ID as id, b.SUBSIDY_NAME as name, b.ENTITY_NAME as entity_name
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyInfo = result.recordset[0]

    if(!subsidyInfo){
      req.flash('warning_msg', '查無此補助津貼資料，請重新嘗試!')
      return res.redirect('/jh_subsidy')
    }else{
      res.render('index', {subsidyInfo, cpnyId, jh_edit_subsidy})
    }
  })
})

// 新增補助津貼資訊
router.post('/', (req, res) => {
  const {name, entity_name, des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_new_subsidy = true

  if(!name | !entity_name | !des) warning.push({message: '所有欄位都是必填的!'})
  if(warning.length){
    return res.render('index', {name, entity_name, des, warning, jh_new_subsidy})
  }else{
    // 驗證是否有此補助津貼類別
    request.query(`select *
    from BF_JH_SUBSIDY_CATEGORY
    where SUBSIDY_NAME = '${name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const subsidyCheck = result.recordset[0]
      if(subsidyCheck){
        const subsidy_id = subsidyCheck.SUBSIDY_ID
        // 驗證是否有新增過此補助津貼類別
        request.query(`select *
        from BF_JH_SUBSIDY
        where SUBSIDY_ID = ${subsidy_id}
        and CPY_ID = '${cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const subsidyDesCheck = result.recordset[0]

          if(subsidyDesCheck){
            req.flash('warning_msg', '已新增過此補助津貼資訊，如要修改補助津貼內容請使用編輯功能!')
            return res.redirect('/jh_subsidy')
          }else{
            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('subsidy_id', sql.Int, subsidy_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_SUBSIDY (CPY_ID, SUBSIDY_ID, SUBSIDY_DES)
            values (@cpnyId, @subsidy_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增補助津貼成功!')
              res.redirect('/jh_subsidy')
            })
          }
        })
      }else{
        // 資料庫沒有此補助津貼類別時，先新增
        request.input('name', sql.NVarChar(200), name)
        .input('entity_name', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_SUBSIDY_CATEGORY (SUBSIDY_NAME, ENTITY_NAME) 
        values (@name, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          // 寫檔及寫入dict
          fsWriteSubsidy(name, entity_name, request)
          setInfoDict(name)

          // 獲取剛新增的subsidy id
          request.query(`select SUBSIDY_ID
          from BF_JH_SUBSIDY_CATEGORY
          where SUBSIDY_NAME = '${name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }

            const subsidy_id = result.recordset[0]

            // 新增補助津貼內容
            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('subsidy_id', sql.Int, subsidy_id.SUBSIDY_ID)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_SUBSIDY (CPY_ID, SUBSIDY_ID, SUBSIDY_DES) 
            values (@cpnyId, @subsidy_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增補助津貼成功!')
              res.redirect('/jh_subsidy')
            })
          })
        })
      }
    })
  }
})

// 顯示新增津貼補助畫面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_subsidy = true
  res.render('index', {cpnyId, jh_new_subsidy})
})

// 顯示補助津貼頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select a.SUBSIDY_DES, b.SUBSIDY_NAME, b.SUBSIDY_ID, b.ENTITY_NAME
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where CPY_ID = '${cpnyId}'
  order by b.SUBSIDY_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const subsidyInfo = result.recordset
    const jh_subsidy = true
    if(!subsidyInfo.length) warning.push({message: '還未新增補助津貼，請拉到下方點選按鈕新增補助津貼!!'})
    res.render('index', {subsidyInfo, jh_subsidy, warning, cpnyId})
  })
})

module.exports = router