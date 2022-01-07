const express = require('express')
const router = express.Router()
const yaml = require('js-yaml')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const sql = require('mssql')
const pool = require('../../config/connectPool')

// 點擊按鈕，呼叫訓練router，提示訓練中
router.get('/', (req, res) => {
  // 載入training data
  const nluData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/nlu-json.json'), 'utf8'))
  const configData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/config.yml'), "utf8"))
  const domainData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/domain.yml'), 'utf8'))
  const fragmentsData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/fragments.yml'), 'utf8'))

  // 轉換格式
  let nlu = yaml.dump(nluData)
  let domain = yaml.dump(domainData)
  let config = yaml.dump(configData)
  let fragments = yaml.dump(fragmentsData)
  const zh = nluData

  // newContent = {
  //   "text": "我想知道中鋼的現價",
  //   "intent": "問股票",
  //   "entities": [
  //     { "entity": "company", "value": "中鋼", "start": 4, "end": 6 },
  //     { "entity": "stock", "value": "現價", "start": 7, "end": 9 }
  //   ],
  //   "metadata": { "language": "zh", "canonical": true }
  // }

  // const arrayText = []
  // zh.rasa_nlu_data.common_examples.forEach(item => {
  //   arrayText.push(item.text)
  // })
  // console.log(arrayText)
  // const index = arrayText.indexOf(newContent.text)
  // console.log(index)
  // zh.rasa_nlu_data.common_examples.splice(index,1)
  // console.log(zh.rasa_nlu_data.common_examples)

  // const repeatText = zh.rasa_nlu_data.common_examples.filter(item => item.text == newContent.text)
  
  // if(repeatText.length){
  //   console.log(repeatText)
  //   console.log('資料重複')
  // }else{
  //   zh.rasa_nlu_data.common_examples.push(newContent)
  //   console.log(zh.rasa_nlu_data.common_examples)
    // try{
    //   fs.writeFileSync('C:/Users/AN1100275/Desktop/training-data/data/nlu-json-1.json', JSON.stringify(zh))
    // } catch(err){
    //   console.log(err)
    // }
  //   console.log('新增資料')
  // }
  
  let data = {
    'config': {config},
    'nlu': {zh},
    'domain': domain,
    'fragments': fragments,
    'fixed_model_name': 'model-97090920',
    'load_model_after': true
  }
  // console.log(data)
  return res.json(data)
})

router.get('/trainingData', (req, res) =>{
  const request = new sql.Request(pool)

  request.query(`select DATA_CONTENT as config
  from BF_CS_TRAINING_DATA
  where DATA_NAME = 'config'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const config = result.recordset[0]['config']
    
    request.query(`select DATA_CONTENT as domain
    from BF_CS_TRAINING_DATA
    where DATA_NAME = 'domain'` , (err, result) => {
      if(err){
        console.log(err)
        return
      }
      const domain = result.recordset[0]['domain']

      request.query(`select DATA_CONTENT as fragments
      from BF_CS_TRAINING_DATA
      where DATA_NAME = 'fragments'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const fragments = result.recordset[0]['fragments']

        request.query(`select DATA_CONTENT as nlu
        from BF_CS_TRAINING_DATA
        where DATA_NAME = 'nlu-json'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const nluJson = result.recordset[0]['nlu']
          // console.log(result)
          try{
            fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/config.yml'), config)
            fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/domain.yml'), domain)
            fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/fragments.yml'), fragments)
            fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/nlu-json.json'), nluJson)
          } catch(err){
            console.log(err)
          }
          
          const nluData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/nlu-json.json'), 'utf8'))
          const configData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/config.yml'), "utf8"))
          const domainData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/domain.yml'), 'utf8'))
          const fragmentsData = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/fragments.yml'), 'utf8'))

          // 轉換格式
          const domainYml = yaml.dump(domainData)
          const configYml = yaml.dump(configData)
          const fragmentsYml = yaml.dump(fragmentsData)
          const zh = nluData
          // console.log(zh)
          let data = {
            'config': {configYml},
            'nlu': {zh},
            'domain': domainYml,
            'fragments': fragmentsYml,
            'fixed_model_name': 'model-97090920',
            'load_model_after': true
          }
          // console.log(data)
          return res.json(data)
        })
      })
    })
  })
})

// // 載入training data，向rasa發送訓練資料
// router.get('/sendData', (req, res, next) => {
//   const user = res.locals.user
//   const isAuthenticated = res.locals.isAuthenticated
//   // 載入training data
//   const nluData = yaml.load(fs.readFileSync('C:/Users/AN1100275/Desktop/training-data/data/nlu-json.json', 'utf8'))
//   const configData = yaml.load(fs.readFileSync('C:/Users/AN1100275/Desktop/training-data/config.yml', "utf8"))
//   const domainData = yaml.load(fs.readFileSync('C:/Users/AN1100275/Desktop/training-data/domain.yml', 'utf8'))
//   const fragmentsData = yaml.load(fs.readFileSync('C:/Users/AN1100275/Desktop/training-data/data/stories/fragments.yml', 'utf8'))

//   // 轉換格式
//   let nlu = yaml.dump(nluData)
//   let domain = yaml.dump(domainData)
//   let config = yaml.dump(configData)
//   let fragments = yaml.dump(fragmentsData)
//   const zh = nluData

//   // request body
//   let data = {
//     'config': {config},
//     'nlu': {zh},
//     'domain': domain,
//     'fragments': fragments,
//     'fixed_model_name': 'model-97090920',
//     'load_model_after': true
//   }

//   // 發送請求
//   axios({
//     method: 'post',
//     url: 'http://192.168.10.108:5005/model/train',
//     json: true,
//     headers: {
//       "content-type": "application/json",
//     },
//     data: data,
//     params: {
//       save_to_default_model_directory: true,
//       force_training: false,
//     }
//   }).then((response) => {
//     console.log('訓練完成')
//     req.flash('success_msg', '訓練完成')
//     return res.redirect('/')
//   })
//   .catch((err) => console.log('sendData錯誤： ' + err))
//   res.send('傳送資料')
// })

// router.post('/complete', (req, res) => {
//   console.log('訓練完成')
//   req.flash('success_mg', '訓練完成!!')
//   console.log(req.session)
//   return res.redirect('/')
// })

// router.get('/time', (req, res, next) => {
//   console.log('訓練中.......')
//   req.flash('warning_msg', '訓練中.......')
//   res.redirect('/')
// })

module.exports = router
