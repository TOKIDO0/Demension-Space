const crypto = require('crypto')

function encryptJson(obj, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(obj))
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return { iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('base64') }
}

function decryptJson(bundle, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(bundle.iv, 'hex')
  const tag = Buffer.from(bundle.tag, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(Buffer.from(bundle.data, 'base64')), decipher.final()])
  return JSON.parse(dec.toString())
}

module.exports = { encryptJson, decryptJson }
