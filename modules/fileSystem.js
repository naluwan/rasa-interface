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

    axios.get('http://localhost:3030/train/cs/trainingData')
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
          { "entity": `${entity_name}`, "value": entity_2_text, "start": 0, "end": entity_2_text.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${position_name}的薪資`
      const entity_3 = {
        "text": entity_3_text,
        "intent": "職缺",
        "entities": [
          { "entity": `${entity_name}`, "value": entity_3_text, "start": 0, "end": entity_3_text.length}
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
    })
  },
  // 徵厲害新增公司資訊寫檔
  fsJhWriteCpnyInfo: (cpny_name, entity_name, request) => {
    axios.get('http://localhost:3030/train/jh/trainingData')
    .then(response => {
      return response.data
    })
    .then(data => {
      // 新增cpnyInfo_category
      const nluData = data.nlu.zh.rasa_nlu_data.common_examples
      const entity_1 = {
        "text": `${cpny_name}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${cpny_name}`, "start": 0, "end": cpny_name.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_2_text = `我想了解${cpny_name}`
      const entity_2 = {
        "text": `${entity_2_text}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${entity_2_text}`, "start": 0, "end": entity_2_text.length}
        ],
        "metadata": { "language": "zh", "canonical": true }
      }

      const entity_3_text = `我想知道${cpny_name}的資訊`
      const entity_3 = {
        "text": `${entity_3_text}`,
        "intent": "問公司資訊",
        "entities": [
          { "entity": `${entity_name}`, "value": `${entity_3_text}`, "start": 0, "end": entity_3_text.length}
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
  }
}