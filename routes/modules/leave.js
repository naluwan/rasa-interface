const express = require('express')
const router = express.Router()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.delete('/:leave_no', (req, res) => {
	const {leave_no} = req.params
	const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const errors = []

	request.query(`select * 
	from BOTFRONT_LEAVE_INFO 
	where LEAVE_NO = ${leave_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}
		result = result.recordset[0]
		// console.log(result)
		if(!result) errors.push({message: '查無此假別資訊!'})

		if(errors.length){
			request.query(`select a.LEAVE_NO, b.LEAVE_NAME, a.LEAVE_DES
      from BOTFRONT_LEAVE_INFO a
      left join BOTFRONT_ALL_LEAVE b
      on b.LEAVE_ID = a.LEAVE_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				const leaveInfo = result.recordset
				// console.log(positionResult)
				return res.render('leave', {leaveInfo, errors})
			})
		} else {
			request.query(`delete 
			from BOTFRONT_LEAVE_INFO 
			where LEAVE_NO = ${leave_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}

				return res.redirect('/leave')
			})
		}
	})
})

router.put('/:leave_no', (req, res) => {
  const {leave_no} = req.params
	const {LEAVE_DES} = req.body
	const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const errors = []
	request.query(`select *
	from BOTFRONT_LEAVE_INFO a
	where LEAVE_NO = ${leave_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const checkLeave = result.recordset[0]
		if(!checkLeave) errors.push({message: '查無假別資訊，請重新編輯!'})
		if(errors.length){
			request.query(`select a.LEAVE_NO, b.LEAVE_NAME, a.LEAVE_DES
      from BOTFRONT_LEAVE_INFO a
      left join BOTFRONT_ALL_LEAVE b
      on b.LEAVE_ID = a.LEAVE_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}

				const leaveInfo = result.recordset
				return res.render('leave', {leaveInfo, errors})
			})
		} else {
			request.input('des', sql.NVarChar(2000), LEAVE_DES)
			.query(`update BOTFRONT_LEAVE_INFO
			set LEAVE_DES = @des
			where LEAVE_NO = ${leave_no} and CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				res.redirect('/leave')
			})
		}
	})
})

router.get('/:leave_no/edit', (req, res) => {
  const {leave_no} = req.params
	const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const errors = []

	request.query(`select a.LEAVE_NO, b.LEAVE_NAME, a.LEAVE_DES
	from BOTFRONT_LEAVE_INFO a
	left join BOTFRONT_ALL_LEAVE b
	on a.LEAVE_NO = b.LEAVE_ID 
	where a.LEAVE_NO = ${leave_no} and a.CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		result = result.recordset[0]
		// console.log(result)
		if(!result) errors.push({message:'查無此假別資料!'})
		if(errors.length){
			request.query(`select a.LEAVE_NO, b.LEAVE_NAME, a.LEAVE_DES
      from BOTFRONT_LEAVE_INFO a
      left join BOTFRONT_ALL_LEAVE b
      on b.LEAVE_ID = a.LEAVE_NO
      where CPY_NO = '${cpyNo}'`, (err, result) => {
				if(err){
				console.log(err)
				return
				}
				const leaveInfo = result.recordset
				// console.log(positionResult)
				return res.render('leave', {leaveInfo, errors})
			})
		} else {
			return res.render('edit_leave', {result})
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
		request.query(`select a.LEAVE_ID, a.LEAVE_NAME 
    from BOTFRONT_ALL_LEAVE a 
    where not exists (select * 
    from BOTFRONT_LEAVE_INFO b 
    where  a.LEAVE_ID = b.LEAVE_NO 
    and b.CPY_NO = '${cpyNo}')`, (err, result) => {
			if(err){
			console.log(err)
			return
			}

			const category = result.recordset
			return res.render('new_leave', {errors, des, category})
		})
	}else{
		request.input('cpyNo', sql.NVarChar(30), cpyNo)
		.input('leave_no', sql.Int, category)
		.input('des', sql.NVarChar(2000), des)
		.query(`insert into BOTFRONT_LEAVE_INFO (CPY_NO, LEAVE_NO, LEAVE_DES) 
		values (@cpyNo, @leave_no, @des)`, (err, result) => {
			if(err){
			console.log(err)
			return
			}
			return res.redirect('/leave')
		})
	}
})

router.get('/new', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

	const request = new sql.Request(pool)
	const warning = []
	// 抓取未新增過的假別資料
	request.query(`select a.LEAVE_ID, a.LEAVE_NAME 
	from BOTFRONT_ALL_LEAVE a 
	where not exists (select * 
	from BOTFRONT_LEAVE_INFO b 
	where  a.LEAVE_ID = b.LEAVE_NO 
	and b.CPY_NO = '${cpyNo}')`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const category = result.recordset
		if(category.length == 0) warning.push({message:'目前沒有可新增的假別資訊!'})
		if(warning.length){
			return res.render('new_leave', {category, warning})
		}else{
			return res.render('new_leave', {category})
		}
	})
})

router.get('/', (req, res) => {
  const user = res.locals.user
	const cpyNo = user.CPY_ID

  const request = new sql.Request(pool)
	const warning = []
	request.query(`select a.LEAVE_NO, b.LEAVE_NAME, a.LEAVE_DES
	from BOTFRONT_LEAVE_INFO a
	left join BOTFRONT_ALL_LEAVE b
	on b.LEAVE_ID = a.LEAVE_NO
	where CPY_NO = '${cpyNo}'`, (err, result) => {
		if(err){
		console.log(err)
		return
		}

		const leaveInfo = result.recordset
		// console.log(positionResult)
		if(leaveInfo.length == 0) warning.push({message: '還未新增假別資訊，請拉到下方點選按鈕新增假別資訊!!'})
		return res.render('leave', {leaveInfo, warning})
	})
})

module.exports = router