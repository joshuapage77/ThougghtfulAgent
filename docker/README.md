# Docker Services
## Opensearch
* opensearch-qa-1
   * primary of 2 node cluster
* opensearch-qa-2
   * secondary of 2 node cluster
* opensearch-qa-dashboards
   * dashboard to inspect data. index pattern has been auto generated
* opensearch-qa-init
   * Initializes and manages data changes for opensearch
   * Executes opensearchAutomation.js and exits
   * Dependant on opensearch-qa-1 reaching a healthly state
* .env file holds a default password needed for opensearch initialization
   * this is not a security risk, it is only for local development
   * production deployments should use environment injection
## Postgres
* postgres-qa
   * holds relational conversation and message data
* flyway-qa
   * Executes flyway migration and exits
   * Dependant on postgres-qa reaching a healthly state
