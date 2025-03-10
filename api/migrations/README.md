# Project Migrations
## Flyway
* docker-compose.yml defines a flyway container that will executes the migrations stored in `migrations/flyway/sql`
* The configuration under `migrations/flyway/config` are not used by docker, they are there for running migrations manually against other environments
* The flyway container is dependant on a successful health of the postgres contianer to insure it's ready to take migrations

## Opensearch
### Indexes
* docker-compose.yml defines a flyway container that executes script `src/utils/scripts/opensearchAutomation.js`
* This will create the index needed for the Questions and answers data, generate embeddings for the questions and answers and index the resulting documents
