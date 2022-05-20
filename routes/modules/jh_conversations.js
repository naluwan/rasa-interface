const express = require('express')
const router = express.Router()
const axios = require('axios')
const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')

const sql = require('mssql')
const pool = require('../../config/connectPool')

const {fsJhWriteInfo, fsJhWritePosition, fsWriteSubsidy, fsWriteLeave, fsJsAddSynonyms} = require('../../modules/fileSystem')
const {setInfoDict, setPositionDict} = require('../../modules/setDict')
const {randomNum, checkNum} = require('../../modules/randomNum')
const {insertDes, updateDes, deleteDes, insertCategory, querySynonym, queryEditSynonym} = require('../../modules/useSql')

router.get('/story', (req, res) => {
  const { senderId } = req.query

  // axios.get(`http://192.168.11.109:5005/conversations/${senderId}/story`)
  // .then(response => {
  //   return response.data
  // })
  // .then(data => {
  //   const dataJson = yaml.load(data)
  //   console.log(dataJson.stories[0].steps)
  // })
  // .catch(err => console.log(err))

  const data = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../public/trainData/domain.yml'), 'utf8'))

  // data.stories.forEach(story => {
    console.log(data)
  // })
})

// 徵厲害 user 顯示對話紀錄資料
router.get('/filter', (req, res) => {
  const { senderId } = req.query
  const user = res.locals.user
	const cpnyId = user.CPY_ID 
  const jh_conversations = true
  const request = new sql.Request(pool)
  const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g

  if(regex.test(senderId)){
    return res.send('<pre>{"status":"warning","message":"搜尋字串包含非法字元，請重新嘗試"}</pre>')
  }

  // 抓取對話紀錄ID
  request.query(`select * 
  from BF_JH_CONVERSATIONS
  where SENDER_ID is not null
  and CPY_ID = '${cpnyId}'
  order by CRDATE DESC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const conversations = result.recordset
    conversations[0].CRDATE = conversations[0].CRDATE.toLocaleString()
    conversations.forEach(item => item.CRDATE = item.CRDATE.toLocaleString())

    // 串接RASA HTTP API
    axios.get(`http://192.168.10.105:5005/conversations/${senderId}/tracker`)
    .then(response => {
      return response.data
    })
    .then(data => {
      // 篩選對話資料
      const events = data.events.filter(item => {
        if(item.event == 'bot' || item.event == 'user'){
          // 將時間改成javascript的格式
          item.timestamp = new Date(item.timestamp * 1000).toLocaleString('zh-tw', {hour12: false, timeZone: 'Asia/Taipei'})
          if(item.event == 'bot') return item

          // 將意圖百分比算出來
          if(item.parse_data.intent_ranking.length){
            item.parse_data.intent_ranking[0].confidence = Math.floor(item.parse_data.intent_ranking[0].confidence * 100)
          }

          // 將關鍵字內主類別刪除
          if(item.parse_data.entities.length){
            item.parse_data.entities[0].value = item.parse_data.entities[0].value.replace('主類別', '')
          }
          return item
        }
      })
      res.render('index', {jh_conversations, conversations, events})
    })
    .catch(err => console.log(err))
  })
})

// 徵厲害 user 顯示對話紀錄頁面
router.get('/', (req, res) => {
  const jh_conversations = true
  const request = new sql.Request(pool)

  request.query(`select SENDER_ID, convert(char(19), CRDATE, 120) as CRDATE
  from BF_JH_CONVERSATIONS
  where SENDER_ID is not null
  order by CRDATE DESC`, (err, result) => {
    if(err){
      console.log(err)
      return
    }
    const conversations = result.recordset
    res.render('index', {jh_conversations, conversations})
  })
})

module.exports = router