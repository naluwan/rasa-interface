const SERVER_URL = 'http://localhost:3030'
const FUNCTION_API_URL = BASE_URL + '/bf_cs/api/v1/'

const csSearchWrapper = document.querySelector('.cs-search-wrapper')
const functionSelect = document.querySelector('#functionSelect')


if(csSearchWrapper){
	csSearchWrapper.addEventListener('click', e => {
		const target = e.target
		if(target.matches('#categorySelect')){
      if(target.value){
        callFunctionAPI(target.value)
      }
    }
	})
}

function callFunctionAPI(category_id){
  axios.get(FUNCTION_API_URL + `function/${category_id}`)
  .then(res => {
    const data = res.data.recordset
    html = `<option value="" selected hidden>請選擇</option>`
    if(data.length == 0){
      functionSelect.setAttribute('disabled', '')
      html += `<option value="" selected>查無功能</option>`
    }else{
      functionSelect.removeAttribute('disabled')
      data.forEach(item => {
        html +=`
        <option value="${item.FUNCTION_ID}">${item.FUNCTION_NAME}</option>
        `
      })
    }
    
    return functionSelect.innerHTML = html
	}).catch(err => console.log(err))
}