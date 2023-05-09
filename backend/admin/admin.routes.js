const router = require('express').Router()
const adminController = require('./admin.controller')

router.post('/', adminController.addAdmin)

module.exports = router
