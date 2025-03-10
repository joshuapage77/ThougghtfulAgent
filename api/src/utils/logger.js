const pino = require("pino")
const fs = require('fs')
const path = require('path')

const isProd = process.env.NODE_ENV === "production"

// @ts-ignore
const logger = pino(
  isProd
    ? { level: "info" } // JSON logging for AWS
    : { level: "debug", transport: { target: "pino-pretty", options: { colorize: true } } }
)
const dumpToFile = (message, object, filename = 'temp-dumpped-runtime.data') => {
  try {
    const filePath = path.resolve(filename)
    const separator = '='.repeat(100) + '\n'
    const timestamp = new Date().toISOString()
    const formattedObject = JSON.stringify(object, (key, value) => {
      if (Array.isArray(value) && value.length > 10 && typeof value[0] === 'number') {
        return JSON.stringify(value).replace(/\s+/g, '')
      }
      return value
    }, 2).replace(/"\[/g, '[').replace(/\]"/g, ']')

    const output = `${separator}${timestamp}\t${message}\n${separator}${formattedObject}\n`
    fs.writeFileSync(filePath, output, { flag: 'a' })
  } catch (e) {
    console.error('Error writing to file:', e)
  }
}

dumpToFile("NEW APPLICATION START", {}) //TODO: remove when I'm done most development (debugging tool)

module.exports = { 
  logger,
  dumpToFile
}