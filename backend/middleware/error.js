module.exports = (err, req, res, next) => {
  console.log(err)
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: err.message })
    return
  }

  err.status = err.status || 500
  res.status(err.status).json({ error: err.message })
}