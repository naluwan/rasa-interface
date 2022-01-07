const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')

const sql = require('mssql')
const pool = require('../../config/connectPool')
const {TrainSendMail, userSendMAil} = require('../../modules/sendMail')

// 使用者帳號
router.post('/api/v1/user', (req, res) => {
  const { cpy_id, cpy_name, email, password, token} = req.body
  if(token == process.env.API_TOKEN){
    if(!cpy_id || !cpy_name || !email || !password){
      return res.status(400).send('需求參數：cpy_id => 公司代號(統編), cpy_name => 公司名稱, email => 信箱(帳號), password => 密碼')
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
          return res.status(409).send({message: '公司代號重複!!請重新嘗試!!'})
        }

        if(userCheck.CPY_NAME == cpy_name){
          return res.status(409).send({message: '公司名稱重複!!請重新嘗試!!'})
        }

        if(userCheck.EMAIL == email){
          return res.status(409).send({message: '公司信箱重複!!請重新嘗試!!'})
        }
        
      }else{
        // 驗證資料庫裡cpy_id和cpy_name是否有重複的值
        request.query(`select * 
        from BOTFRONT_TYPE_OF_INDUSTRY
        where INDUSTRY_ID = '${cpy_id}'
        or INDUSTRY_NAME = '${cpy_name}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const industryCheck = result.recordset[0]
          if(industryCheck){
            return res.status(409).send({message: '公司代號或公司名稱重複!!請重新嘗試!!'})
          }else{
            // 利用公司名稱和公司代號創建產業類別
            request.input('industry_name', sql.NVarChar(200), cpy_name)
            .input('industry_id', sql.NVarChar(30), cpy_id)
            .query(`insert into BOTFRONT_TYPE_OF_INDUSTRY(INDUSTRY_ID, INDUSTRY_NAME)
            values (@industry_id, @industry_name)`,(err, result) => {
              if(err){
                console.log(err)
                return
              }
            })
            // 使用bcrypt加密密碼再存進資料庫
            bcrypt
            .genSalt(10)
            .then(salt => bcrypt.hash(password, salt))
            .then(hash => {
              request.query(`select INDUSTRY_ID
              from BOTFRONT_TYPE_OF_INDUSTRY
              where INDUSTRY_NAME = '${cpy_name}'`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                const industry_no = result.recordset[0].INDUSTRY_ID
                // 新增進資料庫
                request.input('cpy_id', sql.NVarChar(30), cpy_id)
                .input('cpy_name', sql.NVarChar(80), cpy_name)
                .input('email', sql.NVarChar(80), email)
                .input('password', sql.NVarChar(100), hash)
                .input('industry_no', sql.NVarChar(30), industry_no)
                .query(`insert into BOTFRONT_USERS_INFO (CPY_ID, CPY_NAME, EMAIL, PASSWORD, INDUSTRY_NO)
                values (@cpy_id, @cpy_name, @email, @password, @industry_no)`, (err, result) => {
                  if(err){
                    console.log(err)
                    return
                  }
                  // 增加公司資訊description(ex.tel, address)







                  userSendMAil(res, 'mail_newUser', cpy_id, cpy_name, email, '新使用者加入')
                  // 用response回傳狀態碼和成功資訊，另外回傳此間公司的industry_no，以便要傳入職缺類別
                  return res.status(200).send({message:'使用者資料寫入成功!!', industry_no})
                })
              })
            }).catch(err => console.log(err))
          }
        })
      }
    })
  }else{
    return res.status(401).send('沒有足夠權限做此操作!!')
  }
})

// 新增新職缺類別及職缺資訊
router.post('/api/v1/position', (req, res) => {
  const {cpy_no, industry_no, position_name, position_entity_name, position_des, token} = req.body
  
  // 判斷傳入的token是否正確
  if(token == process.env.API_TOKEN){
    if(!cpy_no || !industry_no || !position_name || !position_entity_name || !position_des){
      return res.status(400).send(`需求參數：cpy_no => 公司代號(統編), industry_no => 產業類別代號(新增使用者帳戶後會回傳industry_no), 
      position_name => 職缺名稱, position_entity_name => 職缺英文名稱, position_des => 職缺資訊`)
    }

    // 連接資料庫
    const request = new sql.Request(pool)
    // 判斷新增職缺是否在此產業類別中
    request.query(`select *
    from BOTFRONT_ALL_POSITION
    where INDUSTRY_NO = '${industry_no}'
    and (POSITION_NAME = '${position_name}' or POSITION_ENTITY_NAME = '${position_entity_name}')`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const industryPositionCheck = result.recordset[0]
      // 有值代表要新增的職缺已存在此產業類別中
      if(industryPositionCheck){
        // 判斷是中文名稱重複還是英文名稱重複
        if(industryPositionCheck.POSITION_NAME == position_name){
          return res.status(409).send({message: '職缺類別名稱重複，請重新嘗試!!'})
        }else if(industryPositionCheck.POSITION_ENTITY_NAME == position_entity_name){
          return res.status(409).send({message: '職缺類別英文名稱重複，請重新嘗試!!'})
        }
      }else{ // 在此產業類別中沒有相同的職缺
        // 判斷新增的職缺是否存在全部職缺中(判斷有無訓練過)
        // 因為botfront訓練時，同個中文詞不能有兩個英文名稱(entity)，所以先以中文判別是否有相同的職缺
        request.query(`select *
        from BOTFRONT_ALL_POSITION
        where POSITION_NAME = '${position_name}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const positionCNCheck = result.recordset[0]
          // 如果中文名稱相同，則從全部職缺中抓取相同的資料(中文和英文名稱)，再新增進此產業類別
          // 因為此職缺是從資料庫抓資料，代表已經訓練過，所以在insert的時候要多一個值trained並給值1，在提醒訓練時不會顯示
          if(positionCNCheck){
            request.input('industry_no', sql.NVarChar(30), industry_no)
            .input('position_name', sql.NVarChar(200), positionCNCheck.POSITION_NAME)
            .input('position_entity_name', sql.NVarChar(200), positionCNCheck.POSITION_ENTITY_NAME)
            .input('trained', sql.Bit, 1)
            .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME, TRAINED)
            values (@industry_no, @position_name, @position_entity_name, @trained)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              // 查詢新增職缺的position_no
              request.query(`select *
              from BOTFRONT_ALL_POSITION
              where INDUSTRY_NO = '${industry_no}'
              and POSITION_NAME = '${position_name}'`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
                const position_no = result.recordset[0].POSITION_ID
                // 查詢新增職缺的position_id，如果找不到則刪除剛剛新增的職缺資訊
                if(!position_no){
                  request.query(`delete from BOTFRONT_ALL_POSITION
                  where INDUSTRY_NO = '${industry_no}'
                  and POSITION_NAME = '${positionCNCheck.POSITION_NAME}'
                  and POSITION_ENTITY_NAME = '${positionCNCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
                    if(err){
                      console.log(err)
                      return
                    }
                    return res.status(404).send('查無此職缺類別，請重新嘗試!')
                  })
                }else{
                  // 新增職缺資訊
                  // 由於前面新增用過industry_no這個變數，在同一個連接池不能有相同的變數名，所以再連接一個新的連接池
                  const request = new sql.Request(pool)
                  // 驗證傳進的cpy_no是否存在以及industry_no是否符合
                  request.query(`select *
                  from BOTFRONT_USERS_INFO
                  where CPY_ID = '${cpy_no}'
                  and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
                    if(err){
                      console.log(err)
                      return
                    }
                    const cpyCheck = result.recordset[0]
                    if(!cpyCheck){
                      request.query(`delete from BOTFRONT_ALL_POSITION
                      where INDUSTRY_NO = '${industry_no}'
                      and POSITION_NAME = '${positionCNCheck.POSITION_NAME}'
                      and POSITION_ENTITY_NAME = '${positionCNCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
                      })
                    }else{
                      request.input('cpy_no', sql.NVarChar(30), cpy_no)
                      .input('industry_no', sql.NVarChar(30), industry_no) 
                      .input('position_no', sql.Int, position_no)
                      .input('position_des', sql.NVarChar(2000), position_des)
                      .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
                      values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        // 新增完成後的通知
                        // 如果中英文相同，代表這個職缺之前已經新增並訓練過，直接回覆新增職缺類別成功即可
                        if(positionCNCheck.POSITION_ENTITY_NAME == position_entity_name){
                          return res.status(200).send({message: `新增職缺類別「${position_name}」及職缺資訊成功!!`})
                        }else{
                          // 如果中文相同，英文名稱不同，則會提示對方因為此職缺名稱重複，所以資料會直接套用資料庫裡原有的資料新增
                          return res.status(200).send({message: `新增職缺類別及資訊成功!!職缺名稱：「${position_name}」已重複，職缺英文名稱將套用資料庫資料新增!!`})
                          // return console.log(`新增職缺類別及資訊成功!!職缺名稱：「${position_name}」已重複，職缺英文名稱將套用資料庫資料新增!!`)
                        }
                      })
                    }
                  })
                }
              })
            })
          }else{ // 中文名稱不同
            // 判斷英文名稱是否相同
            request.query(`select *
            from BOTFRONT_ALL_POSITION
            where POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              const positionENCheck = result.recordset[0]
              // 如果中文名稱不同，英文名稱相同，則會從資料庫抓取英文名稱並在insert進此產業類別時帶入新的中文名稱
              // botfront訓練時，同個英文名稱(entity)，可以有多個中文詞，但必須新增並訓練
              if(positionENCheck){
                request.input('industry_no', sql.NVarChar(30), industry_no)
                .input('position_name', sql.NVarChar(200), position_name)
                .input('position_entity_name', sql.NVarChar(200), positionENCheck.POSITION_ENTITY_NAME)
                .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME)
                values (@industry_no, @position_name, @position_entity_name)`, (err, result) => {
                  if(err){
                    console.log(err)
                    return
                  }
                  request.query(`select * 
                  from BOTFRONT_ALL_POSITION
                  where INDUSTRY_NO = '${industry_no}'
                  and POSITION_NAME = '${position_name}'`, (err, result) => {
                    if(err){
                      console.log(err)
                      return
                    }
                    const position_no = result.recordset[0].POSITION_ID
                    if(!position_no){
                      request.query(`delete from
                      BOTFRONT_ALL_POSITION
                      where INDUSTRY_NO = '${industry_no}'
                      and POISTION_NAME = '${position_name}'
                      and POSITION_ENTITY_NAME = '${positionENCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        return res.status(404).send('查無此職缺類別，請重新嘗試!')
                      })
                    }else{
                      const request = new sql.Request(pool)
                      request.query(`select *
                      from BOTFRONT_USERS_INFO
                      where CPY_ID = '${cpy_no}'
                      and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        const cpyCheck = result.recordset[0]
                        if(!cpyCheck){
                          request.query(`delete from BOTFRONT_ALL_POSITION
                          where INDUSTRY_NO = '${industry_no}'
                          and POSITION_NAME = '${position_name}'
                          and POSITION_ENTITY_NAME = '${positionENCheck.POSITION_ENTITY_NAME}'`, (err, result) => {
                            if(err){
                              console.log(err)
                              return
                            }
                            return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
                          })
                        }else{
                          request.input('cpy_no', sql.NVarChar(30), cpy_no)
                          .input('industry_no', sql.NVarChar(30), industry_no)
                          .input('position_no', sql.Int, position_no)
                          .input('position_des', sql.NVarChar(2000), position_des)
                          .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
                          values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
                            if(err){
                              console.log(err)
                              return
                            }
                            TrainSendMail(res, 'mail_newPosition', position_name, positionENCheck.POSITION_ENTITY_NAME, '新職缺類別')
                            return res.status(200).send({message: `新增職缺類別「${position_name}」及職缺資訊成功!!`})
                          })
                        }
                      })
                    }
                  })
                })
              }else{
                const request = new sql.Request(pool)
                // 中文不同，英文不同，代表新增的職缺是沒有訓練過並從來有出現在資料庫的職缺
                // 所以新增完成後，必須到botfront新增並訓練
                request.input('industry_no', sql.NVarChar(30), industry_no)
                .input('position_name', sql.NVarChar(200), position_name)
                .input('position_entity_name', sql.NVarChar(200), position_entity_name)
                .query(`insert into BOTFRONT_ALL_POSITION (INDUSTRY_NO, POSITION_NAME, POSITION_ENTITY_NAME)
                values (@industry_no, @position_name, @position_entity_name)`, (err, result) => {
                  if(err){
                    console.log(err)
                    return
                  }
                  request.query(`select *
                  from BOTFRONT_ALL_POSITION
                  where INDUSTRY_NO = '${industry_no}'
                  and POSITION_NAME = '${position_name}'
                  and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
                    if(err){
                      console.log(err)
                      return
                    }
                    const position_no = result.recordset[0].POSITION_ID
                    if(!position_no){
                      request.query(`delete from BOTFRONT_ALL_POSITION
                      where INDUSTRY_NO = '${industry_no}'
                      and POSITION_NAME = '${position_name}'
                      and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        return res.status(404).send('查無此職缺類別，請重新嘗試!')
                      })
                    }else{
                      request.query(`select *
                      from BOTFRONT_USERS_INFO
                      where CPY_ID = '${cpy_no}'
                      and INDUSTRY_NO = '${industry_no}'`, (err, result) => {
                        if(err){
                          console.log(err)
                          return
                        }
                        const cpyCheck = result.recordset[0]
                        if(!cpyCheck){
                          request.query(`delete from BOTFRONT_ALL_POSITION
                          where INDUSTRY_NO = '${industry_no}'
                          and POSITION_NAME = '${position_name}'
                          and POSITION_ENTITY_NAME = '${position_entity_name}'`, (err, result) => {
                            if(err){
                              console.log(err)
                              return
                            }
                            return res.status(404).send('查無此公司或產業類別，請重新嘗試!')
                          })
                        }else{
                          const request = new sql.Request(pool)
                          request.input('cpy_no', sql.NVarChar(30), cpy_no)
                          .input('industry_no', sql.NVarChar(30), industry_no)
                          .input('position_no', sql.Int, position_no)
                          .input('position_des', sql.NVarChar(2000), position_des)
                          .query(`insert into BOTFRONT_POSITION_INFO (CPY_NO, INDUSTRY_NO, POSITION_NO, POSITION_DES)
                          values (@cpy_no, @industry_no, @position_no, @position_des)`, (err, result) => {
                            if(err){
                              console.log(err)
                              return
                            }
                            TrainSendMail(res, 'mail_newPosition', position_name, position_entity_name, '新職缺類別')
                            return res.status(200).send({message: `新增職缺類別「${position_name}」成功!!`})
                          })
                        }
                      })
                    }
                  })
                })
              }
            })
          }
        })
      }
    })
  }else{
    return res.status(401).send('沒有足夠權限做此操作!!')
  }
})

module.exports = router