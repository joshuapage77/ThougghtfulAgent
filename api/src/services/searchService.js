// vector and indexed searching - currently using opensearch
const {
  searchAndReturnTopResults,
  bruteForceKnnScript
} = require("../wrappers/opensearch.js")
const { config } = require("../config/config.js")
const { logger } = require("../utils/logger.js")

const searchQa = async (messageEmbedding) => {
  const qaTemplate = [
    bruteForceKnnScript('questionEmbedding', messageEmbedding),
    bruteForceKnnScript('answerEmbedding', messageEmbedding)
  ]
  const results = await searchAndReturnTopResults(config.openSearch.indexes.qa, config.openSearch.maxContextQuestions, qaTemplate)
  const filteredResults = results.filter(doc => doc._score >= config.openSearch.thresholds.messageMatch)
  return filteredResults.map(obj => ({ answer: obj._source.answer, question: obj._source.question }))
}

module.exports = {
  searchQa
}