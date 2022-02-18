const dataPanel = document.querySelector('#data-panel')
const messageBlock = document.querySelector('#message-block')
const csTrainBtn = document.querySelector('.cs-train-btn')
const jhTrainBtn = document.querySelector('.jh-train-btn')
const questionDes = document.querySelector('.question-description')
const menu = document.querySelector('.menu')

if(dataPanel){
	dataPanel.addEventListener('click', event => {
		const target = event.target
	
		if(target.matches('#delete-btn')){
			const deletePosition = document.querySelector('#delete-position')
			const deleteForm = document.querySelector('#delete-form')
	
			deletePosition.innerText = '「' + target.dataset.name + '」'
			deleteForm.action = `/${target.dataset.category}/${target.dataset.entity}?_method=DELETE`
		}
	
		if(target.matches('#adminSearch-delete-btn')){
			const deletePosition = document.querySelector('#delete-position')
			const deleteForm = document.querySelector('#delete-form')
	
			deletePosition.innerText = '「' + target.dataset.cpyname + '的' + target.dataset.name + '」'
			deleteForm.action = `/${target.dataset.category}/${target.dataset.cpyno}/${target.dataset.table}/${target.dataset.id}?_method=DELETE`
		}

		if(target.matches('#delete-function-btn')){
			const deleteFunction = document.querySelectorAll('#delete-function')
			const deleteForm = document.querySelector('#delete-form')

			deleteFunction.forEach(item => {
				item.innerText = '「' + target.dataset.name + '」'
			})
			deleteForm.action = `/${target.dataset.category}/${target.dataset.id}/${target.dataset.categoryid}?_method=DELETE`
		}

		if(target.matches('#delete-question-btn')){
			const deleteQuestion = document.querySelectorAll('#delete-question')
			const deleteForm = document.querySelector('#delete-form')

			deleteQuestion.forEach(item => {
				item.innerText = '「' + target.dataset.name + '」'
			})
			if(target.dataset.categoryid){
				deleteForm.action = `/${target.dataset.category}/${target.dataset.id}/${target.dataset.functionid}/${target.dataset.categoryid}?_method=DELETE`
			}else{
				deleteForm.action = `/${target.dataset.category}/${target.dataset.id}/${target.dataset.functionid}/?_method=DELETE`
			}
			
		}

		if(target.matches('#delete-question-admin-btn')){
			const deleteQuestion = document.querySelectorAll('#delete-question')
			const deleteForm = document.querySelector('#delete-form')

			deleteQuestion.forEach(item => {
				item.innerText = '「' + target.dataset.name + '」'
			})
			deleteForm.action = `/${target.dataset.category}/${target.dataset.id}/${target.dataset.functionid}?_method=DELETE`
		}
	})
}

if(csTrainBtn){
	csTrainBtn.addEventListener('click', e => {
		const target = e.target
		if(target.matches('.cs-train-btn')){
			console.log('訓練中...')
			csTrainBtn.setAttribute('disabled', '')
			csTrainBtn.innerHTML = '<i class="fas fa-spinner fast-spin fa-2x"></i>'
			messageBlock.innerHTML = `
			<div class="alert alert-warning alert-dismissible fade show" role="alert">
				訓練中.....
				<button type="button" class="close" data-dismiss="alert" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			`
			
			fetch('http://localhost:3030/train/cs/trainingData')
			.then(response => {
				return response.json()
			})
			.then(data => {
				fetch('http://192.168.10.108:5005/model/train?save_to_default_model_directory=true&force_training=false',{
					method: 'post',
					body: JSON.stringify(data),
					headers: {
						"content-type": "application/json",
					},
					mode: 'no-cors',
				})
				.then(response => {
					fetch('http://localhost:3030/train/trainingComplete')
					.then(response => {
						return response.json()
					})
					.then(result => {
						console.log(`功能訓練結果：` + result[1].functions)
						console.log(`問答資訊訓練結果：` + result[0].question)
						console.log('訓練完成!!')
						csTrainBtn.removeAttribute('disabled')
						csTrainBtn.innerText = 'Train'
						messageBlock.innerHTML = `
						<div class="alert alert-success alert-dismissible fade show" role="alert">
							訓練完成!!
							<button type="button" class="close" data-dismiss="alert" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						`
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
			// console.log('訓練中...')
			jhTrainBtn.setAttribute('disabled', '')
			jhTrainBtn.innerHTML = '<i class="fas fa-spinner fast-spin fa-2x"></i>'
			// messageBlock.innerHTML = `
			// <div class="alert alert-warning alert-dismissible fade show" role="alert">
			// 	訓練中.....
			// 	<button type="button" class="close" data-dismiss="alert" aria-label="Close">
			// 		<span aria-hidden="true">&times;</span>
			// 	</button>
			// </div>
			// `
			
			fetch('http://192.168.11.80:3030/train/jh/trainingData')
			.then(response => {
				return response.json()
			})
			.then(data => {
				console.log(data)
				fetch('http://192.168.10.108:5005/model/train?save_to_default_model_directory=true&force_training=false',{
					method: 'post',
					body: JSON.stringify(data),
					headers: {
						"content-type": "application/json",
					},
					mode: 'no-cors',
				})
				.then(response => {
					fetch('http://192.168.11.80:3030/train/trainingComplete')
					.then(response => {
						return response.json()
					})
					.then(result => {
						jhTrainBtn.removeAttribute('disabled')
						jhTrainBtn.innerText = '執行訓練'
						// messageBlock.innerHTML = `
						// <div class="alert alert-success alert-dismissible fade show" role="alert">
						// 	訓練完成!!
						// 	<button type="button" class="close" data-dismiss="alert" aria-label="Close">
						// 		<span aria-hidden="true">&times;</span>
						// 	</button>
						// </div>
						// `
					})
					.catch(err => console.log(err))
				})
				.catch(err => console.log(err))
			})
			.catch(err => console.log(err))
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

// if(menu){
// 	menu.addEventListener('click', e => {
// 		const target = e.target
// 		// console.log(target.tagName)
// 		if(target.tagName == 'BUTTON'){
// 			// e.preventDefault()
// 			fetch(`http://192.168.11.80:3030/${target.id}`,{
// 				mode: 'no-cors',
// 			})
// 			.then(response => {
// 				return response.json()
// 			})
// 			.then(data => {
// 				console.log(data)
// 			})
// 			.catch(err => console.log(err))
// 		}
// 	})
// }





