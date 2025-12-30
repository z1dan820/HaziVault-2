const express = require("express")
const cors = require("cors")
const { PORT } = require("./config/config")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static("public"))

app.use("/api/auth", require("./routes/auth.route"))
app.use("/api/storage", require("./routes/storage.route"))
app.use("/api/files", require("./routes/file.route"))
app.use("/api/upload", require("./routes/upload.route"))
app.use("/api/share", require("./routes/share.route"))

app.listen(PORT, () =>
  console.log("🔥 HaziVault running on port", PORT)
)
