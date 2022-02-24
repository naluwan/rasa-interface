const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')

// 刪除公司資訊
router.delete('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool) 
  
  request.query(`select b.CPNYINFO_ID
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyInfo_id = result.recordset[0]

    if(!cpnyInfo_id){
      req.flash('error', '查無此資訊，請重新嘗試!')
      return res.redirect('/jh_cpnyInfo')
    }else{
      request.query(`delete from BF_JH_CPNYINFO
      where CPNYINFO_ID = ${cpnyInfo_id.CPNYINFO_ID}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '成功刪除公司資訊!')
        res.redirect('/jh_cpnyInfo')
      })
    }
  })
})

// 編輯公司資訊
router.put('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const {des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  if(!des){
    req.flash('warning_msg', '資訊內容為必填欄位!')
    return res.redirect(`/jh_cpnyInfo/${entity_name}/edit`)
  }

  request.query(`select b.CPNYINFO_ID
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyInfo_id = result.recordset[0]
    
    if(!cpnyInfo_id){
      req.flash('error', '查無此資訊，請重新嘗試!')
      return res.redirect('/jh_cpnyInfo')
    }else{
      request.input('des', sql.NVarChar(2000), des)
      .query(`update BF_JH_CPNYINFO
      set CPNYINFO_DES = @des
      where CPNYINFO_ID = ${cpnyInfo_id.CPNYINFO_ID}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新資訊內容成功!')
        res.redirect('/jh_cpnyInfo')
      })
    }
  })
})

// 顯示編輯公司資訊頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_cpnyInfo = true
  const request = new sql.Request(pool)

  request.query(`select a.CPNYINFO_DES as des, b.CPNYINFO_ID as id, b.CPNYINFO_NAME as name, b.ENTITY_NAME as entity_name
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyInfo = result.recordset[0]
    cpnyInfo.des = cpnyInfo.des.replace(/\r\n/g,"\r")
    console.log(cpnyInfo)
    if(!cpnyInfo){
      req.flash('warning_msg', '查無此資訊資料，請重新嘗試!')
      return res.redirect('/jh_cpnyInfo')
    }else{
      res.render('index', {cpnyInfo, cpnyId, jh_edit_cpnyInfo})
    }
  })
})

// 新增公司資訊
router.post('/', (req, res) => {
  const {name, entity_name, des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_new_position = true
  if(!name || !entity_name || !des){
    warning.push({message: '所有欄位都是必填的!'})
  }

  if(warning.length){
    res.render('index', {name, entity_name, des, warning, jh_new_position})
  }else{
    // 驗證資料庫是否有資訊類別資料
    request.query(`select *
    from BF_JH_CPNYINFO_CATEGORY
    where CPNYINFO_NAME = '${name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const cpnyInfoCheck = result.recordset[0]

      if(cpnyInfoCheck){
        const info_id = cpnyInfoCheck.CPNYINFO_ID

        // 驗證使用者是否已添加過此資訊
        request.query(`select *
        from BF_JH_CPNYINFO
        where CPNYINFO_ID = ${info_id}
        and CPY_ID = '${cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const cpnyInfoDesCheck = result.recordset[0]
          
          if(cpnyInfoDesCheck){
            req.flash('warning_msg', '已新增過此公司資訊，如要修改資訊內容請使用編輯功能!')
            return res.redirect('/jh_cpnyInfo')
          }else{
            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('info_id', sql.Int, info_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_CPNYINFO (CPY_ID, CPNYINFO_ID, CPNYINFO_DES)
            values (@cpnyId, @info_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.redirect('/jh_cpnyInfo')
            })
          }
        })
      }else{
        // 資料庫沒有資訊類別資料時先新增
        request.input('name', sql.NVarChar(200), name)
        .input('entity_name', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_CPNYINFO_CATEGORY(CPNYINFO_NAME, ENTITY_NAME)
        values (@name, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          
          // 加入寫檔和設定dict module
          fsJhWriteInfo(name, entity_name, request)
          setInfoDict(name)

          // 新增完資訊類別資料後，獲取cpnyInfo_id
          request.query(`select CPNYINFO_ID
          from BF_JH_CPNYINFO_CATEGORY
          where CPNYINFO_NAME = '${name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const info_id = result.recordset[0]

            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('info_id', sql.Int, info_id.CPNYINFO_ID)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_CPNYINFO (CPY_ID, CPNYINFO_ID, CPNYINFO_DES)
            values (@cpnyId, @info_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增資訊成功!')
              res.redirect('/jh_cpnyInfo')
            })
          })
        })
      }
    })
  }
})

// 顯示公司新增資訊頁面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_cpnyInfo = true
  res.render('index', {cpnyId, jh_new_cpnyInfo})
})

// 顯示公司資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []

  // 抓取公司資訊
  request.query(`select a.CPNYINFO_DES, b.CPNYINFO_NAME, b.CPNYINFO_ID, b.ENTITY_NAME
  from BF_JH_CPNYINFO a
  left join BF_JH_CPNYINFO_CATEGORY b
  on a.CPNYINFO_ID = b.CPNYINFO_ID
  where CPY_ID = '${cpnyId}'
  order by b.CPNYINFO_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyInfo = result.recordset
    cpnyInfo.forEach(info => {
      info.CPNYINFO_DES = info.CPNYINFO_DES.replace(/\r\n/g, "\r")
    })
    const jh_cpnyInfo = true
		if(!cpnyInfo.length){
      warning.push({message: '還未新增公司資訊，請拉到下方點選按鈕新增公司資訊!!'})
      warning.push({message: 'ex.地址、電話、簡介、福利、上班時間等公司相關資訊!!'})
    }
    res.render('index', {cpnyInfo, cpnyId, warning, jh_cpnyInfo})
    
  })
})

module.exports = router