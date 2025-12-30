const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const fs = require("fs")
const path = require("path")

const { detectStorages, ensureUserRoot } = require("../services/storage.service")

const usersDB = path.join(__dirname, "../db/users.json")

function readUsers() {
  return JSON.parse(fs.readFileSync(usersDB))
}
function writeUsers(d) {
  fs.writeFileSync(usersDB, JSON.stringify(d, null, 2))
}

/**
 * GET /api/storage/list
 * List semua storage tersedia
 */
router.get("/list", auth, (req, res) => {
  const storages = detectStorages()
  res.json({ storages })
})

/**
 * POST /api/storage/select
 * Body: { path: "/mnt/usb1" }
 */
router.post("/select", auth, (req, res) => {
  const { path: storagePath } = req.body
  if (!storagePath) {
    return res.status(400).json({ error: "Storage path required" })
  }

  if (!fs.existsSync(storagePath)) {
    return res.status(400).json({ error: "Storage not found" })
  }

  const users = readUsers()
  const user = users.find(u => u.username === req.user.username)
  if (!user) return res.status(404).json({ error: "User not found" })

  user.storage = storagePath
  ensureUserRoot(storagePath, user.username)
  writeUsers(users)

  res.json({ success: true, storage: storagePath })
})

module.exports = router
