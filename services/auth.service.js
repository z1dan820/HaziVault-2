const fs = require("fs")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { v4: uuid } = require("uuid")
const { JWT_SECRET, DEFAULT_QUOTA_MB } = require("../config/config")

const usersDB = path.join(__dirname, "../db/users.json")

function readUsers() {
  return JSON.parse(fs.readFileSync(usersDB))
}

function writeUsers(data) {
  fs.writeFileSync(usersDB, JSON.stringify(data, null, 2))
}

async function register(username, password) {
  const users = readUsers()

  if (users.find(u => u.username === username)) {
    throw new Error("User already exists")
  }

  const hash = await bcrypt.hash(password, 10)

  const user = {
    id: uuid(),
    username,
    password: hash,
    storage: null,
    quotaMB: DEFAULT_QUOTA_MB,
    createdAt: Date.now()
  }

  users.push(user)
  writeUsers(users)

  return { username }
}

async function login(username, password) {
  const users = readUsers()
  const user = users.find(u => u.username === username)

  if (!user) throw new Error("Invalid credentials")

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new Error("Invalid credentials")

  const token = jwt.sign(
    { username: user.username },
    JWT_SECRET,
    { expiresIn: "12h" }
  )

  return { token }
}

module.exports = {
  register,
  login
}
