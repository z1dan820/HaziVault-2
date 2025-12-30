const fs = require("fs")

function detectStorages() {
  const mounts = fs.readFileSync("/proc/mounts", "utf8")
  return mounts
    .split("\n")
    .filter(l => l.includes("/dev/"))
    .map(l => l.split(" ")[1])
    .filter(p =>
      p === "/" ||
      p.startsWith("/mnt") ||
      p.startsWith("/media")
    )
}

module.exports = { detectStorages }
