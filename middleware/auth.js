const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
const { JWT_SECRET } = require("../config/config")

const usersDB = path.join(__dirname, "../db/users.json")

function readUsers() {
  return JSON.parse(fs.readFileSync(usersDB))
}

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: "No token" })

  const token = header.split(" ")[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const users = readUsers()
    const user = users.find(u => u.username === payload.username)
    if (!user) return res.status(401).json({ error: "User not found" })

    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" })
  }
}
