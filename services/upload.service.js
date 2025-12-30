const fs = require("fs")
const path = require("path")

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function saveChunk(tempPath, chunkDir, index) {
  ensureDir(chunkDir)
  const dest = path.join(chunkDir, String(index))
  fs.renameSync(tempPath, dest)
}

function mergeChunks(chunkDir, outFile) {
  const parts = fs.readdirSync(chunkDir)
    .map(n => Number(n))
    .sort((a, b) => a - b)

  ensureDir(path.dirname(outFile))
  const ws = fs.createWriteStream(outFile)

  for (const idx of parts) {
    const p = path.join(chunkDir, String(idx))
    ws.write(fs.readFileSync(p))
  }

  ws.end()
  fs.rmSync(chunkDir, { recursive: true, force: true })
}

module.exports = {
  ensureDir,
  saveChunk,
  mergeChunks
}
