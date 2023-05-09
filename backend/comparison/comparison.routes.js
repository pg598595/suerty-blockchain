const router = require('express').Router()
const comparisonController = require('./comparison.controller')

router.post('/', comparisonController.compareTwoDocs)
router.post('/', comparisonController.compareOneDoc)

module.exports = router
