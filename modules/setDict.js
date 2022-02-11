const axios = require('axios')

module.exports = {
  setPositionDict: (position_name) => {
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
  }
}