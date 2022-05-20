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

// 抓取所有意圖
router.get('/userStep/nlu/getIntent', (req, res) => {
  getSqlTrainingData('BF_JH_DATA_TEST', 'domain-test', 'domain')
  .then(data => {
    res.send(data.intents)
  })
  .catch(err => console.log(err))
})

router.get('/userStep/nlu/setEntity/getTextExam', (req, res) => {
  const {examText} = req.query

  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu')
  .then(data => {
    const allNlus = data.rasa_nlu_data.common_examples
    const targetNlu = allNlus.filter(item => item.text == examText)
    res.send(targetNlu)
  })
  .catch(err => console.log(err))
})

// 抓取相同意圖及關鍵字的所有例句
router.get('/userStep/nlu/getTextExams', (req, res) => {
  const {text, intent} = req.query

  // 使用模組從資料庫抓取nlu data
  getSqlTrainingData('BF_JH_DATA_TEST', 'nlu-json-test', 'nlu')
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

// 刪除故事流程 - 使用者步驟
router.get('/userStep/remove', (req, res) => {
  const {storyName, userSays, intent} = req.query
  const request = new sql.Request(pool)

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
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
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res)
  })
  .catch(err => console.log(err))
})

// 設定domain - 意圖和關鍵字
router.get('/userStep/domain/insert', (req, res) => {
  const {parse} = req.query
  const request = new sql.Request(pool)
  const parseData = JSON.parse(parse)

  // 從資料庫抓取domain訓練檔資料
  request.query(`select DATA_CONTENT as domain
  from BF_JH_DATA_TEST
  where DATA_NAME = 'domain-test'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    try{
      // 將資料轉成json格式
      const domainData = JSON.parse(result.recordset[0]['domain'])
      const newEntities = []
      const newIntents = []

      // 判斷要添加的意圖是否已經在訓練檔資料中
      // 將不在資料庫的意圖放進newIntents陣列中
      if(domainData.intents.indexOf(parseData.intent.name) == -1){
        newIntents.push(parseData.intent.name)
      }

      // 判斷要添加的關鍵字是否已經在訓練檔資料中
      // 將不在資料庫的關鍵字放進newEntities陣列中
        parseData.entities.map(item => {
          if(domainData.entities.indexOf(item.entity) == -1){
            newEntities.push(item.entity)
          }
        })


      // 添加關鍵字
      if(newEntities.length){
        newEntities.map(entity => {
          domainData.entities.push(entity)
        })
      }

      // 添加意圖
      if(newIntents.length){
        newIntents.map(intent => {
          domainData.intents.push(intent)
        })
      }

      // 寫檔及更新資料庫訓練檔資料
      const filePath = '../public/trainData/domain-test.json'
      const response = {status: 'success', message: 'domain設定成功'}
      fsSqlUpdate(filePath, domainData, 'BF_JH_DATA_TEST', 'domain-test', response, request, res)

    } catch(err){
      // domain訓練檔格式
      const domain = {
        actions: [],
        entities: [],
        forms: {},
        intents: [],
        responses: {},
        session_config: {},
        slots: {}
      }

      // 添加意圖
      if(parseData.intent.name){
        domain.intents.push(parseData.intent.name)
      }

      // 添加關鍵字
      if(parseData.entities.length){
        parseData.entities.map(item => {
          domain.entities.push(item.entity)
        })
      }

      // 寫檔及更新資料庫訓練檔資料
      const filePath = '../public/trainData/domain-test.json'
      const response = {status: 'success', message: 'domain設定成功'}
      fsSqlUpdate(filePath, domain, 'BF_JH_DATA_TEST', 'domain-test', response, request, res)
    }
  })
})

// 設定nlu自然語言設定檔 - 使用者輸入的字句、意圖和關鍵字
router.get('/userStep/nlu/insert', (req, res) => {
  const {parse} = req.query
  const request = new sql.Request(pool)
  const parseData = JSON.parse(parse)

  // 從資料庫獲取nlu設定檔資料
  request.query(`select DATA_CONTENT as nlu
  from BF_JH_DATA_TEST
  where DATA_NAME = 'nlu-json-test'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    try{
      // 如果資料庫已經有訓練檔資料
      const nluData = JSON.parse(result.recordset[0]['nlu'])
      const repeat = []

      // 比對是否有重複的字句
      nluData.rasa_nlu_data.common_examples.map(nlu => {
        if(parseData.text == nlu.text && parseData.intent.name == nlu.intent){
          repeat.push(nlu)
        }
      })
    
      if(repeat.length) return

      // 新增的nlu格式
      const newNlu = {
        text: parseData.text,
        intent: parseData.intent.name,
        entities: [],
        metadata: {
          language: "zh"
        }
      }

      // 如果有entities的話執行這段，entities有可能不只一個，所以使用map來操作
      if(parseData.entities.length){
        parseData.entities.map(item => {
          const newEntity = {
            entity: item.entity,
            value: item.value,
            start: item.start,
            end: item.end
          }
          newNlu.entities.push(newEntity)
        })
      }

      nluData.rasa_nlu_data.common_examples.push(newNlu)

      // 寫檔及更新資料庫訓練檔資料
      const filePath = '../public/trainData/nlu-json-test.json'
      const response = {status: 'success', message: 'nlu設定成功'}
      fsSqlUpdate(filePath, nluData, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res)

    } catch(err){
      // 如果資料庫沒有訓練檔資料

      // 新增的nlu格式
      const newNlu = {
        text: parseData.text,
        intent: parseData.intent.name,
        entities: [],
        metadata: {
          language: "zh"
        }
      }

      // 如果有entities的話執行這段，entities有可能不只一個，所以使用map來操作
      if(parseData.entities.length){
        parseData.entities.map(item => {
          const newEntity = {
            entity: item.entity,
            value: item.value,
            start: item.start,
            end: item.end
          }
          newNlu.entities.push(newEntity)
        })
      }

      // 訓練檔格式
      const nlu = {
        rasa_nlu_data: {
          common_examples: [],
          entity_synonyms: [],
          gazette: [],
          regex_features: []
        }
      }

      nlu.rasa_nlu_data.common_examples.push(newNlu)

      // 寫檔及更新資料庫訓練檔資料
      const filePath = '../public/trainData/nlu-json-test.json'
      const response = {status: 'success', message: 'nlu設定成功'}
      fsSqlUpdate(filePath, nlu, 'BF_JH_DATA_TEST', 'nlu-json-test', response, request, res)
    }
  })
})

// 設定故事流程 - 使用者步驟
router.get('/userStep/fragments/insert', (req, res) => {
  const {parse, storyName, indexNum} = req.query
  const request = new sql.Request(pool)
  const parseData = JSON.parse(parse)

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
  .then(data => {
    data.stories.map(item => {
      // 找到目標故事，並將步驟放進故事中
      if(item.story == storyName){
        // 步驟格式
        // 因為entities可能會有多筆，無法直接寫進去，所以先給[]
        if(!item.steps){
          item.steps = [
            {
              intent: parseData.intent.name,
              user: parseData.text,
              entities: []
            }
          ]
        }else{
          const newStep = {
            intent: parseData.intent.name,
            user: parseData.text,
            entities: []
          }

          // 判別steps裡是否有資料
          if(!item.steps.length){
            item.steps.push(newStep)
          }else{
            item.steps.splice(indexNum, 0, newStep)
          }
        } 
        // 判斷是否有entities
        if(parseData.entities.length){
          parseData.entities.map(entityItem => {
            // 宣告entity object
            // object key值要使用變數要加上中括號[] 
            const newEntity = {[entityItem.entity]: entityItem.value}
            item.steps.map(step => {
              if(step.intent == parseData.intent.name && step.user == parseData.text){
                step.entities.push(newEntity)
              }
            })
          })
        }
      }
    })

    // data.stories.map(item => {
    //   console.log(item)
    //   if(item.steps){
    //     item.steps.map(step => {
    //       console.log(step)
    //       if(step.entities.length){
    //         step.entities.map(entity => console.log(entity))
    //       }
    //     })
    //   }
    // })

    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '故事流程設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res)
  })
  .catch(err => console.log(err))
})

// 使用者僅添加意圖
router.get('/userStep/intent/insert', (req, res) => {
  const {intent, storyName} = req.query
  const request = new sql.Request(pool)

  if(!intent) return res.send({status: 'warning', message: '意圖不可為空白'})

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
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
          item.steps.push(newStep)
        }
      }
    })

    // 使用模組寫檔並更新資料庫
    const filePath = '../public/trainData/fragments-test.json'
    const response = {status: 'success', message: '意圖設定成功'}
    fsSqlUpdate(filePath, data, 'BF_JH_DATA_TEST', 'fragments-test', response, request, res)
  })
  .catch(err => console.log(err))
})

// 修改故事流程名稱
router.get('/storyTitle/update', (req, res) => {
  const {originalTitle, updateTitle} = req.query
  const request = new sql.Request(pool)

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
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
      fsSqlUpdate(filePath, dataObj.data, 'BF_JH_DATA_TEST', 'fragments-test', {updateTitle}, request, res)
    }else{
      res.send({status: 'warning', message: '修改的名稱重複'})
    }
  })
  .catch(err => console.log(err))
})

// 設定故事流程名稱
router.get('/storyTitle', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3030');
  const {storyTitle} = req.query
  const request = new sql.Request(pool)

  if(storyTitle == '未命名故事' || !storyTitle) return res.send({status: 'warning', message: '請設定故事名稱'})

  // 從資料庫抓取故事流程
  request.query(`select DATA_CONTENT as fragments
  from BF_JH_DATA_TEST
  where DATA_NAME = 'fragments-test'`, (err, result) => {
    if(err){
      console.log(err)
      return
    }

    try {
      // 如果有故事流程資料的話
      const fragments = JSON.parse(result.recordset[0]['fragments'])
      const repeatName = []

      // 驗證名稱重複
      fragments.stories.map(item => {
        if(item.story == storyTitle){
          repeatName.push(item)
        }
      })

      if(repeatName.length) return res.send({status: 'warning', message: '故事名稱重複'})

      const newStory = {story: storyTitle}
      fragments.stories.push(newStory)

      // 寫入檔案
      fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/fragments-test.json'), JSON.stringify(fragments) , 'utf-8', 0o666, 'as+')

      // 讀取檔案
      const fd = fs.openSync(path.resolve(__dirname, '../../public/trainData/fragments-test.json'), 'as+', 0o666)
      const updateFragments = fs.readFileSync(fd, 'utf-8', 'as+')
      fs.closeSync(fd)

      // 更新進資料庫
      request.query(`update BF_JH_DATA_TEST
      set DATA_CONTENT = '${updateFragments}'
      where DATA_NAME = 'fragments-test'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.send({status: 'success', message: '故事名稱儲存成功'})
      })
    } catch (err) {
      // 資料格式
      const newStories = {
        stories: [
          {
            story: storyTitle
          }
        ]
      }
  
      // 將資料寫進檔案，要使用JSON.stringify()轉換格式
      fs.writeFileSync(path.resolve(__dirname, '../../public/trainData/fragments-test.json'), JSON.stringify(newStories) , 'utf-8', 0o666, 'as+')
  
      // 讀取檔案
      const fd = fs.openSync(path.resolve(__dirname, '../../public/trainData/fragments-test.json'), 'as+', 0o666)
      const fragmentsTest = fs.readFileSync(fd, 'utf-8', 'as+')
      fs.closeSync(fd)
  
      // 寫進資料庫
      request.query(`update BF_JH_DATA_TEST
      set DATA_CONTENT = '${fragmentsTest}'
      where DATA_NAME = 'fragments-test'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        res.send({status: 'success', message: '故事名稱儲存成功'})
      })
    }
  })
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

router.get('/filter', (req, res) => {
  const {storyFilter} = req.query
  const jh_story = true

  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
  .then(data => {
    const stories = data.stories
    const storyData = stories.filter(item => item.story == storyFilter)
    // storyData.map(item => console.log(item))
    
    res.render('index', {stories, jh_story, storyData})
  })
  .catch(err => console.log(err))
})

// 顯示故事流程首頁
router.get('/', (req, res) => {
  const jh_story = true

  // 使用模組從資料庫抓取fragments data
  getSqlTrainingData('BF_JH_DATA_TEST', 'fragments-test', 'fragments')
  .then(data => {
    const stories = data.stories
    res.render('index', {stories, jh_story})
  })
  .catch(err => console.log(err))
})

module.exports = router