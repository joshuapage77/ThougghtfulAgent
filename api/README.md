# ThoughtfulAi Backend
Build with KOA framework

## Structure
This is a layed application built on KOA framework
* **Handlers** - top layer that implements at route and handles validation and return
* **Orchestrators** - Main business logic layer, utilizing multiple services or direct calls to wrappers to satisfy a request
* **Services** - Abstracts wrappers from the perspective of the applications concepts
* **Wrappers** - Interface to services external to the application (dbs, cloud based services, etc). Implements helper methods that enrich base client functionality but remain generic with on application context (can make it easier to query for instance, but not query for `messages`). The test is anything in this layer should be able to be picked up and dropped in an unrelated app

## Logic
### FE Flow
* New session (FE starts up)
  * Initialize Conversation
  * `post /chat`
    * returns conversation ID
    * FE stores conversation ID in a cookie
* Returning Sessions
  * get the conversation ID from the cookie
  * get the conversation history (messages)
  * `get /chat/:convId`
* Chatting
  * FE users enters text and hits send
    * `post /chat/:convId`
      * returns next response to add to conversation history

### RAG Detail
* For each Question an answer, embeddings are calculated and the resulting document with q/a and embeddings are indexed into opensearch (see [opensearchAutomate.js](https://github.com/joshuapage77/ThougghtfulAgent/blob/master/api/src/utils/scripts/opensearchAutomate.js))
* [chat.js](https://github.com/joshuapage77/ThougghtfulAgent/blob/master/api/src/orchestrators/chat.js) implements a function for rag
  * gets the embedding for the message
  * searches opensearch for Answers and Questions (using embeddings)
  * resulting documents are merged, sorted by relevance, and the top n pulled ([see searchService.js](https://github.com/joshuapage77/ThougghtfulAgent/blob/master/api/src/services/searchService.js))
  * the result are filtered by a threshold defined in config (don't include poor matches)
  * The final documents (question answers groups) are added to the prompt context
