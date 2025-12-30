const path = require("path")

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase()

  if ([".jpg",".jpeg",".png",".gif",".webp"].includes(ext)) return "image"
  if ([".pdf"].includes(ext)) return "pdf"
  if ([".mp3",".ogg",".wav"].includes(ext)) return "audio"
  if ([".mp4",".webm"].includes(ext)) return "video"

  return "other"
}

module.exports = { getFileType }
