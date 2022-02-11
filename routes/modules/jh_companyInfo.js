const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')


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
    res.render('jh_new_cpnyInfo', {name, entity_name, des, errors})
  }else{
    // 驗證資料庫是否有資訊類別資料
    request.query(`select *
    from BF_JH_CPNYINFO_CATEGORY
    where INFO_NAME = '${name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const cpnyInfoCheck = result.recordset[0]

      if(cpnyInfoCheck){
        const info_id = cpnyInfoCheck.INFO_ID

        // 驗證使用者是否已添加過此資訊
        request.query(`select *
        from BF_JH_CPNYINFO
        where INFO_ID = ${info_id}
        and CPY_ID = '${cpyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const cpnyInfoDesCheck = result.recordset[0]
          
          if(cpnyInfoDesCheck){
            req.flash('warning_msg', '已新增過此公司資訊，如要修改資訊內容請使用編輯功能!')
            return res.redirect('/company')
          }else{
            request.input('cpyId', sql.NVarChar(30), cpyId)
            .input('info_id', sql.Int, info_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_COMPANY (CPY_ID, INFO_ID, INFO_DES)
            values (@cpyId, @info_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.redirect('/company')
            })
          }
        })
      }else{
        // 資料庫沒有資訊類別資料時先新增
        request.input('name', sql.NVarChar(200), name)
        .input('entity_name', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_CPNYINFO_CATEGORY(INFO_NAME, ENTITY_NAME)
        values (@name, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          
          // 這邊要加入寫檔和設定dict module

          // 新增完資訊類別資料後，獲取position_id
          request.query(`select INFO_ID
          from BF_JH_CPNYINFO_CATEGORY
          where INFO_NAME = '${name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const info_id = result.recordset[0]['INFO_ID']

            request.input('cpyId', sql.NVarChar(30), cpyId)
            .input('info_id', sql.Int, info_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_CPNYINFO (CPY_ID, INFO_ID, INFO_DES)
            values (@cpyId, @info_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.redirect('/company')
            })
          })
        })
      }
    })
  }
})

// 顯示公司新增資訊頁面
router.get('/new', (req, res) => {
  res.render('jh_new_cpnyInfo')
})

// 顯示公司資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  // 抓取公司資訊
  request.query(`select a.INFO_DES, b.INFO_NAME, b.INFO_ID
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.INFO_ID = b.INFO_ID
  where CPY_ID = '${cpyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyInfo = result.recordset

    // 如果完全沒資料，給予default(公司電話、地址、簡介)
		if(cpnyInfo.length == 0){
      request.input('cpyId', sql.NVarChar(30), cpyId)
      .input('tel', sql.Int, 1)
      .input('address', sql.Int, 2)
      .input('introduction', sql.Int, 3)
      .query(`insert into BF_JH_CPNYINFO(CPY_ID, INFO_ID, INFO_DES)
      values (@cpyId, @tel, ''), (@cpyId, @address, ''), (@cpyId, @introduction, '')`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
      return res.redirect('/company')
    }else{
      res.render('jh_cpnyInfo', {cpnyInfo})
    }
  })
})

module.exports = router