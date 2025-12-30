const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")

const auth = require("../middleware/auth")
const storageResolver = require("../middleware/storage-resolver")
const { getFileType } = require("../services/preview.service")

/**
 * GET /api/files
 * list file user
 */
router.get("/", auth, storageResolver, (req, res) => {
  const list = fs.readdirSync(req.userStorage)
  res.json(list)
})

/**
 * GET /api/files/download?name=
 */
router.get("/download", auth, storageResolver, (req, res) => {
  const name = path.basename(req.query.name || "")
  const file = path.join(req.userStorage, name)

  if (!fs.existsSync(file)) return res.status(404).end()
  res.download(file)
})

/**
 * GET /api/files/preview?name=
 */
router.get("/preview", auth, storageResolver, (req, res) => {
  const name = path.basename(req.query.name || "")
  const file = path.join(req.userStorage, name)

  if (!fs.existsSync(file)) return res.status(404).end()

  const type = getFileType(name)
  res.json({ type, url: "/api/files/raw?name=" + name })
})

/**
 * GET /api/files/raw?name=
 * serve raw file for <img>, <video>, <iframe>
 */
router.get("/raw", auth, storageResolver, (req, res) => {
  const name = path.basename(req.query.name || "")
  const file = path.join(req.userStorage, name)

  if (!fs.existsSync(file)) return res.status(404).end()
  res.sendFile(file)
})

module.exports = router
