const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const { query } = require('express')

// admin 刪除個公司各類別的回覆
router.delete('/:cpy_no/:table/:project_no', (req, res) => {
  const {cpy_no, table, project_no} = req.params
  const request = new sql.Request(pool)

  // 刪除資料來自哪一個tableFilter
  // 因為COMPANY_INFO的資料庫欄位名稱與其他幾個不一樣，所以需要單獨拉出來寫
  if(table == 'COMPANY'){
    // 驗證要刪除的資料是否存在
    request.query(`select *
    from BOTFRONT_${table}_INFO
    where CPY_NO = '${cpy_no}'
    and INFO_NO = ${project_no}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const infoCheck = result.recordset
      if(infoCheck.length == 0){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect(`/adminSearch/filter?companyFilter=${cpy_no}&tableFilter=${table}&search=`)
      }else{
        // 刪除該筆資料
        request.query(`delete
        from BOTFRONT_${table}_INFO
        where CPY_NO = '${cpy_no}'
        and INFO_NO = ${project_no}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          req.flash('success_msg', '已成功刪除資料!!')
          return res.redirect(`/adminSearch/filter?companyFilter=${cpy_no}&tableFilter=${table}&search=`)
        })
      }
    })
  }else{
    // tableFilter除了COMPANY之外，其他都在這處理
    // 驗證要刪除的資料是否存在
    request.query(`select *
    from BOTFRONT_${table}_INFO
    where CPY_NO = '${cpy_no}'
    and ${table}_NO = ${project_no}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const infoCheck = result.recordset
      if(infoCheck.length == 0){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect(`/adminSearch/filter?companyFilter=${cpy_no}&tableFilter=${table}&search=`)
      }else{
        // 刪除該筆資料
        request.query(`delete
        from BOTFRONT_${table}_INFO
        where CPY_NO = '${cpy_no}'
        and ${table}_NO = ${project_no}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          req.flash('success_msg', '已成功刪除資料!!')
          return res.redirect(`/adminSearch/filter?companyFilter=${cpy_no}&tableFilter=${table}&search=`)
        })
      }
    })
  }
})

// admin 新增各公司各類別的回覆
router.post('/', (req, res) => {
  const {companyFilter, tableFilter, industry_select, adminSearch_des, admin_select } = req.body
  const errors = []

  const request = new sql.Request(pool)

  // 抓取公司
  request.query(`select *
  from BOTFRONT_USERS_INFO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset

    // 驗證欄位是否都有值
    if(!companyFilter || !tableFilter || !industry_select || !adminSearch_des || !admin_select){
      req.flash('error', '所有欄位都是必填的!!')
      return res.redirect('/adminSearch/new')
    }

    // 因資料庫table取名有些不同，所以需要判別要使用哪張table
    // tableFilter選擇公司資訊
    if(tableFilter == 'COMPANY'){
      // 驗證要輸入的公司資訊類別有沒有在公司資訊類別中
      request.query(`select *
      from BOTFRONT_ALL_COMPANY_INFO
      where INFO_ID = ${admin_select}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const infoCheck = result.recordset
        if(infoCheck.length == 0){
          req.flash('error', '無此新增項目，請重新嘗試!!')
          return res.redirect('/adminSearch/new')
        }else{
          // 驗證要新增的公司資訊類別是否已經新增過
          request.query(`select * 
          from BOTFRONT_COMPANY_INFO a
          left join BOTFRONT_ALL_COMPANY_INFO b
          on a.INFO_NO = b.INFO_ID
          where a.CPY_NO = '${companyFilter}' and a.INFO_NO = ${admin_select}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const infoAdded = result.recordset
            // 如果沒有新增過，結果會是一個[]
            if(infoAdded.length == 0){
              request.input('cpy_no', sql.NVarChar(30), companyFilter)
              .input('info_no', sql.Int, admin_select)
              .input('des', sql.NVarChar(2000), adminSearch_des)
              .query(`insert into BOTFRONT_COMPANY_INFO (CPY_NO, INFO_NO, INFO_DES)
              values (@cpy_no, @info_no, @des)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                req.flash('success_msg', '回覆新增成功!!')
                // return res.render(`adminSearch`, {adminCompany, companyFilter, tableFilter})
                return res.redirect(`/adminSearch/filter?companyFilter=${companyFilter}&tableFilter=${tableFilter}&search=`)
              })
            }else{
              req.flash('error', '無法新增資料，請確認此公司是否已新增過此類別資料，如已新增過請使用編輯功能修改內容!!')
              return res.redirect('/adminSearch/new')
            }
          })
        }
      })
    }

    // tableFilter選擇職缺
    if(tableFilter == 'POSITION'){
      // 驗證要新增的職缺類別是否有在職缺類別中
      request.query(`select * 
      from BOTFRONT_ALL_POSITION
      where POSITION_ID = ${admin_select} and INDUSTRY_NO = ${industry_select}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const positionCheck = result.recordset
        if(positionCheck.length == 0){
          req.flash('error', '無此新增項目，請重新嘗試!!')
          return res.redirect('/adminSearch/new')
        }else{
          // 驗證要新增的職缺類別是否已經新增過
          request.query(`select * 
          from BOTFRONT_POSITION_INFO
          where CPY_NO = '${companyFilter}'
          and INDUSTRY_NO = ${industry_select} 
          and POSITION_NO = ${admin_select}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const positionAdded = result.recordset
            // 如果沒有新增過，結果會是[]
            if(positionAdded.length == 0){
              request.input('cpy_no', sql.NVarChar(30), companyFilter)
              .input('industry_no', sql.Int, industry_select)
              .input('position_no', sql.Int, admin_select)
              .input('des', sql.NVarChar(2000), adminSearch_des)
              .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
              values (@cpy_no, @industry_no, @position_no, @des)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                req.flash('success_msg', '回覆新增成功!!')
                return res.redirect(`/adminSearch/filter?companyFilter=${companyFilter}&tableFilter=${tableFilter}&search=`)
              })
            }else{
              req.flash('error', '無法新增資料，請確認此公司是否已新增過此類別資料，如已新增過請使用編輯功能修改內容!!')
              return res.redirect('/adminSearch/new')
            }
          })
        }
      })
    }

    // tableFilter選擇假別或補助
    if(tableFilter == 'SUBSIDY' || tableFilter == 'LEAVE'){
      // 驗證要新增的假別或補助類別是否有在相對應的類別中
      request.query(`select * 
      from BOTFRONT_ALL_${tableFilter}
      where ${tableFilter}_ID = ${admin_select}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const projectCheck = result.recordset
        if(projectCheck.length == 0){
          req.flash('error', '無此新增項目，請重新嘗試!!')
          return res.redirect('/adminSearch/new')
        }else{
          // 驗證要新增的假別或補助類別是否已經新增過
          request.query(`select * 
          from BOTFRONT_${tableFilter}_INFO
          where CPY_NO = '${companyFilter}'
          and ${tableFilter}_NO = ${admin_select}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const projectAdded = result.recordset
            // 如果沒有新增過，結果會是[]
            if(projectAdded.length == 0){
              request.input('cpy_no', sql.NVarChar(30), companyFilter)
              .input('project_no', sql.Int, admin_select)
              .input('des', sql.NVarChar(2000), adminSearch_des)
              .query(`insert into BOTFRONT_${tableFilter}_INFO (CPY_NO, ${tableFilter}_NO, ${tableFilter}_DES)
              values (@cpy_no, @project_no, @des)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                req.flash('success_msg', '回覆新增成功!!')
                return res.redirect(`/adminSearch/filter?companyFilter=${companyFilter}&tableFilter=${tableFilter}&search=`)
              })
            }else{
              req.flash('error', '無法新增資料，請確認此公司是否已新增過此類別資料，如已新增過請使用編輯功能修改內容!!')
              return res.redirect('/adminSearch/new')
            }
          })
        }
      })
    }
  })
})

// API => admin 新增職缺資訊 取得未新增過的職缺類別
router.get('/api/v1/new/POSITION/:cpy_no/:industry_no', (req, res) => {
	const {cpy_no, industry_no} = req.params

	const request = new sql.Request(pool)

	// 抓取未新增過的職缺資料
	request.query(`select a.POSITION_ID, a.POSITION_NAME 
	from BOTFRONT_ALL_POSITION a 
	where not exists (select * 
	from BOTFRONT_POSITION_INFO b 
	where  a.POSITION_ID = b.POSITION_NO 
	and b.CPY_NO = '${cpy_no}') 
	and a.INDUSTRY_NO = '${industry_no}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		return res.send(result)
	})
})

// API => admin 抓取未新增過的類別
router.get('/api/v1/new/:table/:cpy_no', (req, res) => {
	const {cpy_no, table} = req.params

  const request = new sql.Request(pool)
  // 抓取公司的產業類別
  if(table == 'INDUSTRY'){
    request.query(`select a.INDUSTRY_NO as Id, b.INDUSTRY_NAME as Name
    from BOTFRONT_USERS_INFO a
    left join BOTFRONT_TYPE_OF_INDUSTRY b
    on a.INDUSTRY_NO = b.INDUSTRY_ID
    where CPY_ID = '${cpy_no}'`, (err, result) => {
      if(err){
      console.log(err)
      return
      }

      return res.send(result)
    })
  }else if(table == 'COMPANY_INFO'){// 抓取未新增過的公司資訊類別
    request.query(`select a.INFO_ID, a.INFO_NAME 
    from BOTFRONT_ALL_COMPANY_INFO a 
    where not exists (select * 
    from BOTFRONT_COMPANY_INFO b 
    where  a.INFO_ID = b.INFO_NO 
    and b.CPY_NO = '${cpy_no}')`, (err, result) => {
      if(err){
      console.log(err)
      return
      }
      
      return res.send(result)
    })
  }else{ // 因為假別、補助、問候、預設回覆的資料庫結構都一樣，所以直接寫成一個
    request.query(`select a.${table}_ID as Id, a.${table}_NAME  as Name
    from BOTFRONT_ALL_${table} a 
    where not exists (select * 
    from BOTFRONT_${table}_INFO b 
    where  a.${table}_ID = b.${table}_NO 
    and b.CPY_NO = '${cpy_no}')`, (err, result) => {
      if(err){
      console.log(err)
      return
      }

      return res.send(result)
    })
  }
})

// 顯示新增頁面
router.get('/new', (req, res) => {
  const request = new sql.Request(pool)

  request.query(`select *
  from BOTFRONT_USERS_INFO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset
    res.render('new_adminSearch', {adminCompany})
  })
})

// 編輯回覆內容
router.put('/:cpy_no/:table/:adminSearch_no', (req, res) => {
  const {cpy_no, table, adminSearch_no} = req.params
  const {adminSearch_des} = req.body
  const success = [], warning = []

  // 重新導回原編輯頁，並顯示原資料
  if(!adminSearch_des){
    req.flash('error', '內容欄位不可空白!!')
    return res.redirect(`/adminSearch/${cpy_no}/${table}/${adminSearch_no}/edit`)
  }

  const request = new sql.Request(pool)

   // 類別選擇「是」公司資訊
  if(table == 'COMPANY'){
    // 驗證此公司是否有此筆資料
    request.query(`select * 
    from BOTFRONT_COMPANY_INFO a
    left join BOTFRONT_USERS_INFO b
    on a.CPY_NO = b.CPY_ID 
    where a.INFO_NO = ${adminSearch_no} and a.CPY_NO = '${cpy_no}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      result = result.recordset[0]
      if(!result){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect('/adminSearch')
      }
      
      // 更新資料
      request.input('adminSearch_des', sql.NVarChar(2000), adminSearch_des)
      .query(`update BOTFRONT_COMPANY_INFO
      set INFO_DES = @adminSearch_des
      where CPY_NO = '${cpy_no}' and INFO_NO = ${adminSearch_no}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        // 獲取所有公司資料 => 選取公司的下拉選單
        request.query(`select *
        from BOTFRONT_USERS_INFO`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminCompany = result.recordset

          // 獲取公司的回覆資料
          request.query(`select a.CPY_NO, c.CPY_NAME, a.INFO_NO as adminSearch_no, a.INFO_DES as adminSearch_des, b.INFO_NAME as adminSearch_name
          from BOTFRONT_COMPANY_INFO a
          left join BOTFRONT_ALL_COMPANY_INFO b
          on a.INFO_NO = b.INFO_ID
          left join BOTFRONT_USERS_INFO c
          on a.CPY_NO = c.CPY_ID
          where c.CPY_ID = '${cpy_no}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const adminSearchInfo = result.recordset
            const tableFilter = table
            const companyFilter = adminSearchInfo[0].CPY_NO
            // console.log(adminSearchInfo)
            if(adminSearchInfo.length == 0){
              warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
              return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, warning})
            }
            success.push({message: '資料更新成功!!'})
            res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, success})
          })
        })
      })
    })
  }else{ // 類別選擇「不是」公司資訊
    // 驗證此公司是否有此筆資料
    request.query(`select * 
    from BOTFRONT_${table}_INFO a
    left join BOTFRONT_USERS_INFO b
    on a.CPY_NO = b.CPY_ID 
    where ${table}_NO = ${adminSearch_no} and CPY_NO = '${cpy_no}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      result = result.recordset[0]
      if(!result){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect('/adminSearch')
      }
      
      // 更新資料
      request.input('adminSearch_des', sql.NVarChar(2000), adminSearch_des)
      .query(`update BOTFRONT_${table}_INFO
      set ${table}_DES = @adminSearch_des
      where CPY_NO = '${cpy_no}' and ${table}_NO = ${adminSearch_no}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }

        // 獲取所有公司資料 => 選取公司的下拉選單
        request.query(`select *
        from BOTFRONT_USERS_INFO`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminCompany = result.recordset

          // 獲取公司的回覆資料
          request.query(`select a.CPY_NO, c.CPY_NAME, a.${table}_NO as adminSearch_no, a.${table}_DES as adminSearch_des, b.${table}_NAME as adminSearch_name
          from BOTFRONT_${table}_INFO a
          left join BOTFRONT_ALL_${table} b
          on a.${table}_NO = b.${table}_ID
          left join BOTFRONT_USERS_INFO c
          on a.CPY_NO = c.CPY_ID
          where c.CPY_ID = '${cpy_no}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const adminSearchInfo = result.recordset
            const tableFilter = table
            const companyFilter = adminSearchInfo[0].CPY_NO
            // console.log(adminSearchInfo)
            if(adminSearchInfo.length == 0){
              warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
              return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, warning})
            }
            success.push({message: '資料更新成功!!'})
            res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, success})
          })
        })
      })
    })
  }
})

// 顯示 admin 編輯頁面
router.get('/:cpy_no/:table/:adminSearch_no/edit', (req, res) => {
  const {cpy_no, table, adminSearch_no} = req.params

  const request = new sql.Request(pool)
  const errors = []

  if(table == 'COMPANY'){
    // 類別選擇「是」公司資訊
    request.query(`select b.INFO_NAME as adminSearch_name, a.INFO_DES as adminSearch_des
    from BOTFRONT_COMPANY_INFO a
    left join BOTFRONT_ALL_COMPANY_INFO b
    on a.INFO_NO = b.INFO_ID
    where INFO_NO = ${adminSearch_no} and CPY_NO = '${cpy_no}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSearchInfo = result.recordset[0]
      if(!adminSearchInfo){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect('/adminSearch')
      }
      res.render('edit_adminSearch', {adminSearchInfo, cpy_no, table, adminSearch_no})
    })
  }else{
    // 類別選擇「不是」公司資訊
    request.query(`select b.${table}_NAME as adminSearch_name, a.${table}_DES as adminSearch_des
    from BOTFRONT_${table}_INFO a
    left join BOTFRONT_ALL_${table} b
    on a.${table}_NO = b.${table}_ID
    where ${table}_NO = ${adminSearch_no} and CPY_NO = '${cpy_no}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSearchInfo = result.recordset[0]
      if(!adminSearchInfo){
        req.flash('error', '查無此筆資料，請重新嘗試!!')
        return res.redirect('/adminSearch')
      }
      res.render('edit_adminSearch', {adminSearchInfo, cpy_no, table, adminSearch_no})
    })
  }
})

// admin 篩選公司及類別進行查詢並顯示頁面
router.get('/filter', (req, res) => {
  const {companyFilter, tableFilter, search} = req.query

  const request = new sql.Request(pool)
  const warning = []
  if(search && (!companyFilter || !tableFilter)){
    req.flash('warning_msg', '請先選擇公司及分類再進行查詢!!')
    return res.redirect('/adminSearch')
  }

  // 獲取所有公司資料 => 選取公司的下拉選單
  request.query(`select * 
  from BOTFRONT_USERS_INFO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset

    // 如果使用者只有一間(代表只有admin帳戶)
    if(adminCompany.length <= 1){
      req.flash('error', '還未新增公司，請先註冊公司帳號!!')
      return res.redirect('/')
    }
    if(!companyFilter || !tableFilter){
      warning.push({message: '公司和類別都是必選的!!'})
      return res.render('adminSearch', {adminCompany, companyFilter, tableFilter, warning})
    }
    
    // 判斷無輸入search
    if(!search){
      // 因為公司資訊的類別資料庫名稱和其他幾個不同，所以需要額外處理
      // 其他類別資料庫名稱為BOTFRONT_ALL_xxxx，公司資訊類別資料庫名稱為BOTFRONT_ALL_COMPANY_INFO
      if(tableFilter == 'COMPANY'){
        // 類別選擇「是」公司資訊
        request.query(`select a.CPY_NO, c.CPY_NAME, a.INFO_NO as adminSearch_no, a.INFO_DES as adminSearch_des, b.INFO_NAME as adminSearch_name
        from BOTFRONT_COMPANY_INFO a
        left join BOTFRONT_ALL_COMPANY_INFO b
        on a.INFO_NO = b.INFO_ID
        left join BOTFRONT_USERS_INFO c
        on a.CPY_NO = c.CPY_ID
        where c.CPY_ID = '${companyFilter}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminSearchInfo = result.recordset
          // console.log(adminSearchInfo)
          if(adminSearchInfo.length == 0){
            warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
            return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, search, warning})
          }
          return res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search})
        })
      }else{
        // 類別選擇「不是」公司資訊
        request.query(`select a.CPY_NO, c.CPY_NAME, a.${tableFilter}_NO as adminSearch_no, a.${tableFilter}_DES as adminSearch_des, b.${tableFilter}_NAME as adminSearch_name
        from BOTFRONT_${tableFilter}_INFO a
        left join BOTFRONT_ALL_${tableFilter} b
        on a.${tableFilter}_NO = b.${tableFilter}_ID
        left join BOTFRONT_USERS_INFO c
        on a.CPY_NO = c.CPY_ID
        where c.CPY_ID = '${companyFilter}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminSearchInfo = result.recordset
          // console.log(adminSearchInfo)
          if(adminSearchInfo.length == 0){
            warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
            return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, search, warning})
          }
          return res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search})
        })
      }
    }else{// 判斷有輸入search
      
      if(tableFilter == 'COMPANY'){
        // 類別選擇「是」公司資訊
        request.query(`select a.CPY_NO, c.CPY_NAME, a.INFO_NO as adminSearch_no, a.INFO_DES as adminSearch_des, b.INFO_NAME as adminSearch_name
        from BOTFRONT_COMPANY_INFO a
        left join BOTFRONT_ALL_COMPANY_INFO b
        on a.INFO_NO = b.INFO_ID
        left join BOTFRONT_USERS_INFO c
        on a.CPY_NO = c.CPY_ID
        where c.CPY_ID = '${companyFilter}' and b.INFO_NAME like '%${search}%'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminSearchInfo = result.recordset
          // console.log(adminSearchInfo)
          if(adminSearchInfo.length == 0){
            warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
            return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, search, warning})
          }
          res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search})
        })
      }else{
        // 類別選擇「不是」公司資訊
        request.query(`select a.CPY_NO, c.CPY_NAME, a.${tableFilter}_NO as adminSearch_no, a.${tableFilter}_DES as adminSearch_des, b.${tableFilter}_NAME as adminSearch_name
        from BOTFRONT_${tableFilter}_INFO a
        left join BOTFRONT_ALL_${tableFilter} b
        on a.${tableFilter}_NO = b.${tableFilter}_ID
        left join BOTFRONT_USERS_INFO c
        on a.CPY_NO = c.CPY_ID
        where c.CPY_ID = '${companyFilter}' and b.${tableFilter}_NAME like '%${search}%'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const adminSearchInfo = result.recordset
          // console.log(adminSearchInfo)
          if(adminSearchInfo.length == 0){
            warning.push({message: '未查詢到此回覆資訊，請重新查詢!'})
            return res.render('adminSearch', { adminCompany, companyFilter, tableFilter, search, warning})
          }
          res.render('adminSearch', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search})
        })
      }
    }
  })
})

// 顯示 admin 空白查詢頁面
router.get('/', (req, res) => {
  const request = new sql.Request(pool)

  // 獲取所有公司資料 => 選取公司的下拉選單
  request.query(`select * 
  from BOTFRONT_USERS_INFO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset

    // 如果使用者只有一間(代表只有admin帳戶)
    if(adminCompany.length <= 1){
      req.flash('error', '還未新增公司，請先註冊公司帳號!!')
      return res.redirect('/')
    }
    res.render('adminSearch', {adminCompany})
  })
})

module.exports = router