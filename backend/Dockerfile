FROM node:18-bullseye-slim

WORKDIR /app

# Only install production deps in image
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p ./uploads /data/uploads

EXPOSE 5000

# Run DB migrations then start the server
CMD ["sh", "-c", "npm run migrate || true && npm run start"]
