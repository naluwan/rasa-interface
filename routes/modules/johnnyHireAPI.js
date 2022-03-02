const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const axios = require('axios')
const qs = require('qs')
const {TrainSendMail, userSendMAil} = require('../../modules/sendMail')
const {fsJhWritePosition, fsJhDeletePosition} = require('../../modules/fileSystem')
const {setPositionDict} = require('../../modules/setDict')
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

// 編輯公司資訊API
router.get('/:cpnyId/:category/edit', authenticator, (req, res) => {
  const {cpnyId, category} = req.params
  const {entity_name, des} = req.query
  const request = new sql.Request(pool)

  if(!entity_name){
    return res.send({status: 'none', message: '查無此資訊，請重新嘗試!'})
  }

  if(!des){
    return res.send({status:'fail', message: '資訊內容為必填欄位!'})
  }

  request.query(`select b.${category.toUpperCase()}_ID
  from BF_JH_${category.toUpperCase()} a
  left join BF_JH_${category.toUpperCase()}_CATEGORY b
  on a.${category.toUpperCase()}_ID = b.${category.toUpperCase()}_ID
  where b.ENTITY_NAME = '${entity_name}'
  and a.CPY_ID = '${cpnyId}'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const info_id = result.recordset[0][`${category.toUpperCase()}_ID`]
    
    if(!info_id){
      return res.send({statue:'none', message: '查無此資訊，請重新嘗試!'})
    }else{
      request.input('des', sql.NVarChar(2000), decodeURI(des))
      .query(`update BF_JH_${category.toUpperCase()}
      set ${category.toUpperCase()}_DES = @des
      where ${category.toUpperCase()}_ID = ${info_id}
      and CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        
        res.send({status: 'success', message: '更新資訊內容成功!'})
      })
    }
  })
})

// // 新增新職缺類別及職缺資訊
// router.post('/api/v1/newPosition', (req, res) => {
//   const {cpy_no, industry_no, position_name, position_entity_name, position_des, token} = req.body
  
//   // 判斷傳入的token是否正確
//   if(token == process.env.API_TOKEN){
//     if(!cpy_no || !industry_no || !position_name || !position_entity_name || !position_des){
//       return res.status(400).send({message:`需求參數：cpy_no => 公司代號(統編), industry_no => 產業類別代號(新增使用者帳戶後會回傳industry_no), 
//       position_name => 職缺名稱, position_entity_name => 職缺英文名稱, position_des => 職缺資訊`})
//     }

//     // 連接資料庫
//     const request = new sql.Request(pool)
//     // 判斷新增職缺是否在此產業類別中
//     request.query(`select *
//     from BOTFRONT_ALL_POSITION
//     where INDUSTRY_NO = '${industry_no}'
//     and (POSITION_NAME = '${position_name}' or POSITION_ENTITY_NAME = '${position_entity_name}')`, (err, result) => {
//       if(err){
//         console.log(err)
//         return
//       }
//       const industryPositionCheck = result.recordset[0]
//       // 有值代表要新增的職缺已存在此產業類別中
//       if(industryPositionCheck){
//         // 判斷是中文名稱重複還是英文名稱重複
//         if(industryPositionCheck.POSITION_NAME == position_name){
//           return res.status(409).send({message: '職缺類別名稱重複，請重新嘗試!!'})
//         }else if(industryPositionCheck.POSITION_ENTITY_NAME == position_entity_name){
//           return res.status(409).send({message: '職缺類別英文名稱重複，請重新嘗試!!'})
//         }
//       }else{ // 在此產業類別中沒有相同的職缺
//         // 判斷新增的職缺是否存在全部職缺中(判斷有無訓練過)
//         // 因為botfront訓練時，同個中文詞不能有兩個英文名稱(entity)，所以先以中文判別是否有相同的職缺
//         request.query(`select *
//         from BOTFRONT_ALL_POSITION
//         where POSITION_NAME = '${position_name}'`, (err, result) => {
//           if(err){
//             console.log(err)
//             return
//           }
//           const positionCNCheck = result.recordset[0]
//           // 如果中文名稱相同，則從全部職缺中抓取相同的資料(中文和英文名稱)，再新增進此產業類別
//           // 因為此職缺是從資料庫抓資料，代表已經訓練過，所以在insert的時候要多一個值trained並給值1，在提醒訓練時不會顯示
//           if(positionCNCheck){
//             request.input('industry_no', sql.NVarChar(30), industry_no)
//             .input('position_name', sql.NVarChar(200), positionCNCheck.POSITION_NAME)
//             .input('position_entity_name', sql.NVarChar(200), positionCNCheck.POSITION_ENTITY_NAME)
//             .input('trained', sql.Bit, 1)
//             .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME, TRAINED)
//             values (@industry_no, @position_name, @position_entity_name, @trained)`, (err, result) => {
//               if(err){
//                 console.log(err)
//                 return
//               }
//               // 查詢新增職缺的position_no
//               request.query(`select *
//               from BOTFRONT_ALL_POSITION
//               where INDUSTRY_NO = '${industry_no}'
//               and POSITION_NAME = '${position_name}'`, (err, result) => {
//                 if(err){
//                   console.log(err)
//                   return
//                 }
//                 const position_no = result.recordset[0].POSITION_ID
//                 // 查詢新增職缺的position_id，如果找不到則刪除剛剛新增的職缺資訊
//                 if(!position_no){
//                   request.query(`delete from BOTFRONT_ALL_POSITION
//                   where INDUSTRY_NO = '${industry_no}'
//                   and POSITION_NAME = '${positionCNCheck.POSITION_NAME}'
//                   and POSITION_ENTITY_NAME = '${positionCNCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
//                     if(err){
//                       console.log(err)
//                       return
//                     }
//                     return res.status(404).send('查無此職缺類別，請重新嘗試!')
//                   })
//                 }else{
//                   // 新增職缺資訊
//                   // 由於前面新增用過industry_no這個變數，在同一個連接池不能有相同的變數名，所以再連接一個新的連接池
//                   const request = new sql.Request(pool)
//                   // 驗證傳進的cpy_no是否存在以及industry_no是否符合
//                   request.query(`select *
//                   from BOTFRONT_USERS_INFO
//                   where CPY_ID = '${cpy_no}'
//                   and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
//                     if(err){
//                       console.log(err)
//                       return
//                     }
//                     const cpyCheck = result.recordset[0]
//                     if(!cpyCheck){
//                       request.query(`delete from BOTFRONT_ALL_POSITION
//                       where INDUSTRY_NO = '${industry_no}'
//                       and POSITION_NAME = '${positionCNCheck.POSITION_NAME}'
//                       and POSITION_ENTITY_NAME = '${positionCNCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
//                       })
//                     }else{
//                       request.input('cpy_no', sql.NVarChar(30), cpy_no)
//                       .input('industry_no', sql.NVarChar(30), industry_no) 
//                       .input('position_no', sql.Int, position_no)
//                       .input('position_des', sql.NVarChar(2000), position_des)
//                       .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
//                       values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         // 新增完成後的通知
//                         // 如果中英文相同，代表這個職缺之前已經新增並訓練過，直接回覆新增職缺類別成功即可
//                         if(positionCNCheck.POSITION_ENTITY_NAME == position_entity_name){
//                           return res.status(200).send({message: `新增職缺類別「${position_name}」及職缺資訊成功!!`})
//                         }else{
//                           // 如果中文相同，英文名稱不同，則會提示對方因為此職缺名稱重複，所以資料會直接套用資料庫裡原有的資料新增
//                           return res.status(200).send({message: `新增職缺類別及資訊成功!!職缺名稱：「${position_name}」已重複，職缺英文名稱將套用資料庫資料新增!!`})
//                           // return console.log(`新增職缺類別及資訊成功!!職缺名稱：「${position_name}」已重複，職缺英文名稱將套用資料庫資料新增!!`)
//                         }
//                       })
//                     }
//                   })
//                 }
//               })
//             })
//           }else{ // 中文名稱不同
//             // 判斷英文名稱是否相同
//             request.query(`select *
//             from BOTFRONT_ALL_POSITION
//             where POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
//               if(err){
//                 console.log(err)
//                 return
//               }
//               const positionENCheck = result.recordset[0]
//               // 如果中文名稱不同，英文名稱相同，則會從資料庫抓取英文名稱並在insert進此產業類別時帶入新的中文名稱
//               // botfront訓練時，同個英文名稱(entity)，可以有多個中文詞，但必須新增並訓練
//               if(positionENCheck){
//                 request.input('industry_no', sql.NVarChar(30), industry_no)
//                 .input('position_name', sql.NVarChar(200), position_name)
//                 .input('position_entity_name', sql.NVarChar(200), positionENCheck.POSITION_ENTITY_NAME)
//                 .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME)
//                 values (@industry_no, @position_name, @position_entity_name)`, (err, result) => {
//                   if(err){
//                     console.log(err)
//                     return
//                   }
//                   request.query(`select * 
//                   from BOTFRONT_ALL_POSITION
//                   where INDUSTRY_NO = '${industry_no}'
//                   and POSITION_NAME = '${position_name}'`, (err, result) => {
//                     if(err){
//                       console.log(err)
//                       return
//                     }
//                     const position_no = result.recordset[0].POSITION_ID
//                     if(!position_no){
//                       request.query(`delete from
//                       BOTFRONT_ALL_POSITION
//                       where INDUSTRY_NO = '${industry_no}'
//                       and POISTION_NAME = '${position_name}'
//                       and POSITION_ENTITY_NAME = '${positionENCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         return res.status(404).send('查無此職缺類別，請重新嘗試!')
//                       })
//                     }else{
//                       const request = new sql.Request(pool)
//                       request.query(`select *
//                       from BOTFRONT_USERS_INFO
//                       where CPY_ID = '${cpy_no}'
//                       and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         const cpyCheck = result.recordset[0]
//                         if(!cpyCheck){
//                           request.query(`delete from BOTFRONT_ALL_POSITION
//                           where INDUSTRY_NO = '${industry_no}'
//                           and POSITION_NAME = '${position_name}'
//                           and POSITION_ENTITY_NAME = '${positionENCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
//                             if(err){
//                               console.log(err)
//                               return
//                             }
//                             return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
//                           })
//                         }else{
//                           request.input('cpy_no', sql.NVarChar(30), cpy_no)
//                           .input('industry_no', sql.NVarChar(30), industry_no)
//                           .input('position_no', sql.Int, position_no)
//                           .input('position_des', sql.NVarChar(2000), position_des)
//                           .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
//                           values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
//                             if(err){
//                               console.log(err)
//                               return
//                             }
//                             TrainSendMail(res, 'mail_newPosition', position_name, positionENCheck.POSITION_ENTITY_NAME, '新職缺類別')
//                             return res.status(200).send({message: `新增職缺類別「${position_name}」及職缺資訊成功!!`})
//                           })
//                         }
//                       })
//                     }
//                   })
//                 })
//               }else{
//                 const request = new sql.Request(pool)
//                 // 中文不同，英文不同，代表新增的職缺是沒有訓練過並從來有出現在資料庫的職缺
//                 // 所以新增完成後，必須到botfront新增並訓練
//                 request.input('industry_no', sql.NVarChar(30), industry_no)
//                 .input('position_name', sql.NVarChar(200), position_name)
//                 .input('position_entity_name', sql.NVarChar(200), position_entity_name)
//                 .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME)
//                 values (@industry_no, @position_name, @position_entity_name)`, (err, result) => {
//                   if(err){
//                     console.log(err)
//                     return
//                   }
//                   request.query(`select *
//                   from BOTFRONT_ALL_POSITION
//                   where INDUSTRY_NO = '${industry_no}'
//                   and POSITION_NAME = '${position_name}'
//                   and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
//                     if(err){
//                       console.log(err)
//                       return
//                     }
//                     const position_no = result.recordset[0].POSITION_ID
//                     if(!position_no){
//                       request.query(`delete from BOTFRONT_ALL_POSITION
//                       where INDUSTRY_NO = '${industry_no}'
//                       and POSITION_NAME = '${position_name}'
//                       and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         return res.status(404).send('查無此職缺類別，請重新嘗試!')
//                       })
//                     }else{
//                       request.query(`select *
//                       from BOTFRONT_USERS_INFO
//                       where CPY_ID = '${cpy_no}'
//                       and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
//                         if(err){
//                           console.log(err)
//                           return
//                         }
//                         const cpyCheck = result.recordset[0]
//                         if(!cpyCheck){
//                           request.query(`delete from BOTFRONT_ALL_POSITION
//                           where INDUSTRY_NO = '${industry_no}'
//                           and POSITION_NAME = '${position_name}'
//                           and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
//                             if(err){
//                               console.log(err)
//                               return
//                             }
//                             return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
//                           })
//                         }else{
//                           const request = new sql.Request(pool)
//                           request.input('cpy_no', sql.NVarChar(30), cpy_no)
//                           .input('industry_no', sql.NVarChar(30), industry_no)
//                           .input('position_no', sql.Int, position_no)
//                           .input('position_des', sql.NVarChar(2000), position_des)
//                           .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
//                           values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
//                             if(err){
//                               console.log(err)
//                               return
//                             }
//                             TrainSendMail(res, 'mail_newPosition', position_name, position_entity_name, '新職缺類別')
//                             return res.status(200).send({message: `新增職缺類別「${position_name}」成功!!`})
//                           })
//                         }
//                       })
//                     }
//                   })
//                 })
//               }
//             })
//           }
//         })
//       }
//     })
//   }else{
//     return res.status(403).send({status: `fail`, code: 403, message: ['沒有權限做此操作!!'], data})
//   }
// })

module.exports = router