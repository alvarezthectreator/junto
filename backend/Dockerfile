FROM node:18-bullseye-slim

WORKDIR /app

# Only install production deps in image
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p ./uploads /data/uploads

# Seed the persistent uploads volume with any committed media assets on first boot.
# This keeps existing Nearby demo media available after deployment, even before
# users upload new files into the mounted /data volume.
RUN cp -R ./uploads/. /data/uploads/ 2>/dev/null || true

EXPOSE 5000

# Run DB migrations then start the server
CMD ["sh", "-c", "cp -Rn ./uploads/. /data/uploads/ 2>/dev/null || true && npm run migrate || true && npm run start"]
