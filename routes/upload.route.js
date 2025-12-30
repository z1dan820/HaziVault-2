const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { v4: uuid } = require("uuid")

const auth = require("../middleware/auth")
const quota = require("../middleware/quota")
const storageResolver = require("../middleware/storage-resolver")

const { saveChunk, mergeChunks, ensureDir } = require("../services/upload.service")

const TEMP = path.join(__dirname, "../storage/temp")
ensureDir(TEMP)

const upload = multer({ dest: TEMP })

/**
 * POST /api/upload/start
 * -> return uploadId
 */
router.post("/start", auth, (req, res) => {
  const uploadId = uuid()
  res.json({ uploadId })
})

/**
 * POST /api/upload/chunk/:uploadId
 * FormData:
 * - chunk (file)
 * - index (number)
 */
router.post(
  "/chunk/:uploadId",
  auth,
  storageResolver,
  quota,
  upload.single("chunk"),
  (req, res) => {
    const { uploadId } = req.params
    const { index } = req.body
    if (!req.file) return res.status(400).json({ error: "No chunk" })

    const chunkDir = path.join(TEMP, uploadId)
    saveChunk(req.file.path, chunkDir, index)

    res.json({ success: true })
  }
)

/**
 * POST /api/upload/finish/:uploadId
 * Body: { filename, dir? }
 */
router.post(
  "/finish/:uploadId",
  auth,
  storageResolver,
  quota,
  (req, res) => {
    const { uploadId } = req.params
    const { filename, dir = "" } = req.body
    if (!filename) return res.status(400).json({ error: "Filename required" })

    const chunkDir = path.join(TEMP, uploadId)
    if (!fs.existsSync(chunkDir)) {
      return res.status(400).json({ error: "Upload not found" })
    }

    const outFile = path.join(req.userStorage, dir, filename)
    mergeChunks(chunkDir, outFile)

    res.json({ success: true })
  }
)

module.exports = router
