const fs = require("fs")
const path = require("path")

module.exports = function storageResolver(req, res, next) {
  const user = req.user

  // fallback aman
  let storageRoot = user.storage || "/"

  if (!fs.existsSync(storageRoot)) {
    storageRoot = "/"
  }

  const userRoot = path.join(storageRoot, "hazivault", user.username)
  fs.mkdirSync(userRoot, { recursive: true })

  req.userStorage = userRoot
  next()
}
