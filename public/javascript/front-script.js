const messageBlock = document.querySelector('#messageBlock')
const csTrainBtn = document.querySelector('.cs-train-btn')
const jhTrainBtn = document.querySelector('.jh-train-btn')
const questionDes = document.querySelector('.question-description')
const adminNewSearch = document.querySelector('.admin_new_search')

if(csTrainBtn){
	csTrainBtn.addEventListener('click', e => {
		const target = e.target
		if(target.matches('.cs-train-btn')){
			csTrainBtn.setAttribute('disabled', '')
			csTrainBtn.innerHTML = '<i class="fas fa-spinner fast-spin fa-2x"></i>'
			
			fetch('http://192.168.10.127:3030/train/cs/trainingData')
			.then(response => {
				return response.json()
			})
			.then(data => {
				fetch('http://192.168.10.105:5005/model/train?save_to_default_model_directory=true&force_training=false',{
					method: 'post',
					body: JSON.stringify(data),
					headers: {
						"content-type": "application/json",
					},
					mode: 'no-cors',
				})
				.then(response => {
					fetch('http://loclahost:3030/train/trainingComplete')
					.then(response => {
						return response.json()
					})
					.then(result => {
						csTrainBtn.removeAttribute('disabled')
						csTrainBtn.innerText = '執行訓練'

						// 訓練完成提示框
						var html = "<h1><div class='sa-icon success'><span></span></div>訓練完成</h1>";
						Method.common.showBox(html, 'message');
					})
					.catch(err => console.log(err))
				})
				.catch(err => console.log(err))
			})
			.catch(err => console.log(err))
		}
	})
}

if(jhTrainBtn){
	jhTrainBtn.addEventListener('click', e => {
		const target = e.target
		if(target.matches('.jh-train-btn')){

			fetch('http://192.168.10.127:3030/train/jh/status',{
				mode: 'no-cors',
			})
			.then(response => {
				console.log(response)
				return response.json()
			})
			.then(data => {
				if(data != '0'){
					Method.common.train()
					var html = "<h2><div class='sa-icon success'><span></span></div>機器人已在訓練中，請稍後重試</h2>";
					Method.common.showBox(html, 'message');
				}else{
					jhTrainBtn.setAttribute('disabled', '')
			
					fetch('http://192.168.10.127:3030/train/jh/trainingData')
					.then(response => {
						return response.json()
					})
					.then(data => {
						console.log(JSON.stringify(data))
						let filename
						fetch('http://192.168.10.105:5005/model/train?save_to_default_model_directory=true&force_training=true',{
							method: 'post',
							body: JSON.stringify(data),
							headers: {
								'content-Type': "application/json",
							},
						})
						.then(response => {
							filename = response.headers.get('filename')
							return filename
						})
						.then(filename => {
							console.log('filename:',filename)
							const payload ={ 'model_file': `/home/bill/Work/BF36_RASA_2.8.31_spacy/models/${filename}`}
							fetch('http://192.168.10.105:5005/model', {
								method: 'put',
								body: JSON.stringify(payload),
								headers: {
									'content-Type': "application/json",
								},
							})
							.then(res => {
								console.log(res)
								fetch('http://192.168.10.127:3030/train/trainingComplete')
								.then(response => {
									return response.json()
								})
								.then(result => {
									jhTrainBtn.removeAttribute('disabled')

									// 訓練完成提示框
									var html = "<h1><div class='sa-icon success'><span></span></div>訓練完成</h1>";
									Method.common.showBox(html, 'message');
									

								})
								.catch(err => console.log(err))	
							})
						})
						.catch(err => console.log(err))
					})
					.catch(err => console.log(err))
				}
			})
		}
	})
}

if(questionDes){
	questionDes.addEventListener('mouseup', e => {
		if(document.Selection){
			console.log(document.selection.createRange().text)
		} else {
			if(window.getSelection().toString()){
				console.log(window.getSelection().toString())
				const prop = prompt('請輸入關鍵字英文代號', '')
				if(prop != null && prop != ''){
					console.log(`${window.getSelection().toString()}的entity是${prop}`)
				}
			}
		}
	})
}

// if(adminNewSearch){
// 	adminNewSearch.addEventListener('click', e => {
// 		const target = e.target
// 		console.log(target)

// 		let cpnyId = ''
// 		let category = ''
// 		if(target.matches('.cpnyId')){
// 			console.log(target)
// 			cpnyId = target.value
// 		}

// 		if(target.matches('.category')){
// 			console.log(target)

// 			category = target.value
// 		}

// 		document.querySelector('#cancel').onclick = `Method.common.page('/admin_search/filter?companyFilter=${cpnyId}&tableFilter=${category}&search=')`
// 	})
// }





