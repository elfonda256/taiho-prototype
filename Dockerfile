# TAIHO DIGITAL FIELD DATA PLATFORM
# Multi-stage lightweight Dockerfile optimized for existing factory Linux servers

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

EXPOSE 5001

CMD ["node", "server/index.js"]
