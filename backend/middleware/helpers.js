exports.logger = function (req, res, next) {
  console.log(`-------------------------------------`)
  console.log(req.method, req.path)
  next()
}
