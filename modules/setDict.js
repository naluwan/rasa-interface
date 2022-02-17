const axios = require('axios')

module.exports = {
  // 新增職缺dict
  setPositionDict: (position_name) => {
    const regex = /\)|\>|\}|\]|」|\』|\】|\〕/g
    let regex_name = ''
    if(regex.test(position_name)) {
      // 括弧在前方 ex.【CMO單位】專案經理
      regex_name = position_name.slice(regex.lastIndex, position_name.length + 1)
      if(regex_name == ''){
        // 括弧在後方 ex.專案經理【CMO單位】
        const regex =  /\(|\<|\{|\[|「|\『|\【|\〔/g
        regex.test(position_name)
        regex_name = position_name.slice(0, regex.lastIndex - 1)
      }
    }
    // 因中文無法直接在url直接當作網址傳送，所以需要使用encodeURI()轉成網址可以接受的格式
    const url = encodeURI(`http://192.168.10.108:3040/setDict/jh/position?position_name=${position_name}&regex_name=${regex_name}`)
    const config = {
      method: 'post',
      url: url,
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
    const regex = /\)|\>|\}|\]|」|\』|\】|\〕/g
    let regex_name = ''
    if(regex.test(cpnyInfo_name)) {
      // 括弧在前方 ex.【CMO單位】專案經理
      regex_name = cpnyInfo_name.slice(regex.lastIndex, cpnyInfo_name.length + 1)
      if(regex_name == ''){
        // 括弧在後方 ex.專案經理【CMO單位】
        const regex =  /\(|\<|\{|\[|「|\『|\【|\〔/g
        regex.test(cpnyInfo_name)
        regex_name = cpnyInfo_name.slice(0, regex.lastIndex - 1)
      }
    }
    const url = encodeURI(`http://192.168.10.108:3040/setDict/jh/cpnyInfo?cpnyInfo_name=${cpnyInfo_name}&regex_name=${regex_name}`)
    const config = {
      method: 'post',
      url: url,
      headers: {},
    }
    axios(config)
    .then(response => {
      console.log(response.data)
    })
    .catch(err => console.log(err))
  }
}