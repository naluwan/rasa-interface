const express = require('express')
const router = express.Router()
const axios = require('axios')
const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsSqlUpdate} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes, insertCategory, querySynonym, queryEditSynonym} = require('../../modules/useSql')
const {getSqlTrainingData} = require('../../modules/getTrainingData')

// 例句彈跳窗- 使用者添加例句
router.post('/userStep/nlu/addExamples', (req, res) => {
  const {textExamData} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID
  const textExamDataParse = JSON.parse(textExamData)

  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {

    const examIntent = textExamDataParse[0].intent.trim()
    data.rasa_nlu_data.common_examples = data.rasa_nlu_data.common_examples.filter(example => example.intent !== examIntent)
    return data
    
  })
  .then(data => {

    textExamDataParse.map(exam => {
      const newNlu = {
        text: exam.text.trim(),
        intent: exam.intent.trim(),
        entities: []
      }
  
      if(exam.entities.length){
        exam.entities.map(item => {
          const newEntity = {
            entity: item.entity,
            value: item.value,
            start: item.start,
            end: item.end
          }
          newNlu.entities.push(newEntity)
        })
      }
  
      data.rasa_nlu_data.common_examples.push(newNlu)
    })

    const filePath = '../public/trainData/nlu-json-test.json'
    const response = {status: 'success', message: 'nlu例句新增成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 刪除nlu例句 - 使用者步驟(點擊刪除按鈕時)
router.delete('/userStep/nlu/example', (req, res) => {
  const {intent, userSays} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取 nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {
    // 篩選出意圖和例句與欲刪除例句不同的資料
    data.rasa_nlu_data.common_examples = data.rasa_nlu_data.common_examples.filter(item => ((item.intent === intent && item.text !== userSays) || item.intent !== intent))

    // 使用模組回寫訓練檔及資料庫
    const filePath = '../public/trainData/nlu-json-test.json'
    const response = {status: 'success', message: '刪除nlu例句成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 例句彈跳窗 - 抓取相同意圖及關鍵字的所有例句
router.get('/userStep/nlu/getTextExams', (req, res) => {
  const {text, intent} = req.query
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {

    const allNlus = data.rasa_nlu_data.common_examples
    const targetExam = allNlus.filter(item => item.text == text && item.intent == intent)
    const targetEntities = targetExam[0].entities.map(item => {
      return item.entity
    })
    
    // 抓取意圖和關鍵字代號相同的例句
    const currentExams = allNlus.filter(item => {
      if(targetExam[0].intent == item.intent){
        const currentEntities = item.entities.map(itemEntity => itemEntity.entity)
        if(targetEntities.sort().equals(currentEntities.sort())){
          return item
        }
      }
    })

    res.send(currentExams)
  })
  .catch(err => console.log(err))
})

// 設定domain - 意圖和關鍵字
router.post('/userStep/domain', (req, res) => {
  const {userParse} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    const newEntities = []
    const newIntents = []

    // 判斷要添加的意圖是否已經在訓練檔資料中
    // 將不在資料庫的意圖放進newIntents陣列中
    if(data.intents.indexOf(userParse.text) == -1){
      newIntents.push(userParse.text)
    }

    // 判斷要添加的關鍵字是否已經在訓練檔資料中
    // 將不在資料庫的關鍵字放進newEntities陣列中
    userParse.entities.map(item => {
        if(data.entities.indexOf(item.entity) == -1){
          newEntities.push(item.entity)
        }
      })


    // 添加關鍵字
    if(newEntities.length){
      newEntities.map(entity => {
        data.entities.push(entity)
      })
    }

    // 添加意圖
    if(newIntents.length){
      newIntents.map(intent => {
        data.intents.push(intent)
      })
    }

    // 寫檔及更新資料庫訓練檔資料
    const filePath = '../public/trainData/domain-test.json'
    const response = {status: 'success', message: 'domain設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'domain-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 刪除故事流程 - 使用者步驟
router.delete('/userStep/fragments', (req, res) => {
  const {storyName, userSays, intent} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID
  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    data.stories.map(item => {
      if(!item.steps) return
      item.steps.map(step => {
        if(item.story == storyName){
          if(step.user){
            if(step.user == userSays && step.intent == intent){
              const index = item.steps.indexOf(step)
              item.steps.splice(index, 1)
            }
          }else{
            if(step.intent == intent){
              const index = item.steps.indexOf(step)
              item.steps.splice(index, 1)
            }
          }
        }
      })
    })
    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '刪除故事流程成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定nlu自然語言設定檔 - 使用者輸入的字句、意圖和關鍵字
router.post('/userStep/nlu', (req, res) => {
  const {userParse} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {

    // 驗證重複
    const repeat = []
    if(data.rasa_nlu_data.common_examples.length){
      data.rasa_nlu_data.common_examples.map(nlu => {
        if(userParse.text.trim() === nlu.text){
          repeat.push(nlu)
        }
      })
    }

    // 重複處理
    if(repeat.length){
      return res.send({status: "warning", message: "例句重複"})
    }

    // 新增的nlu格式
    const newNlu = {
      text: userParse.text.trim(),
      intent: userParse.text.trim(),
      entities: []
    }

    // 如果有entities的話執行這段，entities有可能不只一個，所以使用map來操作
    if(userParse.entities.length){
      userParse.entities.map(item => {
        const newEntity = {
          entity: item.entity,
          value: item.value,
          start: item.start,
          end: item.end
        }
        newNlu.entities.push(newEntity)
      })
    }

    data.rasa_nlu_data.common_examples.push(newNlu)

    const filePath = '../public/trainData/nlu-json-test.json'
    const response = {status: 'success', message: 'nlu設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定故事流程 - 使用者步驟
router.post('/userStep/fragments', (req, res) => {
  const {parse, storyName, indexNum} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    data.stories.map(item => {
      // 找到目標故事，並將步驟放進故事中
      if(item.story == storyName){
        // 步驟格式
        // 因為entities可能會有多筆，無法直接寫進去，所以先給[]
        if(!item.steps){
          item.steps = [
            {
              intent: parse.text.trim(),
              user: parse.text.trim(),
              entities: []
            }
          ]
        }else{
          const newStep = {
            intent: parse.text.trim(),
            user: parse.text.trim(),
            entities: []
          }

          // 在指定故事流程插入對話
          item.steps.splice(indexNum, 0, newStep)
        } 
        // 判斷是否有entities
        if(parse.entities.length){
          parse.entities.map(entityItem => {
            // 宣告entity object
            // object key值要使用變數要加上中括號[] 
            const newEntity = {[entityItem.entity]: entityItem.value}
            item.steps.map(step => {
              if(step.intent == parse.text.trim() && step.user == parse.text.trim()){
                step.entities.push(newEntity)
              }
            })
          })
        }
      }
    })

    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '故事流程設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 篩選故事流程並回傳故事
router.get('/filter', (req, res) => {
  const {storyFilter} = req.query
  const jh_simple_story = true
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  // 獲取正確故事
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    const stories = data.stories
    const storyData = stories.filter(item => item.story == storyFilter)
    return {storyData, stories}
  })
  .then(dataObj => {
    // 使用模組從資料庫抓取nlu訓練資料
    // 獲取故事中的關鍵字
    getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
    .then(data => {
      const allNlu = data.rasa_nlu_data.common_examples
      dataObj.storyData = dataObj.storyData.map(item => {
        item.steps.map(step => {
          if(!step.entities) return step
          if(!step.entities.length) return step
          allNlu.map(nlu => {
            if(nlu.text === step.user && nlu.intent === step.intent){
              step.entities = nlu.entities
              step.entities.map(entityItem => {
                entityItem.text = step.user.slice(entityItem.start, entityItem.end)
              })
            }
          })
        })
        return item
      })
      return dataObj
    })
    .then(dataObj => {
      // 使用模組從資料庫抓取domain訓練資料
      // 獲取故事中機器人的回覆
      getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
      .then(data => {
        dataObj.storyData = dataObj.storyData.map(item => {
          item.steps.map(step => {
            if(!step.action) return step
            step.response = data.responses[step.action].map(res => res.text)[0].trim()
            step.response = JSON.parse(JSON.stringify(step.response).replace(/  \\n/g, '\\r'))
          })
          return item
        })
        return dataObj
      })
      .then(dataObj => {
        // console.log(dataObj.storyData)
        res.render('index', {stories: dataObj.stories, jh_simple_story, storyData: dataObj.storyData})
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  })
  .catch(err => console.log(err))
})

// 顯示新增故事流程頁面
router.get('/new', (req, res) => {
  const jh_new_simple_story = true
  res.render('index', {jh_new_simple_story})
})

// 顯示故事流程首頁
router.get('/', (req, res) => {
  const jh_simple_story = true
  const cpnyId = res.locals.user.CPY_ID
  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    const stories = data.stories
    res.render('index', {stories, jh_simple_story})
  })
  .catch(err => console.log(err))
})

module.exports = router