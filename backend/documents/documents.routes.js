const router = require('express').Router()
const documentsController = require('./documents.controller')


router.post('/:uuid', documentsController.checkOwner, documentsController.addDocument)
router.post('/:uuid/key', documentsController.getKey)

module.exports = router
