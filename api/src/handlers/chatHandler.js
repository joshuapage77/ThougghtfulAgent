const { createConversation, getMessages, listConversations, getConversation } = require('../services/dbService')
const { logger } = require('../utils/logger')
const { config } = require('../config/config')
const { ragCompletion, newMessage, roles } = require('../orchestrators/chat')
const llm = require ('../wrappers/llm')


// Called when the FE first starts up and doesn't have a cookie with a previous conversation id
// Returns conversation id
exports.init = async (ctx) => {
   try {
      // Insert new conversation record
      const newConvId = await createConversation()
      
      logger.info(`New conversation created: ${newConvId}`)
      ctx.status = 200
      ctx.body = { conversationId: newConvId }
   } catch (e) {
      logger.error(e, "Error initializing conversation")
      ctx.status = 500
      ctx.error = "Internal Server Error"
   }
}

exports.list = async (ctx) => {
   const conversations = await listConversations()
   ctx.status = 200
   ctx.body = { conversations: conversations.map(({ id, createDate }) => ({ id, createDate })) }
}

// returns historical messages
exports.history = async (ctx) => {
   const convId = ctx.params.convId
   const history = await getMessages(convId)
   history.unshift(newMessage(roles.ASSISTANT, config.chat.intoMessage))

   ctx.status = 200
   ctx.body = { messages: history.map(msg => ({ createDate: msg.createDate, role: msg.role, content: msg.content })) }
}

exports.send = async (ctx) => {
   const requestBody = ctx.request.body || {}
   const message = requestBody.message
   const convId = ctx.params.convId

   const conversation = await getConversation(convId)
   if (conversation === null) throw new Error(`Conversation does not exist: ${convId}`)

   if (!message) return {
      status: 400,
      error: 'no message field provided in json body'
   }

   ctx.body = await ragCompletion(conversation, message)
   ctx.status = 200
}
