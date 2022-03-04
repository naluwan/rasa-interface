module.exports = {
  randomNum: async (cpnyid, request, checkNum) => {
    const randomNum = (Math.random()+"").replace("0.", "").substr(0, 15)

    return await checkNum(cpnyid, cpnyid+randomNum, request)
    .then(num => {
      return num
    }).catch(err => console.log(err))
  },
  checkNum: (cpnyId, num, request) => {
    return new Promise(function(resolve, reject){
      request.query(`select INFO_ID 
      from BF_JH_CPNYINFO
      where CPY_ID = '${cpnyId}'`, (err, result) => {
        if(err){
          console.log(err)
          return
        }
        const cpnyInfoCheck = result.recordset
        
        request.query(`select INFO_ID 
        from BF_JH_POSITION
        where CPY_ID = '${cpnyId}'`, (err, result) => {
          if(err){
            console.log(err)
            return
          }
          const positionCheck = result.recordset

          request.query(`select INFO_ID 
          from BF_JH_LEAVE
          where CPY_ID = '${cpnyId}'`, (err, result) => {
            if(err){
              console.log(err)
              return
            }
            const leaveCheck = result.recordset

            request.query(`select INFO_ID 
            from BF_JH_SUBSIDY
            where CPY_ID = '${cpnyId}'`, (err, result) => {
              if(err){
                console.log(err)
                return
              }
              const subsidyCheck = result.recordset
              
              const checkArray = cpnyInfoCheck.concat(positionCheck, leaveCheck, subsidyCheck)

              if(checkArray.includes(num)){
                return randomNum(cpnyId, request)
              }
              resolve(num)
            })
          })
        })
      })
    })
  }
}