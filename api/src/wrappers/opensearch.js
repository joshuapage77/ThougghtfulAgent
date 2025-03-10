const { Client } = require("@opensearch-project/opensearch")
const { config } = require("../config/config.js")
const { logger, dumpToFile } = require("../utils/logger.js")
const { generateSHA256 } = require("../utils/cryptoHelper.js")

const client = new Client({
  node: `${config.openSearch.host}:${config.openSearch.port}`
})

const status = async () => {
  try {
    await client.ping()
    return { status: "ok" }
  } catch (e) {
    logger.error(e, 'OpenSearch connection failed')
    return { status: "error", error: e.message || "Unknown error" }
  }
}

const indexDocument = async (indexName, document) => {
  const newDoc = {
    ...document,
    id: document.id || generateSHA256(document)
  }
  await client.index({
    index: indexName,
    id: document.id,
    body: document,
    refresh: true // immediately searchable
  })
  return newDoc.id
}

const bulkIndexDocuments = async (indexName, documents) => {
  const body = documents.flatMap(doc => {
    const newDoc = {
      ...doc,
      id: generateSHA256(doc)
    }
    return [{ index: { _index: indexName, _id: newDoc.id } }, newDoc]
  })
  
  await client.bulk({ refresh: true, body })
  return body.filter((v,i) => i % 2 !== 0)
}

const deleteDocument = async (indexName, document) => {
  await client.index({
    index: indexName,
    id: document.id,
    body: document,
    refresh: true // immediately searchable
  })
}

// Documents need to have a 'created_on' or sort field needs to be specified
const deleteAllButNewest = async (indexName, keepNumber, sortField = 'created_on') => {
  const sortObj = {}
  sortObj[sortField] = 'desc'

  // Find n newest documents
  const { body } = await client.search({
    index: indexName,
    body: {
      size: keepNumber,
      sort: [sortObj],
      _source: false,
      query: { match_all: {} }
    }
  })
  // get Id's of top 10
  const top10Ids = body.hits.hits.map(hit => hit._id)
  // kill the rest
  await client.deleteByQuery({
    index: indexName,
    body: {
      query: {
        bool: {
          must_not: {
            ids: { values: top10Ids }
          }
        }
      }
    }
  })
}

const queryKnn = (field, value) => {
  const query = { knn: {} }

  query.knn[field] = {
    vector: value,
    k: config.openSearch.matchingDocuments
  }
  return query
}

const bruteForceKnnScript = (field, value) => (
  {
    script_score: {
      query: { "match_all": {} },
      script: {
        source: `1 / (1 + l2Squared(params.query_vector, doc['${field}']))`,
        params: { query_vector: value }
      }
    }
  }
)

const queryKnnScript = (field, value) => ({
  script_score: {
    query: {
      match_all: {}
    },
    script: {
      source: 'knn_score',
      lang: 'knn',
      params: {
        field: field,
        query_value: value,
        space_type: 'l2'
      }
    }
  }
})

const queryMatch = (field, value) => {
  const query = {
    match: {}
  }

  query.match[field] = value
  return query
}

const searchAndReturnTopResults = async (indexName, topN, queries) => {
  const promises = queries.map((query) => {
    const searchParams = getSearchParameters(indexName, query)
    return client.search(searchParams)
  })
  const results = await Promise.allSettled(promises)

  const fulfilled = []
  const rejected = []

  for (const r of results)
    if (r.status === 'fulfilled') fulfilled.push(r.value)
    else rejected.push(r.reason)

  if (rejected.length) {
    logger.error('Some failed searches in searchAndReturnTopResults')
    dumpToFile('Rejected Searches', rejected)
  }
  return mergeTopResults(topN, fulfilled)
}

//-------------------------------------------------------------

const mergeTopResults = (topN, results) => {
  const mergedResults = new Map()

  results.forEach((result) => {
    let hits
    if (result.body.hits.hits) hits = result.body.hits.hits
    for (const hit of hits) {
      const { _id, _score, _source } = hit
      // Infer source field from _source keys
      const sourceField = Object.keys(_source).find(
        (key) => key.includes('_embedding') || key.includes('match')
      )?.replace(/_embedding|match/, '') || 'unknown'

      if (!mergedResults.has(_id) || mergedResults.get(_id)._score < _score) {
        mergedResults.set(_id, { _id, _score, _source, source: sourceField })
      }
    }
  })

  return [...mergedResults.values()]
    .sort((a, b) => b._score - a._score)
    .slice(0, topN)
}

const getSearchParameters = (indexName, query) => ({
  index: indexName,
  body: {
    size: config.openSearch.matchingDocuments,
    _source: {
      "excludes": ["*_embedding"]
    },
    query
  }
})

module.exports = {
  client,
  status,
  indexDocument,
  bulkIndexDocuments,
  deleteDocument,
  deleteAllButNewest,
  queryKnn,
  queryKnnScript,
  queryMatch,
  searchAndReturnTopResults,
  bruteForceKnnScript,
  mergeTopResults
}


