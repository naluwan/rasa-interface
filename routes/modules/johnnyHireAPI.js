const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const axios = require('axios')
const qs = require('qs')
const {TrainSendMail, userSendMAil} = require('../../modules/sendMail')
const {fsJhWritePosition, fsJhDeletePosition, fsUpdateCategoryNlu, fsJhWriteInfo, fsWriteLeave, fsWriteSubsidy} = require('../../modules/fileSystem')
const {setPositionDict, setInfoDict} = require('../../modules/setDict')
const {authenticator} = require('../../middleware/auth')


// 徵厲害新增使用者帳號API
router.post('/api/v1/newUser', (req, res) => {
  const { cpy_id, cpy_name, email, password, token} = req.body
  let data = {}
  if(token == process.env.API_TOKEN){
    if(!cpy_id || !cpy_name || !email || !password){
      return res.status(400).send({status: `fail`, code: 400, message:[`系統錯誤`], data})
    }
    const request = new sql.Request(pool)
    // 驗證使用者資訊是否重複
    request.query(`select *
    from BOTFRONT_USERS_INFO
    where CPY_ID = '${cpy_id}' or CPY_NAME = '${cpy_name}' or EMAIL = '${email}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const userCheck = result.recordset[0]
      if(userCheck){
        if(userCheck.CPY_ID == cpy_id){
          return res.status(409).send({status: `fail`, code: 409, message: ['公司代號重複，請重新嘗試!!'], data})
        }

        if(userCheck.CPY_NAME == cpy_name){
          return res.status(409).send({status: `fail`, code: 409, message: ['公司名稱重複，請重新嘗試!!'], data})
        }

        if(userCheck.EMAIL == email){
          return res.status(409).send({status: `fail`, code: 409, message: ['公司信箱重複，請重新嘗試!!'], data})
        }
        
      }else{           
        // 使用bcrypt加密密碼再存進資料庫
        bcrypt
        .genSalt(10)
        .then(salt => bcrypt.hash(password, salt))
        .then(hash => {
          // 新增進資料庫
          request.input('cpy_id', sql.NVarChar(30), cpy_id)
          .input('cpy_name', sql.NVarChar(80), cpy_name)
          .input('email', sql.NVarChar(80), email)
          .input('password', sql.NVarChar(100), hash)
          .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD)
          values (@cpy_id, @cpy_name, @email, @password)`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            // 增加公司資訊description(ex.tel, address)
            
            userSendMAil(res, 'mail_newUser', cpy_id, cpy_name, email, '新使用者加入')
            request.query(`select * 
            from BOTFRONT_USERS_INFO
            where CPY_ID = '${cpy_id}'`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              data = result.recordset[0]
              return res.status(200).send({status: `success`,message: ['新增使用者成功!'], data})
            })
          })
        }).catch(err => console.log(err))
      }
    })
  }else{
    return res.status(403).send({status: `fail`, code: 403, message: ['沒有權限做此操作!!'], data})
  }
})

// 徵厲害新增職缺API
router.post('/api/v2/newPosition', (req, res) => {
  const {position_name, position_des, cpy_id, entity_name, token} = req.body
  let data = {}

  if(token == process.env.API_TOKEN){
    if(!position_name || !position_des || !cpy_id || !entity_name){
      return res.status(400).send({status: `fail`, code: 400, message:[`系統錯誤`], data})
    }
    const request = new sql.Request(pool)

    // 驗證職缺類別是否有資料
    request.query(`select POSITION_ID
    from BF_JH_POSITION_CATEGORY
    where POSITION_NAME = '${position_name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const positionCheck = result.recordset[0]

      // 職缺類別已在資料
      if(positionCheck){
        const position_id = positionCheck.POSITION_ID

        // 驗證職缺資訊是否已經新增過
        request.query(`select *
        from BF_JH_POSITION
        where CPY_ID = '${cpy_id}'
        and POSITION_ID = ${position_id}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const positionDesCheck = result.recordset[0]

          if(positionDesCheck){
            return res.status(409).send({status: `fail`, code: 409, message: ['新增失敗，此職缺已有資料!!'], data})
          }else{
            request.input('cpy_id', sql.NVarChar(30), cpy_id)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), position_des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpy_id, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              request.query(`select b.CPY_ID, b.CPY_NAME, a.POSITION_ID, c.POSITION_NAME, c.ENTITY_NAME, a.POSITION_DES 
              from BF_JH_POSITION a
              left join BOTFRONT_USERS_INFO b
              on a.CPY_ID = b.CPY_ID
              left join BF_JH_POSITION_CATEGORY c
              on a.POSITION_ID = c.POSITION_ID
              where a.CPY_ID = '${cpy_id}'
              and a.POSITION_ID = ${position_id}`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                data = result.recordset[0]
                res.status(200).send({status: `success`, message: ['新增職缺成功!!'], data})
              })
            })
          }
        })
      }else{
        // 職缺類別不在資料庫
        // 不在資料庫的職缺類別，先新增類別，獲取position_id後再新增職缺資訊
        request.input('name', sql.NVarChar(200), position_name)
        .input('entity', sql.NVarChar(200), entity_name)
        .query(`insert into BF_JH_POSITION_CATEGORY (POSITION_NAME, ENTITY_NAME)
        values (@name, @entity)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          // 新增完職缺類別後，寫檔及寫入dict
          fsJhWritePosition(position_name, entity_name, request)
          setPositionDict(position_name)

          // 獲取position_id
          request.query(`select POSITION_ID
          from BF_JH_POSITION_CATEGORY
          where POSITION_NAME = '${position_name}'
          and ENTITY_NAME = '${entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const position_id = result.recordset[0]['POSITION_ID']

            request.input('cpy_id', sql.NVarChar(30), cpy_id)
            .input('position_id', sql.Int, position_id)
            .input('des', sql.NVarChar(2000), position_des)
            .query(`insert into BF_JH_POSITION (CPY_ID, POSITION_ID, POSITION_DES)
            values (@cpy_id, @position_id, @des)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              request.query(`select b.CPY_ID, b.CPY_NAME, a.POSITION_ID, c.POSITION_NAME, c.ENTITY_NAME, a.POSITION_DES 
              from BF_JH_POSITION a
              left join BOTFRONT_USERS_INFO b
              on a.CPY_ID = b.CPY_ID
              left join BF_JH_POSITION_CATEGORY c
              on a.POSITION_ID = c.POSITION_ID
              where a.CPY_ID = '${cpy_id}'
              and a.POSITION_ID = ${position_id}`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                data = result.recordset[0]
                res.status(200).send({status: `success`, message: ['新增職缺成功!!'], data})
              })
            })
          })
        })
      }
    })
  }else{
    return res.status(403).send({status: `fail`, code: 403, message: ['沒有權限做此操作!!'], data})
  }
})

// 徵厲害admin編輯帳號資訊API
router.get('/:cpny_id/cpny/admin_edit', (req, res) => {
  const {cpny_id} = req.params
  const {cpy_no, cpy_name, email, ishr, isadmin} = req.query
  const request = new sql.Request(pool)

  if(!cpny_id){
    res.send({status: 'error', message: '查無此使用者資料，請重新嘗試!'})
    return
  }

  if(!cpy_no || !cpy_name || !email || !ishr || !isadmin){
    res.send({status:'warning', message: '所有欄位都為必填欄位!'})
    return
  }

  request.query(`select * 
  from BOTFRONT_USERS_INFO
  where CPY_ID = '${cpny_id}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const cpnyCheck = result.recordset[0]

    if(!cpnyCheck){
      res.send({status: 'error', message: '查無此使用者資料，請重新嘗試!'})
      return
    }else{
      request.input('cpy_id', sql.NVarChar(30), cpy_no)
      .input('cpy_name', sql.NVarChar(80), cpy_name)
      .input('email', sql.NVarChar(80), email)
      .input('ishr', sql.Bit, parseInt(ishr))
      .input('isadmin', sql.Bit, parseInt(isadmin))
      .query(`update BOTFRONT_USERS_INFO
      set CPY_ID = @cpy_id, CPY_NAME = @cpy_name, EMAIL = @email, ISHR = @ishr, ISADMIN = @isadmin
      where CPY_ID = '${cpny_id}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.send({status: 'success', message: '帳號資料更新成功!'})
      })
    }
  })
})

// 徵厲害admin編輯資訊類別API
router.get('/:info_id/:category/admin_edit_category', (req, res) => {
  const {category, info_id} = req.params
  const {cnName, entity_name} = req.query

  if(!category || !info_id){
    res.send({status: 'error', message: '查無此資訊類別，請重新嘗試!'})
    return
  }

  if(!cnName || !entity_name){
    res.send({status:'warning', message: '資訊名稱和英文名稱為必填欄位!'})
    return
  }

  request.query(`select * 
  from BF_JH_${category.toUpperCase()}_CATEGORY
  where ${category.toUpperCase()}_ID = ${info_id}`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    const infoCheck = result.recordset[0][`${category.toUpperCase()}_NAME`]
    if(!infoCheck){
      res.send({status: 'error', message: '查無此資訊類別，請重新嘗試!'})
      return
    }else{
      request.input('cnName', sql.NVarChar(200), cnName)
      .input('entity_name', sql.NVarChar(200), entity_name)
      .query(`update BF_JH_${category.toUpperCase()}_CATEGORY
      set ${category.toUpperCase()}_NAME = @cnName, ENTITY_NAME = @entity_name
      where ${category.toUpperCase()}_ID = ${info_id}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        let intent = ''
        switch (category) {
          case 'position':
            intent = '職缺'
            break;
          case 'leave':
            intent = '問假別資訊'
            break;
          case 'subsidy':
            intent = '問補助資訊'
            break;
          default:
            intent = '問公司資訊'
            break;
        }
        fsUpdateCategoryNlu(infoCheck, intent, cnName, entity_name, request)
        setInfoDict(cnName)
        res.send({status: 'success', message: '更新資訊內容成功!'})
      })
    }
  })
})

module.exports = router