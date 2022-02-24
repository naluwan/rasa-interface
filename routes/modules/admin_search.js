const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const {isAdmin} = require('../../middleware/auth')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {fsJhWritePosition, fsJhWriteInfo, fsWriteSubsidy, fsWriteLeave} = require('../../modules/fileSystem')
const {setPositionDict, setInfoDict} = require('../../modules/setDict')

// admin 刪除個公司各類別的回覆
router.delete('/:cpnyId/:table/:des_id', (req, res) => {
  const {cpnyId, table, des_id} = req.params
  const request = new sql.Request(pool)

  request.query(`select *
  from BF_JH_${table}
  where ${table}_ID = ${des_id}
  and CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const desCheck = result.recordset[0]
    if(!desCheck){
      req.flash('warning_msg', '查無此筆資料，請重新嘗試!!')
      return res.redirect(`/admin_search`)
    }else{
      request.query(`delete from BF_JH_${table}
      where ${table}_ID = ${des_id}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '刪除資料成功!')
        res.redirect(`/admin_search/filter?companyFilter=${cpnyId}&tableFilter=${table}&search=`)
      })
    }
  })
})

// admin 新增各公司各類別的回覆
router.post('/', (req, res) => {
  const {companyFilter, tableFilter, adminSearch_name, adminSearch_entity_name, adminSearch_des } = req.body
  const admin_new_search = true
  const warning = []

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
    if(!companyFilter || !tableFilter || !adminSearch_name || !adminSearch_entity_name ||!adminSearch_des){
      warning.push({message: '所有欄位都是必填的!'})
      return res.render('index', {
        adminCompany,
        companyFilter,
        tableFilter,
        adminSearch_name,
        adminSearch_entity_name,
        adminSearch_des,
        warning,
        admin_new_search
      })
    }

    // 驗證要新增的類別是否已經存在
    request.query(`select ${tableFilter}_ID
    from BF_JH_${tableFilter}_CATEGORY
    where ${tableFilter}_NAME = '${adminSearch_name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      try {
        // 新增類別已存在
        const idCheck = result.recordset[0][`${tableFilter}_ID`]
        
        // 驗證要新增資訊是否已存在
        request.query(`select *
        from BF_JH_${tableFilter}
        where ${tableFilter}_ID = ${idCheck}
        and CPY_ID = '${companyFilter}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          const desCheck = result.recordset[0]

          if(desCheck){
            req.flash('warning_msg', '已新增過此資訊，如要修改資訊內容請使用編輯功能!')
            return res.redirect('/admin_search')
          }else{
            request.input('cpnyId', sql.NVarChar(200), companyFilter)
            .input('des_id', sql.Int, idCheck)
            .input('des', sql.NVarChar(2000), adminSearch_des)
            .query(`insert into BF_JH_${tableFilter} (CPY_ID, ${tableFilter}_ID, ${tableFilter}_DES) 
            values (@cpnyId, @des_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增資訊成功!')
              res.redirect(`/admin_search/filter?companyFilter=${companyFilter}&tableFilter=${tableFilter}&search=`)
            })
          }
        })
      } catch (error) {
        // 新增類別不存在
        // 類別不存在時先新增類別
        request.input(`name`, sql.NVarChar(200), adminSearch_name)
        .input('entity_name', sql.NVarChar(2000), adminSearch_entity_name)
        .query(`insert into BF_JH_${tableFilter}_CATEGORY (${tableFilter}_NAME, ENTITY_NAME) 
        values (@name, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          // 寫檔及寫入dict
          switch(tableFilter){
            case 'CPNYINFO':
              fsJhWriteInfo(adminSearch_name, adminSearch_entity_name, request)
              break
            case 'POSITION':
              fsJhWritePosition(adminSearch_name, adminSearch_entity_name, request)
              break
            case 'SUBSIDY':
              fsWriteSubsidy(adminSearch_name, adminSearch_entity_name, request)
              break
            default:
              fsWriteLeave(adminSearch_name, adminSearch_entity_name, request)
              break
          }
          setInfoDict(adminSearch_name)

          // 取得剛新增的類別id
          request.query(`select ${tableFilter}_ID as id
          from BF_JH_${tableFilter}_CATEGORY
          where ${tableFilter}_NAME = '${adminSearch_name}'
          and ENTITY_NAME = '${adminSearch_entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            
            const des_id = result.recordset[0]['id']

            request.input('cpnyId', sql.NVarChar(200), companyFilter)
            .input('des_id', sql.Int, des_id)
            .input('des', sql.NVarChar(2000), adminSearch_des)
            .query(`insert into BF_JH_${tableFilter} (CPY_ID, ${tableFilter}_ID, ${tableFilter}_DES) 
            values (@cpnyId, @des_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              req.flash('success_msg', '新增資訊成功!')
              res.redirect(`/admin_search/filter?companyFilter=${companyFilter}&tableFilter=${tableFilter}&search=`)
            })
          })
        })
      }
    })
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
  const warning = []
  const admin_new_search = true
  const request = new sql.Request(pool)

  request.query(`select *
  from BOTFRONT_USERS_INFO`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminCompany = result.recordset
    if(adminCompany.length == 1) warning.push({message: '還未新增公司，請先註冊公司帳號!'})
    res.render('index', {adminCompany, warning, admin_new_search})
  })
})

// 編輯回覆內容
router.put('/:cpnyId/:table/:adminSearch_id', (req, res) => {
  const {cpnyId, table, adminSearch_id} = req.params
  const {adminSearch_des} = req.body
  const success = [], warning = []
  const request = new sql.Request(pool)

  if(!adminSearch_des){
    req.flash('warning_msg', '內容欄位不可空白!!')
    return res.redirect(`/admin_search/${cpnyId}/${table}/${adminSearch_id}/edit`)
  }

  request.query(`select *
  from BF_JH_${table}
  where ${table}_ID = ${adminSearch_id}
  and CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const desCheck = result.recordset[0]
    if(!desCheck){
      req.flash('warning_msg', '查無此筆資料，請重新嘗試!!')
      return res.redirect('/admin_search')
    }else{
      request.input('des', sql.NVarChar(2000), adminSearch_des)
      .query(`update BF_JH_${table}
      set ${table}_DES = @des 
      where ${table}_ID = ${adminSearch_id}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        req.flash('success_msg', '更新資料成功!')
        res.redirect(`/admin_search/filter?companyFilter=${cpnyId}&tableFilter=${table}&search=`)
      })
    }
  })
})

// 顯示 admin 編輯頁面
router.get('/:cpnyId/:table/:adminSearch_id/edit', (req, res) => {
  const {cpnyId, table, adminSearch_id} = req.params
  const admin_edit_search = true
  const request = new sql.Request(pool)
  const warning = []

  request.query(`select b.${table}_NAME as adminSearch_name, a.${table}_DES as adminSearch_des
  from BF_JH_${table} a
  left join BF_JH_${table}_CATEGORY b
  on a.${table}_ID = b.${table}_ID
  where a.${table}_ID = ${adminSearch_id}
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const adminSearchInfo = result.recordset[0]
    adminSearchInfo.adminSearch_des = adminSearchInfo.adminSearch_des.replace(/\r\n/g, "\r")
    if(!adminSearchInfo){
      req.flash('warning_msg', '查無此筆資料，請重新嘗試!!')
      return res.redirect(`/admin_search/filter?companyFilter=${cpnyId}&tableFilter=${table}&search=`)
    }else{
      res.render('index', {adminSearchInfo, cpnyId, table, adminSearch_id, admin_edit_search})
    }
  })
})

// admin 篩選公司及類別進行查詢並顯示頁面
router.get('/filter', (req, res) => {
  const {companyFilter, tableFilter, search} = req.query
  const admin_search = true
  const request = new sql.Request(pool)
  const warning = []

  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(regex.test(search) || regex.test(companyFilter) || regex.test(tableFilter)){
    req.flash('warning_msg', '搜尋字串包含非法字元，請重新嘗試!')
    return res.redirect('/admin_search')
  }

  if(search && (!companyFilter || !tableFilter)){
    req.flash('warning_msg', '請先選擇公司及分類再進行查詢!!')
    return res.redirect('/admin_search')
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
    if(adminCompany.length == 1){
      req.flash('error', '還未新增公司，請先註冊公司帳號!!')
      return res.redirect('/admin_search')
    }
    if(!companyFilter || !tableFilter){
      warning.push({message: '公司和類別都是必選的!!'})
      return res.render('index', {adminCompany, companyFilter, tableFilter, warning, admin_search})
    }
    
    request.query(`select a.CPY_ID, c.CPY_NAME, a.${tableFilter}_ID as adminSearch_id, a.${tableFilter}_DES as adminSearch_des, b.${tableFilter}_NAME as adminSearch_name, b.ENTITY_NAME as adminSearch_entity_name
    from BF_JH_${tableFilter} a
    left join BF_JH_${tableFilter}_CATEGORY b
    on a.${tableFilter}_ID = b.${tableFilter}_ID
    left join BOTFRONT_USERS_INFO c
    on a.CPY_ID = c.CPY_ID
    where c.CPY_ID = '${companyFilter}'
    and b.${tableFilter}_NAME like '%%${search}%%'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const adminSearchInfo = result.recordset
      adminSearchInfo.forEach(search => {
        search.adminSearch_des = search.adminSearch_des.replace(/\r\n/g, "\r")
      })
      if(!adminSearchInfo.length){
        warning.push({message: '尚無此回覆資訊，請重新查詢!'})
        return res.render('index', { adminCompany, companyFilter, tableFilter, search, warning, admin_search})
      }else{
        res.render('index', {adminSearchInfo, adminCompany, companyFilter, tableFilter, search, admin_search})
      }
    })
  })
})

// 顯示 admin 空白查詢頁面
router.get('/', (req, res) => {
  const admin_search = true
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
    if(adminCompany.length == 1){
      req.flash('error', '還未新增公司，請先註冊公司帳號!!')
      return res.redirect('/')
    }
    res.render('index', {adminCompany, admin_search})
  })
})

module.exports = router