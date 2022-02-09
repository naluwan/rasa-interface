const express = require('express')
const router = express.Router()
const yaml = require('js-yaml')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const sql = require('mssql')
const pool = require('../../config/connectPool')
const {getTrainingData} = require('../../modules/getTrainingData')

// 舊版抓取training data
// router.get('/', (req, res) => {
//   // 載入training data
//   const nluData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/nlu-json.json'), 'utf8'))
//   const configData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/config.yml'), "utf8"))
//   const domainData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/domain.yml'), 'utf8'))
//   const fragmentsData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/fragments.yml'), 'utf8'))

//   // 轉換格式
//   let nlu = yaml.dump(nluData)
//   let domain = yaml.dump(domainData)
//   let config = yaml.dump(configData)
//   let fragments = yaml.dump(fragmentsData)
//   const zh = nluData
  
//   let data = {
//     'config': {config},
//     'nlu': {zh},
//     'domain': domain,
//     'fragments': fragments,
//     'fixed_model_name': 'model-97090920',
//     'load_model_after': true
//   }
//   // console.log(data)
//   return res.json(data)
// })

// 新版抓取cs training data
router.get('/cs/trainingData', (req, res) =>{
  getTrainingData('BF_CS_TRAINING_DATA')
  .then(data => {
    return res.json(data)
  })
  .catch(err => console.log(err))
})

router.get('/jh/trainingData', (req, res) => {
  getTrainingData('BF_JH_TRAINING_DATA')
  .then(data => {
    return res.json(data)
  })
  .catch(err => console.log(err))
})

// 訓練完成
router.get('/trainingComplete', (req, res) => {
  // console.log(`開始更改新增資料狀態`)
  const request = new sql.Request(pool)

  const trainArray = []

  request.query(`select * 
  from BF_CS_QUESTION
  where TRAINED = 0`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const notTrainQuestion = result.recordset
    // console.log(`not train question：` + notTrainQuestion)
    if(notTrainQuestion.length){
      notTrainQuestion.forEach(question => {
        request.query(`update BF_CS_QUESTION
        set TRAINED = 1
        where QUESTION_ID = ${question.QUESTION_ID}
        and FUNCTION_ID = ${question.FUNCTION_ID}`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
        })
      })
      trainArray.push({question: '問答資訊訓練完成!'})
    }else{
      trainArray.push({question: '沒有新增問答資訊!'})
    }

    request.query(`select *
    from BF_CS_FUNCTION
    where TRAINED = 0` , (err, result) => {
      if(err){
        console.log(err)
        return
      }

      const notTrainFunction = result.recordset
      // console.log(`not train function：` + notTrainQuestion)
      if(notTrainFunction.length){
        notTrainFunction.forEach(functions => {
          request.query(`update BF_CS_FUNCTION
          set TRAINED = 1
          where FUNCTION_ID = ${functions.FUNCTION_ID}
          and CATEGORY_ID = ${functions.CATEGORY_ID}`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
          })
        })
        trainArray.push({functions: '功能訓練完成!'})
      }else{
        trainArray.push({functions: '沒有新增功能!'})
      }
      return res.send(trainArray)
    })
  })
})

module.exports = router
