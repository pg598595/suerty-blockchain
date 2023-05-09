require("dotenv").config()
const express = require('express')
const cors = require('cors');
const app = express()
const errorHandler  = require('./middleware/error')
const { logger } = require('./middleware/helpers')
const documentsRouter = require('./documents/documents.routes')
const linksRouter = require('./links/links.routes')
const comparisonRouter = require('./comparison/comparison.routes')
const adminRouter = require('./admin/admin.routes')
const decodeToken = require('./middleware/auth')

app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(cors({
  origin: "http://localhost:3000", // allow to server to accept request from client
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
  credentials: true, // allow session cookie from browser to pass through
}));

app.use(logger)
app.use(decodeToken)

app.get('/', (req, res) => res.status(200).send('Hey there!'))
app.use('/documents', documentsRouter)
app.use('/links', linksRouter)
app.use('/comparison', comparisonRouter)
app.use('/admin', adminRouter)

app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
