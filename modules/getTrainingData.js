const yaml = require('js-yaml')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const sql = require('mssql')
const pool = require('../config/connectPool')

module.exports = {
  getTrainingData: (table, res) => {
    // 用Promise控制流程
    return new Promise(function(resolve, reject){
      const request = new sql.Request(pool)
      // 會先從資料庫抓取4個訓練檔：config, domain, fragments(stories), nlu
      request.query(`select DATA_CONTENT as config
      from ${table}
      where DATA_NAME = 'config'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const config = result.recordset[0]['config']
        
        request.query(`select DATA_CONTENT as domain
        from ${table}
        where DATA_NAME = 'domain'` , (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const domain = result.recordset[0]['domain']

          request.query(`select DATA_CONTENT as fragments
          from ${table}
          where DATA_NAME = 'fragments'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const fragments = result.recordset[0]['fragments']

            request.query(`select DATA_CONTENT as nlu
            from ${table}
            where DATA_NAME = 'nlu-json'`, (err, result) => {
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
                const zh = nluData
                let model = ''

                if(table == 'BF_JH_TRAINING_DATA'){
                  model = 'model-johnnyHire'
                }else{
                  model = 'model-customerService'
                }
                let data = {
                  'config': {configYml},
                  'nlu': {zh},
                  'domain': domainYml,
                  'fragments': fragmentsYml,
                  'fixed_model_name': model,
                  'load_model_after': true
                }

                resolve(data)
              } catch (error) {
                return reject({status: 'error', message: '資料格式錯誤，請重新嘗試'})
              }
            })
          })
        })
      })
    })
  },
  }
}