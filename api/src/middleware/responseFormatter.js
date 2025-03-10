const { logger } = require("../utils/logger")

const responseMiddleware = async (ctx, next) => {
   try {
      await next()

      if (!ctx.status) ctx.status = 500

      ctx.body = {
         status: ctx.status,
         data: ctx.body ?? ctx.body ?? {},
         errors: ctx.errors || []
      }
   } catch (e) {
      logger.error(e)

      ctx.status = 500
      ctx.body = {
         status: 500,
         data: {},
         errors: [{ error: e.message }]
      }
   }
}

module.exports = responseMiddleware