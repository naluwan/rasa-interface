const BASE_URL = 'http://localhost:3030'
const INDEX_URL = BASE_URL + '/adminSearch/api/v1/new/'


const adminSearchWrapper = document.querySelector('#adminSearch-new-wrapper')
const companyFilter = document.querySelector('#companyFilter')
const tableFilter = document.querySelector('#tableFilter')
const industryBlock = document.querySelector('#industry-block')
const industrySelect = document.querySelector('#industry_select')
const adminSearchBlock = document.querySelector('#adminSearch-block')
const adminSelect = document.querySelector('#admin_select')

if(adminSearchWrapper){
	adminSearchWrapper.addEventListener('click', e => {
		const target = e.target
		const cpy_no = companyFilter.value
		// 選完公司直接帶入BOTFRONT_USERS_INFO中的INDUSTRY_NO(產業類別)
		if(target.matches('#companyFilter')){
			if(target.value){
				callAPI('INDUSTRY', cpy_no)
			}
			tableFilter.value = ''
			adminSelect.value = ''
			adminSelect.setAttribute('disabled', '')
		}
		
	
		if(target.matches('#tableFilter')){
			// 類別選擇完後透過DOM操作顯示資料
			if(target.value){
				adminSelect.removeAttribute('disabled')
				// 類別選擇職缺時，透過axios去API抓取相對應資料
				if(target.value == 'POSITION'){
					axios.get(INDEX_URL + `${target.value}/${companyFilter.value}/${industrySelect.value}`)
					.then(res => {
						const positionInfo = res.data.recordset
						let html = `<option value="" selected hidden>請選擇</option>`
						if(positionInfo.length == 0){
							adminSelect.setAttribute('disable', '')
							html += `<option value="" selected>無項目可新增</option>`
						}else{
							positionInfo.forEach(item => {
								html += `
								<option value="${item.POSITION_ID}">${item.POSITION_NAME}</option>
								`
							})
						}
						return adminSelect.innerHTML = html
					}).catch(err => console.log(err))
				}else if(target.value == 'COMPANY'){	// 類別選擇公司資訊時，透過axios去API抓取相對應資料
					axios.get(INDEX_URL + `COMPANY_INFO/${companyFilter.value}`)
					.then(res => {
						const companyInfo = res.data.recordset
						let html = `<option value="" selected hidden>請選擇</option>`
						if(companyInfo.length == 0){
							adminSelect.setAttribute('disabled', '')
							html += `<option value="" selected>無項目可新增</option>`
						}else{
							companyInfo.forEach(item => {
								html += `
								<option value="${item.INFO_ID}">${item.INFO_NAME}</option>
								`
							})
						}
						return adminSelect.innerHTML = html
					}).catch(err =>console.log(err))
				}else{
					callAPI(target.value, cpy_no)
				}
			}
		}
	})
}


function callAPI(tableName, cpy_no){

	if(tableName == 'INDUSTRY'){
		axios.get(INDEX_URL + tableName + '/' + cpy_no)
		.then(res => {
			const data = res.data.recordset
			html = `<option value="" selected hidden>請選擇</option>`
			data.forEach(item => {
				html +=`
				<option value="${item.Id}" selected>${item.Name}</option>
				`
			})
			return industrySelect.innerHTML = html
		}).catch(err => console.log(err))
	}else{
		
		axios.get(INDEX_URL + tableName + '/' + cpy_no)
		.then(res => {
			const data = res.data.recordset
			html = `<option value="" selected hidden>請選擇</option>`
			if(data.length == 0){
				adminSelect.setAttribute('disabled', '')
				html += `<option value="" selected>無項目可新增</option>`
			}else{
				// console.log(data)
				data.forEach(item => {
					html +=`
					<option value="${item.Id}">${item.Name}</option>
					`
				})
			}
			
			return adminSelect.innerHTML = html
		}).catch(err => console.log(err))
	}
}
