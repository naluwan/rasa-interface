const yaml = require('js-yaml')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const sql = require('mssql')
const pool = require('../config/connectPool')

module.exports = {
  getTrainingData: (table, cpnyId) => {
    // 用Promise控制流程
    return new Promise(function(resolve, reject){
      const request = new sql.Request(pool)
      // 會先從資料庫抓取4個訓練檔：config, domain, fragments(stories), nlu
      request.query(`select DATA_CONTENT as config
      from ${table}
      where DATA_NAME = 'config-test' and
      CPNY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const config = result.recordset[0]['config']
        
        request.query(`select DATA_CONTENT as domain
        from ${table}
        where DATA_NAME = 'domain-test' and
        CPNY_ID = '${cpnyId}'` , (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const domain = result.recordset[0]['domain']

          request.query(`select DATA_CONTENT as fragments
          from ${table}
          where DATA_NAME = 'fragments-test' and
          CPNY_ID = '${cpnyId}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const fragments = result.recordset[0]['fragments']

            request.query(`select DATA_CONTENT as nlu
            from ${table}
            where DATA_NAME = 'nlu-json-test' and
            CPNY_ID = '${cpnyId}'`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              const nluJson = result.recordset[0]['nlu']
              // console.log(result)
              // 將從資料庫抓取回來的資料寫成檔案
              try{
                fs.writeFileSync(path.resolve(__dirname, '../public/trainData/config.yml'), config)
                fs.writeFileSync(path.resolve(__dirname, '../public/trainData/domain.yml'), domain)
                fs.writeFileSync(path.resolve(__dirname, '../public/trainData/fragments.yml'), fragments)
                fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), nluJson)
              } catch(err){
                console.log(err)
              }

              try {
                // 將4個訓練檔的資料讀出來並轉換成正確格式組成json發送出去
                const nluData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
                const configData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/config.yml'), "utf8"))
                const domainData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/domain.yml'), 'utf8'))
                const fragmentsData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/fragments.yml'), 'utf8'))

                // 轉換格式
                const domainYml = yaml.dump(domainData)
                const configYml = yaml.dump(configData)
                const fragmentsYml = yaml.dump(fragmentsData)
                // const nluYml = yaml.dump(nluData)

                let model = ''
                if(table == 'BF_JH_TRAINING_DATA'){
                  model = 'model-johnnyHire'
                }else{
                  model = 'model-customerService'
                }
                let data = {
                  'config': configYml,
                  'nlu': {nluData},
                  'domain': domainYml,
                  'stories': fragmentsYml,
                  "fixed_model_name": model
                }
                console.log(data)
                resolve(data)
              } catch (error) {
                console.log(error)
                return reject({status: 'error', message: '資料格式錯誤，請重新嘗試'})
              }
            })
          })
        })
      })
    })
  },

  getSqlTrainingData: (table, columnName, dataName, cpnyId) => {
    if(!table || !columnName || !dataName || !cpnyId ){
      console.log('抓取資料庫模組參數不齊全')
    }
    // 用Promise控制流程
    return new Promise(function(resolve, reject){
      const path = require('path')
      const fs = require('fs')
      const request = new sql.Request(pool)
      // 從資料庫抓取訓練檔
      request.query(`select DATA_CONTENT as ${dataName}
      from ${table}
      where DATA_NAME = '${columnName}' and
      CPNY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        try{
          const data = JSON.parse(result.recordset[0][dataName])
          resolve(data)
        } catch(err){
          let data = {}
          switch (dataName) {
            case 'domain':
              data = {
                actions: [],
                entities: [],
                forms: {},
                intents: [],
                responses: {},
                session_config: {
                  session_expiration_time:60,
                  carry_over_slots_to_new_session:true
                },
                slots: {}
              }
              request.input('cpnyId', sql.NVarChar(30), cpnyId)
              .input('data_name', sql.NVarChar(50), 'domain-test')
              .input('data_content', sql.NVarChar(sql.MAX), JSON.stringify(data))
              .query(`insert into BF_JH_DATA_TEST(CPNY_ID, DATA_NAME, DATA_CONTENT)
              values (@cpnyId, @data_name, @data_content)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
              })
              break;
            case 'nlu':
              data =  {
                rasa_nlu_data: {
                    common_examples:[]
                }
            }
              request.input('cpnyId', sql.NVarChar(30), cpnyId)
              .input('data_name', sql.NVarChar(50), 'nlu-json-test')
              .input('data_content', sql.NVarChar(sql.MAX), JSON.stringify(data))
              .query(`insert into BF_JH_DATA_TEST(CPNY_ID, DATA_NAME, DATA_CONTENT)
              values (@cpnyId, @data_name, @data_content)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
              })
              break;
            case 'fragments':
              data = {
                stories: []
              }
              request.input('cpnyId', sql.NVarChar(30), cpnyId)
              .input('data_name', sql.NVarChar(50), 'fragments-test')
              .input('data_content', sql.NVarChar(sql.MAX), JSON.stringify(data))
              .query(`insert into BF_JH_DATA_TEST(CPNY_ID, DATA_NAME, DATA_CONTENT)
              values (@cpnyId, @data_name, @data_content)`, (err, result) => {
                if(err){
                  console.log(err)
                  return
                }
              })
            default:
              break;
          }
          resolve(data)
        }
      })
    })
  }
}