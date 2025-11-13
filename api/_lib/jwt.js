const jwt = require('jsonwebtoken')

function sign(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn })
}

function verify(token, secret) {
  try { return jwt.verify(token, secret) } catch { return null }
}

module.exports = { sign, verify }
