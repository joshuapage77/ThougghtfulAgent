const { getMessages, createMessage } = require('../services/dbService.js')
const { config } = require('../config/config.js')
const { searchQa } = require('../services/searchService.js')
const llm = require('../wrappers/llm.js')
const { getEmbedding } = require('../wrappers/embeddings.js')

const SYSTEM = 'system'
const ASSISTANT = 'assistant'
const USER = 'user'

const formatMessages = (messages) => {
   return messages.map(msg => {
      if (msg.role === SYSTEM || msg.role === ASSISTANT) return `[INST] ${msg.content} [/INST]`
      else return `${msg.content}`
   }).join('\n')
}

const cleanResponse = (response) => (response.replace("[INST]", "").replace("[/INST]", "").trim())

const ragCompletion = async (conversation, message) => {
   const convId = conversation.id
   const messageEmbedding = await getEmbedding(message)
   const qaContext = await searchQa(messageEmbedding)
   const history = (await getMessages(convId, true)).map(message => ({ role: message.role, content: message.content }))

   const messages = [
      newMessage(SYSTEM, config.prompts.systemPrompt.replace('{context}', qaContext.map(qa => `question: ${qa.question}\nanswer: ${qa.answer}\n`).join('\n'))),
      ...history,
      newMessage(USER, message)
   ]

   const finalPrompt = formatMessages(messages)
   const result = await llm.completion(finalPrompt)
   const cleanedResponse = cleanResponse(result.text)
   await createMessage({ convId, role: USER, content: message })
   await createMessage({ convId, role: ASSISTANT, content: cleanedResponse })
   return cleanedResponse
}

const newMessage = (role, content) => ({ role, content })

module.exports = {
   ragCompletion,
   newMessage,
   roles: {
      SYSTEM,
      ASSISTANT,
      USER
   }
}