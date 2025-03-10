const dotenv = require("dotenv")
const fs = require('fs').promises
const path = require('path')

dotenv.config()

const config = {
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'p0stgr3s',
    database: process.env.POSTGRES_DB || 'thoughtful_db'
  },
  openSearch: {
    host: process.env.OPENSEARCH_HOST || 'http://localhost',
    port: Number(process.env.OPENSEARCH_PORT) || 9200,
    matchingDocuments: Number(process.env.OPENSEARCH_MATCHING_DOCUMENTS) || 10,
    thresholds: {
      messageMatch: Number(process.env.OPENSEARCH_MESSAGE_MATCH_THRESHOLD) || 0.5
    },
    indexes: {
      qa: 'qa-index',
    }
  },
  chat: {
    model: process.env.CHAT_LLM_MODEL || 'mistral-7b-openorca.gguf2.Q4_0.gguf',
    recentMessagesMax: Number(process.env.RECENT_MESSAGES_MAX) || 30,
    intoMessage: process.env.CHAT_INTRO || `Hi! I'm the ThoughtfulAi Agent and I would be happy to answer your questions about ThoughtfulAi! I can also tell you about the technology I was built on.`
  },
  prompts: {
    systemPrompt: 'prompt did not load'
  },
  environment: process.env.ENVIRONMENT || 'DEV',
  async initialize() {
    config.prompts.systemPrompt = (await fs.readFile(path.join(__dirname, '../../prompts/system_prompt.txt'), 'utf8')).trim()
  }
}

module.exports = {
   config
}