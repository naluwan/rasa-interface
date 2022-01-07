const dataPanel = document.querySelector('#data-panel')
const messageBlock = document.querySelector('#message-block')
const trainBtn = document.querySelector('#train-btn')

if(dataPanel){
	dataPanel.addEventListener('click', event => {
		const target = event.target
	
		if(target.matches('#delete-btn')){
			const deletePosition = document.querySelector('#delete-position')
			const deleteForm = document.querySelector('#delete-form')
	
			deletePosition.innerText = '「' + target.dataset.name + '」'
			deleteForm.action = `/${target.dataset.category}/${target.dataset.id}?_method=DELETE`
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

if(trainBtn){
	trainBtn.addEventListener('click', e => {
		const target = e.target
		if(target.matches('#train-btn')){
			console.log('訓練中...')
			trainBtn.setAttribute('disabled', '')
			trainBtn.innerText = '訓練中...'
			messageBlock.innerHTML = `
			<div class="alert alert-warning alert-dismissible fade show" role="alert">
				訓練中.....
				<button type="button" class="close" data-dismiss="alert" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			`
			
			fetch('http://localhost:3030/train/trainingData')
			.then(response => {
				// console.log(response)
				return response.json()
			})
			.then(data => {
				// console.log(data)
				fetch('http://192.168.10.108:5005/model/train?save_to_default_model_directory=true&force_training=false',{
					method: 'post',
					body: JSON.stringify(data),
					headers: {
						"content-type": "application/json",
					},
					mode: 'no-cors',
				})
				.then(response => {
					// console.log(response)
					console.log('訓練完成!!')
					trainBtn.removeAttribute('disabled')
					trainBtn.innerText = 'Train'
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
		}
	})
}





