const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')



// 新增補助津貼資訊
router.post('/:cpnyId', (req, res) => {
  const {cpnyId} = req.params
  const {name, entity_name, des} = req.body
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
            return res.redirect('/subsidy')
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
              res.redirect('/subsidy')
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
          fsJhWriteInfo(name, entity_name, request)
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

            const subsidy_id = result.recordset[0]['SUBSIDY_ID']

            // 新增補助津貼內容
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
              res.redirect('/subsidy')
            })
          })
        })
      }
    })
  }
})

// 顯示新增津貼補助畫面
router.get('/:cpnyId/new', (req, res) => {
  const {cpnyId} = req.params
  const jh_new_subsidy = true
  res.render('index', {cpnyId, jh_new_subsidy})
})

// 顯示補助津貼頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select a.SUBSIDY_DES, b.SUBSIDY_NAME, b.SUBSIDY_ID
  from BF_JH_SUBSIDY a
  left join BF_JH_SUBSIDY_CATEGORY b
  on a.SUBSIDY_ID = b.SUBSIDY_ID
  where CPY_ID = '${cpnyId}'`, (err, result) => {
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