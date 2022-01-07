const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.delete('/:subsidy_no', (req, res) => {
	const {subsidy_no} = req.params
	const user = res.locals.user
	const cpyNo = user.CPY_ID


	const request = new sql.Request(pool)
	const errors = []

	request.query(`select * 
	from BOTFRONT_SUBSIDY_INFO 
	where SUBSIDY_NO = ${subsidy_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}
		result = result.recordset[0]
		// console.log(result)
		if(!result) errors.push({message: '查無此補助津貼資訊!'})

		if(errors.length){
			request.query(`select a.SUBSIDY_NO, b.SUBSIDY_NAME, a.SUBSIDY_DES
      from BOTFRONT_SUBSIDY_INFO a
      left join BOTFRONT_ALL_SUBSIDY b
      on b.SUBSIDY_ID = a.SUBSIDY_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				const subsidyInfo = result.recordset
				// console.log(positionResult)
				return res.render('subsidy', {subsidyInfo, errors})
			})
		} else {
			request.query(`delete 
			from BOTFRONT_SUBSIDY_INFO 
			where SUBSIDY_NO = ${subsidy_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}

				return res.redirect('/subsidy')
			})
		}
	})
})

router.put('/:subsidy_no', (req, res) => {
  const {subsidy_no} = req.params
	const {SUBSIDY_DES} = req.body
	const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const errors = []
	request.query(`select *
	from BOTFRONT_SUBSIDY_INFO a
	where SUBSIDY_NO = ${subsidy_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const checkSubsidy = result.recordset[0]
		if(!checkSubsidy) errors.push({message: '查無補助津貼缺資訊，請重新編輯!'})
		if(errors.length){
			request.query(`select a.SUBSIDY_NO, b.SUBSIDY_NAME, a.SUBSIDY_DES
      from BOTFRONT_SUBSIDY_INFO a
      left join BOTFRONT_ALL_SUBSIDY b
      on b.SUBSIDY_ID = a.SUBSIDY_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}

				const subsidyInfo = result.recordset
				return res.render('subsidy', {subsidyInfo, errors})
			})
		} else {
			request.input('des', sql.NVarChar(2000), SUBSIDY_DES)
			.query(`update BOTFRONT_SUBSIDY_INFO
			set SUBSIDY_DES = @des
			where SUBSIDY_NO = ${subsidy_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				res.redirect('/subsidy')
			})
		}
	})
})

router.get('/:subsidy_no/edit', (req, res) => {
  const {subsidy_no} = req.params
	const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const errors = []

	request.query(`select a.SUBSIDY_NO, b.SUBSIDY_NAME, a.SUBSIDY_DES
	from BOTFRONT_SUBSIDY_INFO a
	left join BOTFRONT_ALL_SUBSIDY b
	on a.SUBSIDY_NO = b.SUBSIDY_ID 
	where a.SUBSIDY_NO = ${subsidy_no} and a.CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		result = result.recordset[0]
		// console.log(result)
		if(!result) errors.push({message:'查無此補助津貼資料!'})
		if(errors.length){
			request.query(`select a.SUBSIDY_NO, b.SUBSIDY_NAME, a.SUBSIDY_DES
      from BOTFRONT_SUBSIDY_INFO a
      left join BOTFRONT_ALL_SUBSIDY b
      on b.SUBSIDY_ID = a.SUBSIDY_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				const subsidyInfo = result.recordset
				// console.log(positionResult)
				return res.render('subsidy', {subsidyInfo, errors})
			})
		} else {
			return res.render('edit_subsidy', {result})
		}
	})
})

router.post('/', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID
	const {category, des} = req.body

	const request = new sql.Request(pool)
	const errors = []

	if(!category || category == '' || !des){
	errors.push({message: '所有欄位都是必填的!'})
	}

	if(errors.length){
		request.query(`select a.SUBSIDY_ID, a.SUBSIDY_NAME 
    from BOTFRONT_ALL_SUBSIDY a 
    where not exists (select * 
    from BOTFRONT_SUBSIDY_INFO b 
    where  a.SUBSIDY_ID = b.SUBSIDY_NO 
    and b.CPY_NO = '${cpyNo}')`, (err, result) => {
			if(err){
			console.log(err)
			return
			}

			const category = result.recordset
			return res.render('new_subsidy', {errors, des, category})
		})
	}else{
		request.input('cpyNo', sql.NVarChar(30), cpyNo)
		.input('subsidy_no', sql.Int, category)
		.input('des', sql.NVarChar(2000), des)
		.query(`insert into BOTFRONT_SUBSIDY_INFO (CPY_NO, SUBSIDY_NO, SUBSIDY_DES) 
		values (@cpyNo, @subsidy_no, @des)`, (err, result) => {
			if(err){
			console.log(err)
			return
			}
			return res.redirect('/subsidy')
		})
	}
})

router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const warning = []
	// 抓取未新增過的補助資料
	request.query(`select a.SUBSIDY_ID, a.SUBSIDY_NAME 
	from BOTFRONT_ALL_SUBSIDY a 
	where not exists (select * 
	from BOTFRONT_SUBSIDY_INFO b 
	where  a.SUBSIDY_ID = b.SUBSIDY_NO 
	and b.CPY_NO = '${cpyNo}')`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const category = result.recordset
		if(category.length == 0) warning.push({message:'目前沒有可新增的補助津貼!'})
		if(warning.length){
			return res.render('new_subsidy', {category, warning})
		}else{
			return res.render('new_subsidy', {category})
		}
	})
})

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const request = new sql.Request(pool)
	const warning = []
	request.query(`select a.SUBSIDY_NO, b.SUBSIDY_NAME, a.SUBSIDY_DES
	from BOTFRONT_SUBSIDY_INFO a
	left join BOTFRONT_ALL_SUBSIDY b
	on b.SUBSIDY_ID = a.SUBSIDY_NO
	where CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const subsidyInfo = result.recordset
		// console.log(positionResult)
		if(subsidyInfo.length == 0) warning.push({message: '還未新增補助津貼資訊，請拉到下方點選按鈕新增補助津貼資訊!!'})
		return res.render('subsidy', {subsidyInfo, warning})
	})
})

module.exports = router