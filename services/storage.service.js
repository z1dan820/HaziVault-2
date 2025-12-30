const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

function parseDf() {
  const out = execSync("df -kP").toString().split("\n")
  return out.slice(1).map(l => {
    const p = l.trim().split(/\s+/)
    if (p.length < 6) return null
    return {
      filesystem: p[0],
      sizeKB: Number(p[1]),
      usedKB: Number(p[2]),
      availKB: Number(p[3]),
      mount: p[5]
    }
  }).filter(Boolean)
}

function detectStorages() {
  const mounts = parseDf()
  return mounts
    .filter(m =>
      m.mount === "/" ||
      m.mount.startsWith("/mnt") ||
      m.mount.startsWith("/media")
    )
    .map(m => ({
      path: m.mount,
      totalGB: (m.sizeKB / 1024 / 1024).toFixed(1),
      freeGB: (m.availKB / 1024 / 1024).toFixed(1)
    }))
}

function ensureUserRoot(storagePath, username) {
  const userRoot = path.join(storagePath, "hazivault", username)
  fs.mkdirSync(userRoot, { recursive: true })
  return userRoot
}

module.exports = {
  detectStorages,
  ensureUserRoot
}
