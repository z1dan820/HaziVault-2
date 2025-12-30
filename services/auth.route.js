const express = require("express")
const router = express.Router()
const rateLimit = require("../middleware/ratelimit")
const authService = require("../services/auth.service")

router.post("/register", rateLimit, async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Invalid input" })
  }

  try {
    await authService.register(username, password)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post("/login", rateLimit, async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Invalid input" })
  }

  try {
    const result = await authService.login(username, password)
    res.json(result)
  } catch (e) {
    res.status(401).json({ error: e.message })
  }
})

module.exports = router
