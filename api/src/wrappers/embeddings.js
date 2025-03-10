const { pipeline } = require('@xenova/transformers')
const { logger } = require('../utils/logger.js')

let model = null

const load = async () => {
   if (!model) {
      logger.info('Loading transformers.js model...')
      model = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2')
      logger.info('Transformers.js model loaded successfully')
   }
   return model
}

const checkModel = () => {
   if (!model) throw new Error('Transformers model not initialized')
}

const status = async () => {
   try {
      checkModel()
      const testEmbedding = await model('test', { pooling: 'mean', normalize: true })
      return testEmbedding ? { status: 'ok' } : { status: 'error', error: 'Embedding failed' }
   } catch (e) {
      logger.error(e, 'Transformers.js connection failed')
      return { status: 'error', error: e.message || 'Unknown error' }
   }
}

const getEmbedding = async (text) => {
   checkModel()
   const raw = await model(text, { pooling: 'mean', normalize: true })
   return Array.from(Object.values(raw.data))
}

module.exports = {
   load,
   status,
   getEmbedding
}
