const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsWriteLeave} = require('../../modules/fileSystem')
const {setInfoDict} = require('../../modules/setDict')

// 刪除假別資訊
router.delete('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  request.query(`select b.LEAVE_ID
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const leave_id = result.recordset[0]['LEAVE_ID']
    if(!leave_id){
      req.flash('error', '查無此假別，請重新嘗試!')
      return res.redirect('/leave')
    }else{
      request.query(`delete from BF_JH_LEAVE
      where LEAVE_ID = ${leave_id}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '成功刪除假別資訊!')
        res.redirect('/leave')
      })
    }
  })
})

// 編輯假別資訊內容
router.put('/:entity_name', (req, res) => {
  const {entity_name} = req.params
  const {des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)

  if(!des){
    req.flash('warning_msg', '假別內容為必填欄位!')
    return res.redirect(`/leave/${entity_name}/edit`)
  }
  
  request.query(`select b.LEAVE_ID
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, ( err, result) => {
    if(err){
      console.log(err)
      return
    }

    const leave_id = result.recordset[0]['LEAVE_ID']
    if(!leave_id){
      req.flash('error', '查無此假別，請重新嘗試!')
      return res.redirect('/leave')
    }else{
      request.input('des', sql.NVarChar(2000), des)
      .query(`update BF_JH_LEAVE
      set LEAVE_DES = @des
      where LEAVE_ID = ${leave_id}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新假別內容成功!')
        res.redirect('/leave')
      })
    }
  })
})

// 顯示編輯假別資訊頁面
router.get('/:entity_name/edit', (req, res) => {
  const {entity_name} = req.params
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_edit_leave = true
  const request = new sql.Request(pool)

  request.query(`select a.LEAVE_DES as des, b.LEAVE_ID as id, b.LEAVE_NAME as name, b.ENTITY_NAME as entity_name
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const leaveInfo = result.recordset[0]
    if(!leaveInfo){
      req.flash('warning_msg', '查無此假別資訊資料，請重新嘗試!')
      return res.redirect('/leave')
    }else{
      res.render('index', {leaveInfo, jh_edit_leave})
    }
  })

})

// 新增假別資訊
router.post('/', (req, res) => {
  const {name, entity_name, des} = req.body
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_new_leave = true

  if(!name | !entity_name | !des) warning.push({message: '所有欄位都是必填的!'})
  if(warning.length){
    return res.render('index', {name, entity_name, des, warning, jh_new_leave})
  }else{
    // 驗證是否有此假別類別
    request.query(`select * 
    from BF_JH_LEAVE_CATEGORY
    where LEAVE_NAME = '${name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const leaveCheck = result.recordset[0]
      if(leaveCheck){
        const leave_id = leaveCheck.LEAVE_ID
        // 驗證是否有新增過此假別資訊
        request.query(`select * 
        from BF_JH_LEAVE
        where LEAVE_ID = ${leave_id}
        and CPY_ID = '${cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const leaveInfoCheck = result.recordset[0]
          if(leaveInfoCheck){
            req.flash('warning_msg', '已新增過此假別資訊，如要修改假別資訊內容請使用編輯功能!')
            return res.redirect('/leave')
          }else{
            request.input('cpnyId', sql.NVarChar(30), cpnyId)
            .input('leave_id', sql.Int, leave_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_LEAVE (CPY_ID, LEAVE_ID, LEAVE_DES) 
            values (@cpnyId, @leave_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增假別資訊成功!')
              res.redirect('/leave')
            })
          }
        })
      }else{
        // 資料庫沒有此假別類別時，先新增
        request.input('name', sql.NVarChar(200), name)
        .input('entity_name', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_LEAVE_CATEGORY (LEAVE_NAME, ENTITY_NAME) 
        values (@name, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          // 寫檔及寫入dict
          fsWriteLeave(name, entity_name, request)
          setInfoDict(name)

          // 獲取剛新增的假別類別ID
          request.query(`select LEAVE_ID
          from BF_JH_LEAVE_CATEGORY
          where LEAVE_NAME = '${name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const leave_id = result.recordset[0]['LEAVE_ID']
            // 新增假別資訊內容
            request.input('cpnyId', sql.NVarChar(200), cpnyId)
            .input('leave_id', sql.Int, leave_id)
            .input('des', sql.NVarChar(2000), des)
            .query(`insert into BF_JH_LEAVE (CPY_ID, LEAVE_ID, LEAVE_DES) 
            values (@cpnyId, @leave_id, @des)`, (err, resul) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增假別資訊成功!')
              res.redirect('/leave')
            })
          })
        })
      }
    })
  }
})

// 顯示新增假別頁面
router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const jh_new_leave = true

  res.render('index', {cpnyId, jh_new_leave})
})

// 顯示假別資訊頁面
router.get('/', (req, res) => {
  const user = res.locals.user
	const cpnyId = user.CPY_ID
  const request = new sql.Request(pool)
  const warning = []
  const jh_leave = true
  
  request.query(`select a.LEAVE_DES, b.LEAVE_ID, b.LEAVE_NAME, b.ENTITY_NAME
  from BF_JH_LEAVE a
  left join BF_JH_LEAVE_CATEGORY b
  on a.LEAVE_ID = b.LEAVE_ID
  where a.CPY_ID = ${cpnyId}
  order by b.LEAVE_ID ASC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const leaveInfo = result.recordset
    if(!leaveInfo.length) warning.push({message: '還未新增假別資訊，請拉到下方點選按鈕新增假別資訊!!'})
    res.render('index', {leaveInfo, warning, jh_leave})
  })
})

module.exports = router