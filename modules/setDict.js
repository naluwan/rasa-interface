const axios = require('axios')

module.exports = {
  // 新增職缺dict
  setPositionDict: (position_name) => {
    // 因中文無法直接在url直接當作網址傳送，所以需要使用encodeURI()轉成網址可以接受的格式
    position_name = encodeURI(position_name)
    const config = {
      method: 'post',
      url: `http://192.168.10.108:3040/setDict/jh/position?position_name=${position_name}`,
      headers: {},
    }
    axios(config)
    .then(response => {
      console.log(response.data)
    })
    .catch(err => console.log(err))
  },
  // 新增公司資訊dict
  setCpnyInfoDict: (cpnyInfo_name) => {
    cpnyInfo_name = encodeURI(cpnyInfo_name)
    const config = {
      method: 'post',
      url: `http://192.168.10.108:3040/setDict/jh/cpnyInfo?cpnyInfo_name=${cpnyInfo_name}`,
      headers: {},
    }
    axios(config)
    .then(response => {
      console.log(response.data)
    })
    .catch(err => console.log(err))
  }
}