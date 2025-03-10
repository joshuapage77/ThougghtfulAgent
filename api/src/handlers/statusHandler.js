const { status: checkPostgres } = require('../wrappers/postgres')
const { status: checkOpensearch } = require('../wrappers/opensearch')
const llm = require('../wrappers/llm')
const { status: checkEmbedding } = require('../wrappers/embeddings')
const { logger } = require('../utils/logger')

exports.checkAll = async (ctx) => {
   const statusObj = {}
   try {
      statusObj.postgres = await checkPostgres()
      statusObj.opensearch = await checkOpensearch()
      statusObj.llm = await llm.status()
      statusObj.embedding = await checkEmbedding()
   } catch (e) {
      logger.error('unable to obtain status', e)
      ctx.status = 500
      ctx.error = 'Unable to obtain status'
      return
   }
   ctx.status = 200
   ctx.body = statusObj
}
