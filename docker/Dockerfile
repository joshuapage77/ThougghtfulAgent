# Use official Node.js image
FROM node:latest

# Set working directory inside the container
WORKDIR /api

# Copy only critical config files
COPY api/package.json api/package-lock.json ./

# .env only needed for overrides, copy if created
RUN test -f api/.env && cp api/.env . || echo ".env not found, skipping"

# Install dependencies inside the container
RUN npm install

# Default command (runs the script)
CMD ["node", "./src/utils/scripts/opensearchAutomate.js"]