const axios = require('axios')

module.exports = {
  // 徵厲害 user 新增資訊
  insertDes: (request, sql, res, infoData, fsFunc) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${infoData.category.toUpperCase()}`
    const table_category = `BF_JH_${infoData.category.toUpperCase()}_CATEGORY`
    const category_id = `${infoData.category.toUpperCase()}_ID`
    const category_name = `${infoData.category.toUpperCase()}_NAME`
    const category_des = `${infoData.category.toUpperCase()}_DES`

    // 驗證要新增的資訊類別是否存在
    request.query(`select ${category_id}
    from ${table_category}
    where ${category_name} = '${infoData.cnName}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      try {
        // 新增類別已存在
        const idCheck = result.recordset[0][`${category_id}`]

        // 驗證要新增資訊是否已存在
        request.query(`select * 
        from ${table}
        where ${category_id} = ${idCheck}
        and CPY_ID = '${infoData.cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          
          const desCheck = result.recordset[0]
          if(desCheck){
            return  res.send({status: 'error', message: '已新增過此資訊，如要修改內容請使用編輯功能'})
          }else{
            request.input('cpnyId', sql.NVarChar(200), infoData.cpnyId)
            .input('info_id', sql.Int, idCheck)
            .input('des', sql.NVarChar(2000), decodeURI(infoData.des))
            .input('num', sql.NVarChar(200) , infoData.num)
            .query(`insert into ${table} (CPY_ID, ${category_id}, ${category_des}, INFO_ID) 
            values (@cpnyId, @info_id, @des, @num)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.send({status: 'success', message: '新增資訊成功'})
            })
          }
        })
      } catch (error) {
        // 新增類別不存在
        // 先驗證nlu訓練檔中有沒有資料
        axios.get('http://localhost:3030/train/jh/trainingData')
        .then(response => {
          return response.data
        })
        .then(data => {
          // const nluData = data.nlu.zh.rasa_nlu_data.common_examples
          // const targetCategory = nluData.filter(item => item.text == infoData.cnName)
          // if(targetCategory.length){
          //   request.input('targetName', sql.NVarChar(200), targetCategory[0].text)
          //   .input('targetEntity', sql.NVarChar(200), targetCategory[0].entities[0].entity)
          //   .query(`insert into ${table_category} (${category_name}, ENTITY_NAME) 
          //   values (@targetName, @targetEntity)`, (err, result) => {
          //     if(err){
          //       console.log(err)
          //       return
          //     }

          //     request.query(`select ${category_id} as id
          //     from ${table_category} 
          //     where ${category_name} = '${targetCategory[0].text}'
          //     and ENTITY_NAME = '${targetCategory[0].entities[0].entity}'`, (err, result) => {
          //       if(err){
          //         console.log(err)
          //         return
          //       }

          //       const des_id = result.recordset[0]['id']

          //       request.input('cpnyId', sql.NVarChar(200), infoData.cpnyId)
          //       .input('des_id', sql.NVarChar(200), des_id)
          //       .input('des', sql.NVarChar(2000), decodeURI(infoData.des))
          //       .input('num', sql.NVarChar(200), infoData.num)
          //       .query(`insert into ${table} (CPY_ID, ${category_id}, ${category_des}, INFO_ID) 
          //       values (@cpnyId, @des_id, @des, @num)`, (err, result) => {
          //         if(err){
          //           console.log(err)
          //           return
          //         }
          //         return res.send({status: 'success', message: '新增資訊成功'})
          //       })
          //     })
          //   })
          // }
        // 類別不存在時先新增類別
          request.input('cnName', sql.NVarChar(200), infoData.cnName)
          .input('entity_name', sql.NVarChar(200), infoData.entity_name)
        .query(`insert into ${table_category} (${category_name}, ENTITY_NAME) 
        values (@cnName, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          // 寫檔及寫入dict
            switch(infoData.category){
            case 'cpnyinfo':
                fsFunc.fsJhWriteInfo(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
            case 'position':
                fsFunc.fsJhWritePosition(infoData.cnName, infoData.entity_name, request)
                fsFunc.setPositionDict(infoData.cnName)
              break
            case 'subsidy':
                fsFunc.fsWriteSubsidy(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
            default:
                fsFunc.fsWriteLeave(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
          }

          // 取得剛新增的類別id
          request.query(`select ${category_id} as id
          from ${table_category}
            where ${category_name} = '${infoData.cnName}'
            and ENTITY_NAME = '${infoData.entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }

            const des_id = result.recordset[0][`id`]

              request.input('cpnyId', sql.NVarChar(200), infoData.cpnyId)
            .input('des_id', sql.NVarChar(200), des_id)
              .input('des', sql.NVarChar(2000), decodeURI(infoData.des))
              .input('num', sql.NVarChar(200), infoData.num)
              .query(`insert into ${table} (CPY_ID, ${category_id}, ${category_des}, INFO_ID) 
            values (@cpnyId, @des_id, @des, @num)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.send({status: 'success', message: '新增資訊成功'})
            })
          })
        })
        })
        .catch(err => console.log(err))
      }
    })
  },
  // 徵厲害 user 編輯資訊
  updateDes: (request, sql, res, data) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${data.category.toUpperCase()}`
    const table_category = `BF_JH_${data.category.toUpperCase()}_CATEGORY`
    const category_id = `${data.category.toUpperCase()}_ID`
    const category_name = `${data.category.toUpperCase()}_NAME`
    const category_des = `${data.category.toUpperCase()}_DES`

    request.query(`select * 
    from ${table} a
    left join ${table_category} b
    on a.${category_id} = b.${category_id}
    where a.INFO_ID = '${data.infoId}'
    and b.ENTITY_NAME = '${data.entity_name}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const infoCheck = result.recordset[0]

      if(!infoCheck){
        return res.send({status: 'error', message: '查無此資訊，請重新嘗試'})
      }else{
        request.input('des', sql.NVarChar(2000), decodeURI(data.des))
        .query(`update BF_JH_${data.category.toUpperCase()}
        set ${category_des} = @des
        where INFO_ID = '${data.infoId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          res.send({status: 'success', message: '更新資訊內容成功'})
        })
      }
    })
  },
  // 徵厲害 user 刪除資訊
  deleteDes: (request, res, data) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${data.category.toUpperCase()}`
    const table_category = `BF_JH_${data.category.toUpperCase()}_CATEGORY`
    const category_id = `${data.category.toUpperCase()}_ID`
    const category_name = `${data.category.toUpperCase()}_NAME`
    const category_des = `${data.category.toUpperCase()}_DES`
    request.query(`select * 
    from ${table} 
    where INFO_ID = '${data.infoId}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const infoCheck = result.recordset[0]

      if(!infoCheck){
        return res.send({status: 'error', message: '查無此資訊，請重新嘗試'})
      }else{
        request.query(`delete from ${table}
        where INFO_ID = '${data.infoId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          res.send({status: 'success', message: '刪除資訊成功'})
        })
      }
    })
  },
  // 徵厲害 admin 編輯類別
  updateCategory: (request, sql, res, data, fsFunc) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${data.category.toUpperCase()}`
    const table_category = `BF_JH_${data.category.toUpperCase()}_CATEGORY`
    const category_id = `${data.category.toUpperCase()}_ID`
    const category_name = `${data.category.toUpperCase()}_NAME`
    const category_des = `${data.category.toUpperCase()}_DES`

    request.query(`select * 
    from ${table_category}
    where ${category_id} = ${data.infoId}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      
      try {
        const infoCheck = result.recordset[0][`${category_name}`]

        request.input('cnName', sql.NVarChar(200), decodeURI(data.cnName))
        .input('entity_name', sql.NVarChar(200), data.entity_name)
        .query(`update ${table_category}
        set ${category_name} = @cnName, ENTITY_NAME = @entity_name
        where ${category_id} = ${data.infoId}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          let intent = ''
          switch (data.category) {
            case 'position':
              intent = '職缺'
              fsFunc.setPositionDict(decodeURI(data.cnName))
              break;
            case 'leave':
              intent = '問假別資訊'
              fsFunc.setInfoDict(decodeURI(data.cnName))
              break;
            case 'subsidy':
              intent = '問補助資訊'
              fsFunc.setInfoDict(decodeURI(data.cnName))
              break;
            default:
              intent = '問公司資訊'
              fsFunc.setInfoDict(decodeURI(data.cnName))
              break;
          }
          fsFunc.fsUpdateCategoryNlu(infoCheck, intent, decodeURI(data.cnName), data.entity_name, request)
          res.send({status: 'success', message: '更新資訊內容成功'})
        })
      } catch (error) {
        res.send({status: 'error', message: '查無此資訊類別，請重新嘗試'})
      }
    })
  },
  // 徵厲害 admin 新增類別
  insertCategory: (request, sql, res, infoData, fsFunc) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${infoData.category.toUpperCase()}`
    const table_category = `BF_JH_${infoData.category.toUpperCase()}_CATEGORY`
    const category_id = `${infoData.category.toUpperCase()}_ID`
    const category_name = `${infoData.category.toUpperCase()}_NAME`
    const category_des = `${infoData.category.toUpperCase()}_DES`

    if(infoData.synonym) infoData.cnName = infoData.synonym

    request.query(`select * 
    from ${table_category}
    where ${category_name} = '${infoData.cnName}'`, (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const infoCheck = result.recordset[0]
      if(infoCheck){
        return res.send({status: 'warning', message: '類別重複，請重新嘗試'})
      }else{
        axios.get('http://localhost:3030/train/jh/trainingData')
        .then(response => {
          return response.data
        })
        .then(data => {
          // const nluData = data.nlu.zh.rasa_nlu_data.common_examples
          // const targetCategory = nluData.filter(item => item.text == infoData.cnName)

          // if(targetCategory.length){
          //   request.input('targetName', sql.NVarChar(200), targetCategory[0].text)
          //   .input('targetEntity', sql.NVarChar(200), targetCategory[0].entities[0].entity)
          //   .query(`insert into ${table_category} (${category_name}, ENTITY_NAME) 
          //   values (@targetName, @targetEntity)`, (err, result) => {
          //     if(err){
          //       console.log(err)
          //       return
          //     }
          //   })
          //   return res.send({status: 'success', message: '新增類別成功'})
          // }

          request.input('cnName', sql.NVarChar(200), decodeURI(infoData.cnName))
          .input('entity_name', sql.NVarChar(200), infoData.entity_name)
        .query(`insert into ${table_category} (${category_name}, ENTITY_NAME) 
        values (@cnName, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          // 寫檔及寫入dict
            switch(infoData.category){
            case 'cpnyinfo':
                fsFunc.fsJhWriteInfo(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
            case 'position':
                fsFunc.fsJhWritePosition(infoData.cnName, infoData.entity_name, request)
                fsFunc.setPositionDict(infoData.cnName)
              break
            case 'subsidy':
                fsFunc.fsWriteSubsidy(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
            default:
                fsFunc.fsWriteLeave(infoData.cnName, infoData.entity_name, request)
                fsFunc.setInfoDict(infoData.cnName)
              break
          }
            if(infoData.synonym) return
          res.send({status: 'success', message: '新增類別成功'})
          })
        })
      }
    })
  },
  // 徵厲害 admin 刪除類別
  deleteCategory: (request, res, data, fsFunc) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${data.category.toUpperCase()}`
    const table_category = `BF_JH_${data.category.toUpperCase()}_CATEGORY`
    const category_id = `${data.category.toUpperCase()}_ID`
    const category_name = `${data.category.toUpperCase()}_NAME`
    const category_des = `${data.category.toUpperCase()}_DES`

    request.query(`select * 
    from ${table_category}
    where ${category_id} = ${data.infoId}`, (err, result) => {
      if(err){
        console.log(err)
        return
      }
      
      try {
        const infoCheck = result.recordset[0][`${category_name}`]
        request.query(`delete from ${table_category} 
        where ${category_id} = ${data.infoId}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

          let intent = ''
          // 寫檔及寫入dict
          switch(data.category){
            case 'cpnyinfo':
              intent = '問公司資訊'
              break
            case 'position':
              intent = '職缺'
              break
            case 'subsidy':
              intent = '問補助資訊'
              break
            default:
              intent = '問假別資訊'
              break
          }
          fsFunc.fsJhDeleteNlu(infoCheck, intent, request)
          res.send({status: 'success', message: '刪除類別成功'})
        })
      } catch (error) {
        return res.send({status: 'error', message: '查無此類別，請重新嘗試'})
      }
    })
  }
}