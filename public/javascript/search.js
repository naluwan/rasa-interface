const searchInput = document.querySelector('#search')

if(searchInput){
	searchInput.addEventListener('focus', e => {
		const target = e.target
	
		if(target.matches('#search')){
			document.querySelector('#search').value = ''
		}
	})
}

