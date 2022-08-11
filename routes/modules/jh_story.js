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

// 複寫equals使其能夠比對array的內容
// Warn if overriding existing method
if(Array.prototype.equals) console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
// if the other array is a falsy value, return
  if(!array) return false;
  // compare lengths - can save a lot of time 
  if(this.length != array.length) return false;
  for(var i = 0, l = this.length; i < l; i++) {
    for(var j = 0, k = array.length; j < k; j++){
      // Check if we have nested arrays
      if(this[i] instanceof Array && array[i] instanceof Array) {
        // recurse into the nested arrays
        if(!this[i].equals(array[i])) return false;
      }else if(this[i] != array[i]) { 
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false;  
      }      
    }
  }    
  return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

// 刪除故事流程
router.delete('/fragments', (req, res) => {
  const request = new sql.Request(pool)
  const {storyName} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    data.stories = data.stories.filter(item => item.story !== storyName)

    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '刪除故事流程成功', data}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 抓取所有的response
router.get('/domain/getResponses', (req, res) => {
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取domain data
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    res.send(data.responses)
  })
  .catch(err => console.log(err))
})

// 設定domain - 更新domain機器人回覆
router.put('/botStep/domain', (req, res) => {
  const request = new sql.Request(pool)
  const {resCode, botReply} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 將回覆文字的換行符號(\n)改成符合rasa機器人回覆的換行符號(  \n)
  // rasa機器人回覆需要空兩格+\n，否則對話會分開，變成兩句話
  const botReplyText = JSON.parse(JSON.stringify(botReply).replace(/\\n/g, '  \\n'))

  // 使用模組從資料庫抓取domain data
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
      data.responses = {
        ...data.responses,
        [resCode]:[
          {
            text: botReplyText
          }
        ]
      }

    const filePath = '../public/trainData/domain-test.json'
    const response = {status: 'success', message: '更新domain機器人回覆成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'domain-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定domain - 刪除機器人回覆action及response
router.delete('/botStep/domain', (req, res) => {
  const request = new sql.Request(pool)
  const {resCode} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取domain data
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    // 將註冊的機器人action刪除
    data.actions = data.actions.filter(action => action !== resCode)
    // 刪除responses中的回覆
    // 由於responses是物件，可以使用delete object.attribute(object[attribute])
    // 這邊由於屬性是使用變數帶入，所以使用object[attribute]
    delete data.responses[resCode]

    const filePath = '../public/trainData/domain-test.json'
    const response = {status: 'success', message: 'domain新增機器人回覆成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'domain-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定故事流程 - 刪除機器人步驟
router.delete('/botStep/fragments', (req, res) => {
  const request = new sql.Request(pool)
  const {storyName, resCode} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    // 找到特定故事並刪除故事流程的機器人回覆
    data.stories.map(item => {
      if(item.story === storyName){
        item.steps.map(step => {
          if(step.action){
            if(step.action === resCode){
              const index = item.steps.indexOf(step)
              item.steps.splice(index, 1)
            }
          }
        })
      }
    })

    // 使用模組將data 寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '新增故事流程成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定domain - 新增機器人回覆action及response
router.post('/botStep/domain', (req, res) => {
  const request = new sql.Request(pool)
  const {resCode, botReply} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 將回覆文字的換行符號(\n)改成符合rasa機器人回覆的換行符號(  \n)
  // rasa機器人回覆需要空兩格+\n，否則對話會分開，變成兩句話
  const botReplyText = JSON.parse(JSON.stringify(botReply).replace(/\\n/g, '  \\n'))

  // 使用模組從資料庫抓取domain data
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    data.actions.push(resCode)
    data.responses = {
      ...data.responses,
      [resCode]: [
        {
        "text": botReplyText
        }
      ]
    }
    const filePath = '../public/trainData/domain-test.json'
    const response = {status: 'success', message: 'domain新增機器人回覆成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'domain-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 設定故事流程 - 機器人步驟
router.post('/botStep/fragments', (req, res) => {
  const request = new sql.Request(pool)
  const {storyName, indexNum, resCode} = req.body
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    // 新增機器人回覆
    const newBotReply = {
      action: resCode
    }

    // 找到特定故事並在指定位置新增機器人回覆
    data.stories = data.stories.map(item => {
      if(item.story === storyName){
        if(!item.steps) item.steps = []
        item.steps.splice(indexNum, 0, newBotReply)
      }
      return item
    })
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '新增故事流程成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 更新使用者步驟故事流程
router.put('/userStep/fragments', (req, res) => {
  const request = new sql.Request(pool)
  let {tempNlu} = req.body
  const {storyName, indexNum} = req.body
  tempNlu = JSON.parse(tempNlu)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    const newEntities = tempNlu.entities.map(item => {
      if(item.value){
        return {
          [item.entity]: item.value
        }
      }
    })

    data.stories = data.stories.map(item => {
      if(item.story == storyName){
        item.steps[indexNum].intent = tempNlu.intent
        item.steps[indexNum].entities = newEntities
      }
      return item
    })

    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '更新故事流程成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})


// 更新使用者步驟domain的意圖和關鍵字
router.put('/userStep/domain', (req, res) => {
  const request = new sql.Request(pool)
  let {tempNlu} = req.body
  const cpnyId = res.locals.user.CPY_ID
  tempNlu = JSON.parse(tempNlu)

  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    // 判斷意圖是否重複
    const checkIntent = data.intents.filter(intent => intent == tempNlu.intent)

    // 如果沒有重複就將意圖加進domain intents中
    if(!checkIntent.length){
      data.intents.push(tempNlu.intent)
    }

    //  篩選出新關鍵字與domain訓練檔中重複的關鍵字
    const checkEntity = data.entities.filter(entity => {
      for(i = 0; i < tempNlu.entities.length; i++){
        if(tempNlu.entities[i].entity == entity){
          return entity
        }
      }
    })

    // 宣告新關鍵字集合
    let newEntities = new Set()

    // 將新關鍵字加入集合中(去除重複)
    tempNlu.entities.forEach(item => newEntities.add(item.entity))
    
    // 將集合轉成陣列
    newEntities = [...newEntities]

    // 使用雙迴圈，將新關鍵字和重複關鍵字比對
    // 將重複的關鍵字從新關鍵字陣列中移除
    // 最後剩下的就是新關鍵字
    for(i = 0; i < checkEntity.length; i++){
      for(j = 0; j < newEntities.length; j++){
        if(checkEntity[i] == newEntities[j]){
          newEntities.splice(j, 1)
        }
      }
    }
    
    // 宣告集合
    let checkRepeat = new Set()
    // 將新關鍵字的值加進集合中
    for(i = 0; i < newEntities.length; i++){
      checkRepeat.add(newEntities[i])
    }
    // 將集合轉成陣列
    checkRepeat = [...checkRepeat]

    // 將新關鍵字加入domain中
    for(i = 0; i < checkRepeat.length; i++){
      data.entities.push(checkRepeat[i])
    }

    const filePath = '../public/trainData/domain-test.json'
    const response = {status: 'success', message: 'domain更新成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'domain-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 更新使用者步驟nlu例句的意圖和關鍵字
router.put('/userStep/nlu', (req, res) => {
  const request = new sql.Request(pool)
  let {tempNlu} = req.body
  const cpnyId = res.locals.user.CPY_ID
  tempNlu = JSON.parse(tempNlu)

  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {
    // 先篩選出不是新增例句的例句
    data.rasa_nlu_data.common_examples = data.rasa_nlu_data.common_examples.filter(nlu => {
      if(nlu.text != tempNlu.text){
        return nlu
      }
    })

    // 將新例句新增進nlu
    data.rasa_nlu_data.common_examples.push(tempNlu)

    const filePath = '../public/trainData/nlu-json-test.json'
    const response = {status: 'success', message: 'nlu更新成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 抓取所有意圖
router.get('/userStep/domain/getAllIntents', (req, res) => {
  const cpnyId = res.locals.user.CPY_ID
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain', cpnyId)
  .then(data => {
    res.send(data.intents)
  })
  .catch(err => console.log(err))
})

// 抓取目標例句
router.get('/userStep/nlu/setEntity/getTextExam', (req, res) => {
  const {examText} = req.query
  const cpnyId = res.locals.user.CPY_ID
  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {
    const allNlus = data.rasa_nlu_data.common_examples
    const targetNlu = allNlus.filter(item => item.text == examText)
    res.send(targetNlu)
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
    console.log(targetExam)
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

// 例句彈跳窗- 使用者添加例句
router.post('/userStep/nlu/addExamples', (req, res) => {
  const {textExamData} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID
  const textExamDataParse = JSON.parse(textExamData)

  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {
    textExamDataParse.map(exam => {
      // 將暫存例句陣列中已經添加過的例句篩選掉
      const checkText = data.rasa_nlu_data.common_examples.some(example => exam.text === example.text)
      const checkIntent = data.rasa_nlu_data.common_examples.some(example => exam.intent === example.intent)
      if( checkText && checkIntent) return
        const newNlu = {
          text: exam.text,
          intent: exam.intent,
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
    if(data.intents.indexOf(userParse.intent.name) == -1){
      newIntents.push(userParse.intent.name)
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

router.get('/userStep/nlu/checkRepeat', (req, res) => {
  const {userInput} = req.query
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu', cpnyId)
  .then(data => {
    // 驗證重複
    const repeat = []
    if(data.rasa_nlu_data.common_examples.length){
      data.rasa_nlu_data.common_examples.map(nlu => {
        if(userInput === nlu.text){
          repeat.push(nlu)
        }
      })
    }

    // 重複處理
    if(repeat.length){
      return res.send({status: "warning", message: "例句重複"})
    }

    res.send({status: 'success', message: '無重複例句'})
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
        if(userParse.text === nlu.text){
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
      text: userParse.text,
      intent: userParse.intent.name,
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
              intent: parse.intent.name,
              user: parse.text,
              entities: []
            }
          ]
        }else{
          const newStep = {
            intent: parse.intent.name,
            user: parse.text,
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
              if(step.intent == parse.intent.name && step.user == parse.text){
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

// 設定故事流程 - 使用者步驟 - 使用者僅添加意圖
router.post('/userStep/fragments/onlyIntent', (req, res) => {
  const {intent, storyName, indexNum} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  if(!intent) return res.send({status: 'warning', message: '意圖不可為空白'})

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    // 比對故事名稱並將使用者步驟放進指定故事名稱內
    data.stories.map(item => {
      if(item.story == storyName){
        if(!item.steps){
          item.steps = [
            {
              intent,
              entities: []
            }
          ]
        }else{
          const newStep = {
            intent,
            entities: []
          }

          // 在指定故事流程插入對話
          item.steps.splice(indexNum, 0, newStep)
        }
      }
    })

    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '意圖設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})


// 修改故事流程名稱
router.put('/storyTitle', (req, res) => {
  const {originalTitle, updateTitle} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {

    let status = true
    const repeatName = []

    // 驗證要改的名稱是否重複
    data.stories.map(item => {
      if(item.story == updateTitle){
        repeatName.push(item)
      }
    })

    if(repeatName.length) status = false

    const dataObj = {data, status}

    return dataObj
  })
  .then(dataObj => {
    if(dataObj.status){
      // 找出原始的名稱並修改成新的名稱
      dataObj.data.stories.map(item => {
        if(item.story == originalTitle){
          item.story = updateTitle
        }
      })

      // 使用模組寫檔並更新資料庫
      const filePath = '../public/trainData/fragments-test.json'
      fsSqlUpdate(filePath, dataObj.data, 'BF_JH_DATA_TEST', 'fragments-test', {updateTitle}, request, res, cpnyId)
    }else{
      res.send({status: 'warning', message: '修改的名稱重複'})
    }
  })
  .catch(err => console.log(err))
})

// 設定故事流程名稱
router.post('/storyTitle', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3030');
  const {storyTitle} = req.body
  const request = new sql.Request(pool)
  const cpnyId = res.locals.user.CPY_ID

  if(storyTitle == '未命名故事' || !storyTitle) return res.send({status: 'warning', message: '請設定故事名稱'})

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {

    // 驗證故事名稱是否重複
    if(data.stories.length){
      const checkStoryTitle = data.stories.filter(item => item.story === storyTitle)
      if(checkStoryTitle.length) return res.send({status: 'warning', message: '故事名稱重複'})
    }
    const newStory = {story: storyTitle, steps:[]}
    data.stories.push(newStory)
    
    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '意圖設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res, cpnyId)
  })
  .catch(err => console.log(err))
})

// 意圖及關鍵字判斷
router.get('/parse', (req, res) => {
  const {userInput} = req.query
  axios.post('http://192.168.10.105:5005/model/parse', {
    text: userInput,
    lang: 'zh'
  })
  .then(response => {
    return response.data
  })
  .then(data => {
    res.send(data)
  })
  .catch(err => console.log(err))
})

// 顯示新增故事流程頁面
router.get('/new', (req, res) => {
  const jh_new_story = true
  res.render('index', {jh_new_story})
})

// 篩選故事流程並回傳故事
router.get('/filter', (req, res) => {
  const {storyFilter} = req.query
  const jh_story = true
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
        console.log(dataObj.storyData)
        res.render('index', {stories: dataObj.stories, jh_story, storyData: dataObj.storyData})
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  })
  .catch(err => console.log(err))
})

// 顯示故事流程首頁
router.get('/', (req, res) => {
  const jh_story = true
  const cpnyId = res.locals.user.CPY_ID
  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments', cpnyId)
  .then(data => {
    const stories = data.stories
    res.render('index', {stories, jh_story})
  })
  .catch(err => console.log(err))
})

module.exports = router