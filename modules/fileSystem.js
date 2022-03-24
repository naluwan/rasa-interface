const axios = require('axios')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

module.exports = {
  // 新增客服問題寫檔
  fsWriteQuestion: (description, entity_name, request) => {
    axios.get('http://localhost:3030/train/cs/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // console.log(JSON.stringify(data.nlu.zh.rasa_nlu_data.common_examples))
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const newContent = {
        "text": `${description}`,
        "intent": "問答",
        "entities": [
          { "entity": `${entity_name}`, "value": `${description}`, "start": 0, "end": description.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == newContent.text)
      if(repeatText.length){
        console.log(`資料重複： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(newContent)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_CS_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },
  // 刪除客服問題寫檔
  fsDeleteQuestion: (questionCheck, request) => {
    axios.get('http://localhost:3030/train/cs/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })
      // console.log(questionCheck.DESCRIPTION)
      const index = arrayText.indexOf(questionCheck.DESCRIPTION)
      // console.log(index)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)

      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_CS_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },
  // 新增客服功能寫檔
  fsWriteFunction: (categoryName, categoryEntity, function_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/cs/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // console.log(JSON.stringify(data.nlu.zh.rasa_nlu_data.common_examples))
      // console.log(data)
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples

      const entity_1 = {
        "text": `${function_name}`,
        "intent": "分類加功能",
        "entities": [
          { "entity": `function`, "value": `${entity_name}`, "start": 0, "end": function_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `${categoryName}的${function_name}`
      const entity_2 = {
        "text": entity_2_text,
        "intent": "分類加功能",
        "entities": [
          { "entity": `function`, "value": `${entity_name}`, "start": 3, "end": entity_2_text.length},
          { "entity": "category", "value": `${categoryEntity}`, "start": 0, "end": categoryName.length }
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想查${function_name}的問題`
      const entity_3 = {
        "text": entity_3_text,
        "intent": "分類加功能",
        "entities": [
          { "entity": `function`, "value": `${entity_name}`, "start": 3, "end": function_name.length + 3}
        ],
        "metadata": { "language": "zh", "canonical": true }
        }

      const entity_4_text = `想問${categoryName}${function_name}的問題`
      const entity_4 = {
        "text": entity_4_text,
        "intent": "分類加功能",
        "entities": [
          { "entity": `function`, "value": `${entity_name}`, "start": categoryName.length + 2 , "end": function_name.length + categoryName.length + 2},
          { "entity": "category", "value": `${categoryEntity}`, "start": 2, "end":  categoryName.length + 2 }
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == entity_1.text)

      if(repeatText.length){
        return console.log(`資料重複： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(entity_1, entity_2, entity_3, entity_4)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_CS_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },
  // 刪除客服功能寫檔
  fsDeleteFunction: (functionCheck, category_id, request) => {
    axios.get('http://localhost:3030/train/cs/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })
      // console.log(questionCheck.DESCRIPTION)
      const index = arrayText.indexOf(functionCheck.FUNCTION_NAME)
      // console.log(index)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      return data
    })
    .then(data => {
      const category_name = {
        1: {name: '人事', entity: 'personnel'},
        2: {name: '考勤', entity: 'attendance'},
        3: {name: '保險', entity: 'insurance'},
        4: {name: '薪資', entity: 'salary'},
        5: {name: '額外', entity: 'otherCategory'},
      }
      const currentCategory = category_name[category_id]
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })

      const text = `${currentCategory.name}的${functionCheck.FUNCTION_NAME}`
      const index = arrayText.indexOf(text)
      // console.log(index)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_CS_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },

  // 刪除客服功能及關聯問答資訊的寫檔功能
  fsDeleteFunctionRef: (questionCheck, functionCheck, category_id, function_id, request, req, res) => {
    axios.get('http://localhost:3030/train/cs/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 刪除功能下的question
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })

      questionCheck.forEach(question => {
        const index = arrayText.indexOf(functionCheck.FUNCTION_NAME)
        data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      })
      return data
    })
    .then(data => {
      // 刪除功能
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })
      const index = arrayText.indexOf(functionCheck.FUNCTION_NAME)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      return data
    })
    .then(data => {
      // 刪除功能多entity
      const category_name = {
        1: {name: '人事', entity: 'personnel'},
        2: {name: '考勤', entity: 'attendance'},
        3: {name: '保險', entity: 'insurance'},
        4: {name: '薪資', entity: 'salary'},
        5: {name: '額外', entity: 'otherCategory'},
      }
      const currentCategory = category_name[category_id]
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })

      const text = `${currentCategory.name}的${functionCheck.FUNCTION_NAME}`
      const index = arrayText.indexOf(text)
      // console.log(index)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      // 刪除資料庫內功能下的問答資訊
      // console.log(`刪除question data： ${data}`)
      request.query(`delete from BF_CS_QUESTION
      where FUNCTION_ID = ${function_id}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
      return data
    })
    .then(data => {
      // 刪除資料庫內的功能
      // console.log(`刪除function data： ${data}`)
      request.query(`delete from BF_CS_FUNCTION
      where FUNCTION_ID = ${function_id}
      and CATEGORY_ID = ${category_id}`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
      return data
    })
    .then(data => {
      // 更新資料庫內的訓練資料(nlu-json)
      // console.log(`更新data的data： ${data}`)
      request.query(`update BF_CS_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .then(data => {
      req.flash('success_msg', '刪除功能成功!!')
      return res.redirect(`/bf_cs/function/filter?category=${category_id}&search=`)
    })
    .catch(err => console.log(err))
  },

  // 新增徵厲害職缺寫檔
  fsJhWritePosition: (position_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 新增position category
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const entity_1 = {
        "text": `${position_name}`,
        "intent": "職缺",
        "entities": [
          { "entity": `${entity_name}`, "value": `${position_name}`, "start": 0, "end": position_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `${position_name}的工作內容`
      const entity_2 = {
        "text": entity_2_text,
        "intent": "職缺",
        "entities": [
          { "entity": `${entity_name}`, "value": `${position_name}`, "start": 0, "end": position_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${position_name}的薪資`
      const entity_3 = {
        "text": entity_3_text,
        "intent": "職缺",
        "entities": [
          { "entity": `${entity_name}`, "value": `${position_name}`, "start": 4, "end": position_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == entity_1.text)
      if(repeatText.length){
        console.log(`已有訓練資料： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(entity_1, entity_2, entity_3)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },
  
  // 刪除徵厲害職缺寫檔
  fsJhDeletePosition: (positionDesCheck, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data 
    })
    .then(data => {
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })
      const index = arrayText.indexOf(positionDesCheck.POSITION_NAME)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      return data
    })
    .then(data => {
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })

      const text = `${positionDesCheck.POSITION_NAME}的工作內容`
      const index = arrayText.indexOf(text)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      return data
    })
    .then(data => {
      const arrayText = []
      data.nlu.zh.rasa_nlu_data.common_examples.forEach(item => {
        arrayText.push(item.text)
      })

      const text = `我想知道${positionDesCheck.POSITION_NAME}的薪資`
      const index = arrayText.indexOf(text)
      data.nlu.zh.rasa_nlu_data.common_examples.splice(index, 1)
      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    }).catch(err => console.log(err))
  },
  // 徵厲害新增公司資訊寫檔
  fsJhWriteInfo: (info_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 新增cpnyInfo_category
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const entity_1 = {
        "text": `${info_name}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${info_name}`, "start": 0, "end": info_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `我想了解${info_name}`
      const entity_2 = {
        "text": `${entity_2_text}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${info_name}`, "start": 4, "end": info_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${info_name}的資訊`
      const entity_3 = {
        "text": `${entity_3_text}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${info_name}`, "start": 4, "end":info_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_4_text = `你們公司有${info_name}嗎`
      const entity_4 = {
        "text": `${entity_4_text}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${info_name}`, "start": 5, "end": info_name.length + 5}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == entity_1.text)
      if(repeatText.length){
        console.log(`已有訓練資料： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(entity_1, entity_2, entity_3, entity_4)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    }).catch(err => console.log(err))
  },
  // 徵厲害新增補助津貼寫檔
  fsWriteSubsidy: (subsidy_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const entity_1 = {
        "text": `${subsidy_name}`,
        "intent": "問補助資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${subsidy_name}`, "start": 0, "end": subsidy_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `我想了解${subsidy_name}`
      const entity_2 = {
        "text": `${entity_2_text}`,
        "intent": "問補助資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${subsidy_name}`, "start": 4, "end": subsidy_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${subsidy_name}的資訊`
      const entity_3 = {
        "text": `${entity_3_text}`,
        "intent": "問補助資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${subsidy_name}`, "start": 4, "end": subsidy_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == entity_1.text)
      if(repeatText.length){
        console.log(`已有訓練資料： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(entity_1, entity_2, entity_3)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    }).catch(err => console.log(err))
  },
    // 徵厲害新增假別寫檔
  fsWriteLeave: (leave_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const entity_1 = {
        "text": `${leave_name}`,
        "intent": "問假別資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${leave_name}`, "start": 0, "end": leave_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `我想了解${leave_name}`
      const entity_2 = {
        "text": `${entity_2_text}`,
        "intent": "問假別資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${leave_name}`, "start": 4, "end": leave_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${leave_name}的資訊`
      const entity_3 = {
        "text": `${entity_3_text}`,
        "intent": "問假別資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${leave_name}`, "start": 4, "end": leave_name.length + 4}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_4_text = `公司有${leave_name}嗎`
      const entity_4 = {
        "text": `${entity_4_text}`,
        "intent": "問假別資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${leave_name}`, "start": 3, "end": leave_name.length + 3}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == entity_1.text)
      if(repeatText.length){
        console.log(`已有訓練資料： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(entity_1, entity_2, entity_3, entity_4)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        try{
          fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
        } catch(err){
          console.log(err)
        }
      }
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    }).catch(err => console.log(err))
  },
  // 徵厲害admin刪除類別nlu訓練資料
  fsJhDeleteNlu: (infoCheck, intent, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 將要刪除的資料篩選出來，回傳需要保留的資料
      data.nlu.zh.rasa_nlu_data.common_examples = data.nlu.zh.rasa_nlu_data.common_examples.filter(info => {
        return !info.text.includes(infoCheck) || info.intent != intent
      })
      // 將要保留的資料寫檔
      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      // 讀取最新的訓練資料檔並回傳
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return newNluData
    })
    .then(data => {
      // 找出同義詞並刪除
      data.rasa_nlu_data.entity_synonyms = data.rasa_nlu_data.entity_synonyms.map(item => {
        const index = item.synonyms.indexOf(infoCheck)
        if(index != -1){
          item.synonyms.splice(index, 1)
        }
        return item
      })

      // 同義詞僅回傳有值的，沒值代表同義詞或主類別被刪除光了
      data.rasa_nlu_data.entity_synonyms = data.rasa_nlu_data.entity_synonyms.filter(item => {
        return item.synonyms.length != 0
      })

      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data))
      } catch(err){
        console.log(err)
      }
      // 讀取最新的訓練資料檔並回傳
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      // 將要刪除的資料刪除後回寫資料庫
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  },
  // 徵厲害admin更新類別nlu訓練資料
  fsUpdateCategoryNlu: (infoCheck, intent, name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 將要更新的資料篩選出來並更新資料
      data.nlu.zh.rasa_nlu_data.common_examples.map(info => {
        if(info.text.includes(infoCheck) && info.intent == intent){
          info.text = info.text.replace(infoCheck, name)
          info.entities[0].entity = entity_name
          info.entities[0].value = info.text
          info.entities[0].end = info.text.length
        }
      })
      // 將更新後的資料寫檔
      try{
        fs.writeFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), JSON.stringify(data.nlu.zh))
      } catch(err){
        console.log(err)
      }
      // 讀取最新的訓練資料檔並回傳
      const newNluData =  yaml.load(fs.readFileSync(path.resolve(__dirname, '../public/trainData/nlu-json.json'), 'utf8'))
      return JSON.stringify(newNluData)
    })
    .then(data => {
      // 將更新後的訓練資料回寫資料庫
      request.query(`update BF_JH_TRAINING_DATA
      set DATA_CONTENT = '${data}'
      where DATA_NAME = 'nlu-json'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
      })
    })
    .catch(err => console.log(err))
  }
}