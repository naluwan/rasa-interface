const axios = require('axios')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

module.exports = {
  // 新增問題寫檔
  fsWriteQuestion: (description, entity_name, request) => {
    axios.get('http://localhost:3030/train/trainingData')
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
  // 刪除問題寫檔
  fsDeleteQuestion: (questionCheck, request) => {
    axios.get('http://localhost:3030/train/trainingData')
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
  // 新增功能寫檔
  fsWriteFunction: (category, function_name, entity_name, request) => {
    const category_name = {
      1: {name: '人事', entity: 'personnel'},
      2: {name: '考勤', entity: 'attendance'},
      3: {name: '保險', entity: 'insurance'},
      4: {name: '薪資', entity: 'salary'},
      5: {name: '額外', entity: 'otherCategory'},
    }
    // console.log(category_name[category])
    const currentCategory = category_name[category]

    axios.get('http://localhost:3030/train/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // console.log(JSON.stringify(data.nlu.zh.rasa_nlu_data.common_examples))
      // console.log(data)
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const newFunction = {
        "text": `${function_name}`,
        "intent": "分類加功能",
        "entities": [
          { "entity": `function`, "value": `${entity_name}`, "start": 0, "end": function_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const repeatText = nluData.filter(item => item.text == newFunction.text)

      if(repeatText.length){
        return console.log(`資料重複： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(newFunction)
        data.nlu.zh.rasa_nlu_data.common_examples = nluData
        return data
        }
    })
    .then(data => {
      if(!data.nlu) return
      nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const text = `${currentCategory.name}的${function_name}`

      const newMultiEntities = {
        "text": text,
        "intent": "分類加功能",
        "entities": [
          { "entity": "function", "value": `${entity_name}`, "start": 3, "end": text.length },
          { "entity": "category", "value": `${currentCategory.entity}`, "start": 0, "end": 2 }
        ],
        "metadata": { "language": "zh" }
      }

      const repeatText = nluData.filter(item => item.text == newMultiEntities.text)
      if(repeatText.length){
        console.log(`資料重複： ` + JSON.stringify(repeatText[0]))
      }else{
        nluData.push(newMultiEntities)
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
  // 刪除功能寫檔
  fsDeleteFunction: (functionCheck, category_id, request) => {
    axios.get('http://localhost:3030/train/trainingData')
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

  fsDeleteFunctionRef: (questionCheck, functionCheck, category_id, function_id, request, req, res) => {
    axios.get('http://localhost:3030/train/trainingData')
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
  }
}