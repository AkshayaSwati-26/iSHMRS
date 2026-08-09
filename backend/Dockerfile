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

# Start script: run migrations/push, optional seed, and start backend server
CMD ["sh", "-c", "(npx prisma migrate deploy || npx prisma db push --accept-data-loss) && (node prisma/seed.js || true) && npm start"]

