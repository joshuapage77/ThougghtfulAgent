const { loadModel } = require('gpt4all')
const { logger } = require('../utils/logger.js')
const { config } = require('../config/config.js')

let model = null


const load = async () => {
   if (!model) {
      logger.info('Loading GPT4All model...')
      model = await loadModel(config.chat.model, { 
         verbose: true, 
         device: 'gpu',
         modelPath: './models'
      })
      logger.info('GPT4All model loaded successfully')
   }
   return model
}

const checkModel = () => {
   if (!model) throw new Error('gpt4all model not initialized')
}

const status = async () => {
   try {
      checkModel()
      await model.generate('test', { maxTokens: 1 }) // Lightweight call
      return { status: 'ok' }
   } catch (e) {
      logger.error(e, 'GPT4All connection failed')
      return { status: 'error', error: e.message || 'Unknown error' }
   }
}

const completion = async (prompt) => {
   checkModel()
   return await model.generate(prompt, {
      maxTokens: 150,
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      repeatPenalty: 1.1,
      seed: Math.floor(Math.random() * 2**32)
    })
}

const dispose = () => {
   if (model) {
      logger.info('Disposing GPT4All model...')
      model.dispose()
      model = null
   }
}

module.exports = {
   load,
   status,
   dispose,
   completion
}