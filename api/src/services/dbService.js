const { query } = require("../wrappers/postgres")
const { logger } = require("../utils/logger")
const { config } = require("../config/config")

const getConversation = async (id) => {
  try {
    const result = await query("SELECT * FROM conversations WHERE id = $1", [id])
    return result.length ? result[0] : null
  } catch (err) {
    logger.error(err, "Error fetching conversation")
    throw err
  }
}

const listConversations = async () => {
  try {
    const result = await query("SELECT * FROM conversations order by create_date ASC")
    return result.length ? result : []
  } catch (err) {
    logger.error(err, "Error fetching conversations")
    throw err
  }
}

const createConversation = async () => {
  try {
    const rows = await query(
      `INSERT INTO conversations DEFAULT VALUES RETURNING id`.trim())
    // @ts-ignore
    return rows[0]?.id || null
  } catch (err) {
    logger.error(err, "Error storing conversation")
    throw err
  }
}

const getMessages = async (conversationId, recent = false) => {
  try {
    const queryAll = 'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY create_date ASC'
    const queryRecent = `
    SELECT * FROM (
      SELECT * FROM messages 
      WHERE conversation_id = $1
      ORDER BY create_date DESC 
      LIMIT $2
    ) sub
    ORDER BY create_date ASC;`

    const queryText = recent ? queryRecent : queryAll
    const params = [conversationId]
    if (recent) params.push(config.chat.recentMessagesMax)

    const result = await query(queryText, params)
    
    return result || null
  } catch (e) {
    logger.error(e, 'Error fetching messages')
    throw e
  }
}

const createMessage = async ({ convId, role, content }) => {
  try {
    await query(
      `INSERT INTO messages (conversation_id, role, content)
        VALUES ($1, $2, $3)`.trim(),
      [convId, role, content]
    )
  } catch (err) {
    logger.error({ error: err, convId, role, content }, "Error storing message")
    throw err
  }
}

module.exports = {
  getConversation,
  listConversations,
  createConversation,
  getMessages,
  createMessage
}