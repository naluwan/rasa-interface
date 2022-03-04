module.exports = {
  insertDes: (request, sql, res, data, fsFunc) => {
    // 設定sql table、欄位名稱
    const table = `BF_JH_${data.category.toUpperCase()}`
    const table_category = `BF_JH_${data.category.toUpperCase()}_CATEGORY`
    const category_id = `${data.category.toUpperCase()}_ID`
    const category_name = `${data.category.toUpperCase()}_NAME`
    const category_des = `${data.category.toUpperCase()}_DES`

    // 驗證要新增的資訊類別是否存在
    request.query(`select ${category_id}
    from ${table_category}
    where ${category_name} = '${data.cnName}'`, (err, result) => {
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
        and CPY_ID = '${data.cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          
          const desCheck = result.recordset[0]
          if(desCheck){
            return  res.send({status: 'error', message: '已新增過此資訊，如要修改內容請使用編輯功能'})
          }else{
            request.input('cpnyId', sql.NVarChar(200), data.cpnyId)
            .input('info_id', sql.Int, idCheck)
            .input('des', sql.NVarChar(2000), decodeURI(data.des))
            .input('num', sql.NVarChar(200) , data.num)
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
        // 類別不存在時先新增類別
        request.input('cnName', sql.NVarChar(200), data.cnName)
        .input('entity_name', sql.NVarChar(200), data.entity_name)
        .query(`insert into ${table_category} (${category_name}, ENTITY_NAME) 
        values (@cnName, @entity_name)`, (err, result) => {
          if(err){
            console.log(err)
            return
          }

            // 寫檔及寫入dict
          switch(data.category.toUpperCase()){
            case 'CPNYINFO':
              fsFunc.fsJhWriteInfo(data.cnName, data.entity_name, request)
              fsFunc.setInfoDict(data.cnName)
              break
            case 'POSITION':
              fsFunc.fsJhWritePosition(data.cnName, data.entity_name, request)
              fsFunc.setPositionDict(data.cnName)
              break
            case 'SUBSIDY':
              fsFunc.fsWriteSubsidy(data.cnName, data.entity_name, request)
              fsFunc.setInfoDict(data.cnName)
              break
            default:
              fsFunc.fsWriteLeave(data.cnName, data.entity_name, request)
              fsFunc.setInfoDict(data.cnName)
              break
          }


          // 取得剛新增的類別id
          request.query(`select ${category_id} as id
          from ${table_category}
          where ${category_name} = '${data.cnName}'
          and ENTITY_NAME = '${data.entity_name}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }

            const des_id = result.recordset[0][`id`]

            request.input('cpnyId', sql.NVarChar(200), data.cpnyId)
            .input('des_id', sql.NVarChar(200), des_id)
            .input('des', sql.NVarChar(2000), decodeURI(data.des))
            .input('num', sql.NVarChar(200), data.num)
            .query(`insert into BF_JH_${data.category.toUpperCase()} (CPY_ID, ${category_id}, ${category_des}, INFO_ID) 
            values (@cpnyId, @des_id, @des, @num)`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              res.send({status: 'success', message: '新增資訊成功'})
            })
          })
        })
      }
    })
  },
  editDes: (request, sql, res, data) => {
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
        request.input('des', sql.NVarChar(2000), data.des)
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
  }
}