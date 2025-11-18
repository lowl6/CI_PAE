module.exports = (err, req, res, next) => {
  console.error(err)
  res.status(500).json({ ok:false, error: err.message || 'Server Error' })
}