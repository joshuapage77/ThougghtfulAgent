const Koa = require('koa')
const Router = require("koa-router")
const cors = require('@koa/cors')
const responseFormatter = require('./middleware/responseFormatter')
const bodyParser = require('koa-bodyparser')
const { logger } = require('./utils/logger')
const llm = require('./wrappers/llm')
const { config } = require('./config/config')
const embeddings = require('./wrappers/embeddings')
// require routes
const chatHandler = require("./handlers/chatHandler")
const statusHandler = require("./handlers/statusHandler")

const app = new Koa()
const router = new Router()

app.use(cors())
app.use(bodyParser())

const standardMiddleware = [responseFormatter]

// Route Definitions
router.get('/status', ...standardMiddleware, statusHandler.checkAll)
router.post('/chat', ...standardMiddleware, chatHandler.init)     // initialize new chat, get conversation Id
router.get('/chat', ...standardMiddleware, chatHandler.list)       // list all conversations
router.post('/chat/:convId', ...standardMiddleware, chatHandler.send)  // chat on a specific conversation
router.get('/chat/:convId', ...standardMiddleware, chatHandler.history)  // list recent Message history

app.use(router.routes()).use(router.allowedMethods())

// Log registered routes on startup
const logRoutes = () => {
  const routes = router.stack.map(layer => `${layer.methods.join(',')} ${layer.path}`)
  logger.info('Registered Routes')
  routes.map((route) => {
    logger.info('   ' + route)
  })
}

llm.load().then(() => (logger.info('LLM model loaded and ready')))
embeddings.load().then(() => (logger.info('Embedding model loaded and ready')))
config.initialize().then(() => (logger.info('Async config complete')))

const shutdown = () => {
  logger.info('Shutting down server...')
  llm.dispose() // Dispose of the model
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logRoutes()
})
