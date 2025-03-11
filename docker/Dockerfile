# Use official Node.js image
FROM node:latest

# Set working directory inside the container
WORKDIR /api

# Copy only critical config files
COPY api/package.json api/package-lock.json ./
COPY api/.env ./

# Install dependencies inside the container
RUN npm install

# Default command (runs the script)
CMD ["node", "./src/utils/scripts/opensearchAutomate.js"]