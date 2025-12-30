const LIMIT = 120 // req
const WINDOW = 60 * 1000 // 1 menit
const map = new Map()

module.exports = function rateLimit(req, res, next) {
  const ip = req.ip
  const now = Date.now()

  if (!map.has(ip)) {
    map.set(ip, { count: 1, time: now })
    return next()
  }

  const data = map.get(ip)
  if (now - data.time > WINDOW) {
    map.set(ip, { count: 1, time: now })
    return next()
  }

  data.count++
  if (data.count > LIMIT) {
    return res.status(429).json({ error: "Too many requests" })
  }

  next()
}
