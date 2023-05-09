const router = require('express').Router()
const linksController = require('./links.controller')

router.post('/', linksController.createOneTimeLink)
router.get('/:id', linksController.useOneTimeLink)

module.exports = router
