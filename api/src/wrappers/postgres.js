const pg = require("pg")
const { config } = require("../config/config")
const { logger } = require("../utils/logger")

const { Pool } = pg

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database
})

pool.on("connect", () => logger.info("Connected to PostgreSQL"))
pool.on("error", (err) => logger.error(err, "PostgreSQL error"))

// Map all snake_case fields from DB columns to camelCase fields
const query = async (text, params) => {
  const { rows } = await pool.query(text, params)
  return rows.map(ccFields)
}

//const query = async (text, params) => await pool.query(text, params)

const status = async () => {
  try {
    await query("SELECT 1") // Simple query to check DB connection
    return { status: "ok" }
  } catch (e) {
    logger.error(e, "Database connection failed")
    return { status: "error", error: e.message }
  }
}

// Camel cases fields from DB which are named with underscores
const ccFields = (dbObject) => {
  return Object.fromEntries(
    Object.entries(dbObject).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      value
    ])
  )
}

module.exports = {
  pool,
  status,
  query,
  ccFields
}
