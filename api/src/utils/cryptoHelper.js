const crypto = require('crypto')

const sortObject = (obj) => {
  if (Array.isArray(obj)) return obj.map(sortObject) // Recursively sort arrays
  if (obj && typeof obj === 'object')
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(obj[key]) // Recursively sort nested objects
        return acc
      }, {})
  return obj // Return primitive values unchanged
}

const generateSHA256 = (obj) => {
  const hash = crypto.createHash('sha256')
  const jsonString = JSON.stringify(sortObject(obj)) // Ensure consistent order
  hash.update(jsonString)
  return hash.digest('hex')
}


module.exports = {
   generateSHA256
}