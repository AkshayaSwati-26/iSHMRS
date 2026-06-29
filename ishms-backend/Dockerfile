FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma Client (build phase)
RUN npx prisma generate

EXPOSE 5000

# Start script: deploy migrations first, then run seed (if needed, seed checks if database contains data), then start server.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && npm start"]
