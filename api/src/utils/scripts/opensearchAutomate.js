/**
 * Executed by docker container opensearch-qa-init
 * Creates index and loads data. If the number of records do not match the source data, the index is rebuilt
 */
const fs = require('fs')
const path = require('path')
const { Client } = require("@opensearch-project/opensearch")
const axios = require('axios')
const { config } = require("../../config/config.js")
const isDockerRunning = fs.existsSync('/.dockerenv')
const opensearchNode1Host = isDockerRunning ? 'http://opensearch-qa-1' : 'http://localhost'
const opensearchDashHost = isDockerRunning ? 'http://opensearch-qa-dashboards' : 'http://localhost'
const qaData = require('../../../migrations/opensearch/data/thoughtfulqa.json')
const { getEmbedding } = require('../../wrappers/embeddings.js')
const { parallelPrep, parallelAssignReturnErrors } = require('../../utils/promiseHelper.js')
const { logger } = require('../../utils/logger.js')
const embeddings = require('../../wrappers/embeddings')

const qaIndexFile = path.resolve(__dirname, '../../../migrations/opensearch/templates/qa-index.json')

const client = new Client({
  node: `${opensearchNode1Host}:${config.openSearch.port}`
})

const indexData = async (indexName) => {
  try {
    for (const { question, answer } of qaData.questions) {
      const results = {}
      const promises = [
        parallelPrep(results, 'questionEmbedding', getEmbedding(question)),
        parallelPrep(results, 'answerEmbedding', getEmbedding(answer))
      ]
      const errors = await parallelAssignReturnErrors(promises)
      if (errors.length > 0) {
        errors.forEach(error => logger.error({ error }, 'error getting embeddings'))
        throw new Error('unmable to get embeddings')
      }
      await client.index({
        index: indexName,
        body: {
          question,
          questionEmbedding: results.questionEmbedding,
          answer,
          answerEmbedding: results.answerEmbedding
        }
      })

      logger.info(`Indexed question: ${question}`)
    }
    logger.info('Indexing complete')
  } catch (e) {
    logger.error(e, 'Failed to index questions')
  }
}

const createIndexPattern = async () => {
  try {
    await axios.post(`${opensearchDashHost}:5601/api/saved_objects/index-pattern/${config.openSearch.indexes.qa}-pattern`, {
      attributes: {
        title: config.openSearch.indexes.qa,
      }
    }, {
      headers: { 'osd-xsrf': 'true' }
    })

    console.log('Index pattern created successfully')
  } catch (e) {
    console.error('Failed to create index pattern:', e.response ? e.response.data : e.message)
  }
}

  ; (async () => {
    try {
      await embeddings.load()
      logger.info('Embedding model loaded and ready')

      const indexDef = JSON.parse(fs.readFileSync(qaIndexFile, 'utf8'))
      if (!indexDef.index || !indexDef.body) throw new Error(`Invalid index template: ${qaIndexFile}`)

      const indexExists = !!(await client.indices.exists({ index: indexDef.index })).body
      const needsUpdate = !indexExists || (await client.count({ index: indexDef.index })).body.count !== qaData.questions.length

      if (needsUpdate) {
        if (indexExists) await client.indices.delete({ index: indexDef.index })
        await client.indices.create(indexDef)
        await createIndexPattern() // not needed, just a convience if debugging with dashboard
        await indexData(indexDef.index)
      }
    } catch (e) {
      console.error('Unexpected error:', e)
      process.exit(1)
    }
  })()