require("dotenv").config()

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "hazivault_dev_secret",
  DEFAULT_QUOTA_MB: 10240
}
