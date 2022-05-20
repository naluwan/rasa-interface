const express = require('express')
const router = express.Router()
const yaml = require('js-yaml')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const sql = require('mssql')
const pool = require('../../config/connectPool')
const {getTrainingData} = require('../../modules/getTrainingData')

// 棉花糖 抓取cs training data
router.get('/cs/trainingData', (req, res) =>{
  getTrainingData('BF_CS_TRAINING_DATA')
  .then(data => {
    return res.json(data)
  })
  .catch(err => res.send(err))
})

// 徵厲害 抓取jh training data
router.get('/jh/trainingData', (req, res) => {
  getTrainingData('BF_JH_TRAINING_DATA')
  .then(data => {
    return res.json(data)
  })
  .catch(err => res.send(err))
})

// 訓練完成
router.get('/trainingComplete', (req, res) => {
  res.json({status: 'success', message: '訓練完成'})
})

// 徵厲害 - 查看rasa核心狀況
router.get('/jh/status', (req, res) => {
  axios.get('http://192.168.10.105:5005/status')
  .then(response => {
    return res.json(response.data.num_active_training_jobs)
  })
  .catch(err => console.log(err))
})

module.exports = router
