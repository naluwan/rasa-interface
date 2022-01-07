const { request } = require('express')
const express = require('express')
const router = express.Router()
const app = express()

const sql = require('mssql')
const pool = require('../../config/connectPool')

router.put('/roleFilter', (req, res) => {
	const {roleFilter} = req.body
	const request = new sql.Request(pool)

	request.query(`update BOTFRONT_USERS_INFO
	set WHICH_ROLE = '${roleFilter}'
	where CPY_ID = '0'`, (err, result) => {
		if(err){
			console.log(err)
			return
		}
		return res.redirect('/')
	})
})

router.get('/', (req, res) => {
	const isAdmin = res.locals.isAdmin
	const whichRole = res.locals.whichRole
	const request = new sql.Request(pool)
	const user = res.locals.user

	if(!user){
		return res.redirect('/users/login')
	}

	if(isAdmin){
		if(whichRole == 'hire'){
			request.query(`select *
			from BOTFRONT_ALL_POSITION
			where TRAINED = 0 or HAD_READ = 0`, (err, result) => {
				if(err){
					console.log(err)
					return
				}
				const position = result.recordset
				const notTrained = position.filter(item => item.TRAINED == 0)
				const notRead = position.filter(item => item.HAD_READ == 0)
				return res.render('index', {notTrained: notTrained.length, notRead: notRead.length})
			})
		}

		if(whichRole == 'hr'){
			request.query(`select *
			from BF_CS_FUNCTION
			where TRAINED = 0`, (err, result) => {
				if(err){
					console.log(err)
					return
				}
				const functionInfo = result.recordset
				const trainFunction = functionInfo.filter(item => item.TRAINED == 0)

				request.query(`select *
				from BF_CS_QUESTION
				where TRAINED = 0`, (err, result) => {
					if(err){
						console.log(err)
						return
					}
					const questionInfo = result.recordset
					const trainQuestion = questionInfo.filter(item => item.TRAINED == 0)
					return res.render('index', {trainFunction: trainFunction.length, trainQuestion: trainQuestion.length})
				})
			})
		}
	}else{
		request.query(`select * 
		from BF_CS_FUNCTION
		where TRAINED = 1
		and SHOW = 1`, (err, result) => {
			if(err){
				console.log(err)
				return
			}
			const functionInfo = result.recordset
			const trainFunction = functionInfo.length

			request.query(`select *
			from BF_CS_QUESTION
			where TRAINED = 1
			and SHOW = 1`, (err, result) => {
				if(err){
					console.log(err)
					return
				}
				const questionInfo = result.recordset
				const trainQuestion = questionInfo.length
				return res.render('index', {trainQuestion, trainFunction})
			})
		})
	}
})

module.exports = router