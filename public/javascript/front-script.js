const messageBlock = document.querySelector('#messageBlock')
const csTrainBtn = document.querySelector('.cs-train-btn')
const jhTrainBtn = document.querySelector('.jh-train-btn')
const questionDes = document.querySelector('.question-description')

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
			jhTrainBtn.setAttribute('disabled', '')
			jhTrainBtn.innerHTML = '<i class="fas fa-spinner fast-spin fa-2x"></i>'
			
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
						messageBlock.innerHTML = `
						<div class="alert alert-success alert-dismissible fade show" role="alert">
							訓練完成
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






