const fs = require("fs")
const path = require("path")

function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).reduce((total, file) => {
    const p = path.join(dir, file)
    const stat = fs.statSync(p)
    return total + (stat.isDirectory() ? dirSize(p) : stat.size)
  }, 0)
}

module.exports = function quota(req, res, next) {
  const user = req.user
  const base = path.join(user.storage, "hazivault", user.username)

  const usedBytes = dirSize(base)
  const limitBytes = user.quotaMB * 1024 * 1024

  if (usedBytes >= limitBytes) {
    return res.status(403).json({ error: "Quota exceeded" })
  }

  req.usedBytes = usedBytes
  next()
}
